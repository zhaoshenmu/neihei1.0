/**
 * engine.test.ts
 *
 * 数据流引擎单元测试
 * 覆盖：propagateFromNode 核心逻辑、节流、错误处理
 *
 * 注意事项：
 *   - engine.ts 中的 lastPropagation 是模块级变量，测试间需确保不同 nodeId
 *   - 使用唯一 nodeId 避免跨测试节流干扰
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks (top-level, per vitest requirement) ──
vi.mock('@/services/ai-service', () => ({ callAi: vi.fn() }));
vi.mock('@/store/canvas-store', () => ({
  useCanvasStore: { getState: vi.fn(), subscribe: vi.fn(() => vi.fn()) },
}));
vi.mock('@/store/log-store', () => ({ useLogStore: { getState: vi.fn() } }));
vi.mock('@/store/execution-store', () => ({ useExecutionStore: { getState: vi.fn() } }));

import { propagateFromNode } from './engine';
import { callAi } from '@/services/ai-service';
import { useCanvasStore } from '@/store/canvas-store';
import { useLogStore } from '@/store/log-store';
import { useExecutionStore } from '@/store/execution-store';

describe('propagateFromNode', () => {
  const mockAddLog = vi.fn();
  const mockSetRunning = vi.fn();
  const mockSetSuccess = vi.fn();
  const mockSetError = vi.fn();
  const mockUpdateNodeData = vi.fn();
  let testCounter = 0;

  /** 创建隔离的 store state，使用自增 testCounter 保证 nodeId 唯一 */
  function makeState(overrides?: { nodes?: any[]; edges?: any[] }) {
    testCounter++;
    return {
      nodes: overrides?.nodes ?? [],
      edges: overrides?.edges ?? [],
      dataVersion: testCounter,
      _hasHydrated: true,
      updateNodeData: mockUpdateNodeData,
    };
  }

  beforeEach(() => {
    vi.clearAllMocks();
    (useLogStore.getState as any).mockReturnValue({ addLog: mockAddLog });
    (useExecutionStore.getState as any).mockReturnValue({
      setRunning: mockSetRunning,
      setSuccess: mockSetSuccess,
      setError: mockSetError,
    });
    (useCanvasStore.getState as any).mockReturnValue(makeState());
  });

  it('应该跳过没有 text 数据的源节点', async () => {
    const nodeId = `skip-empty-${testCounter}`;
    (useCanvasStore.getState as any).mockReturnValue(
      makeState({ nodes: [{ id: nodeId, data: {} }] })
    );
    await propagateFromNode(nodeId);
    expect(callAi).not.toHaveBeenCalled();
  });

  it('应该跳过 text 为空的源节点', async () => {
    const nodeId = `skip-whitespace-${testCounter}`;
    (useCanvasStore.getState as any).mockReturnValue(
      makeState({ nodes: [{ id: nodeId, data: { text: '   ' } }] })
    );
    await propagateFromNode(nodeId);
    expect(callAi).not.toHaveBeenCalled();
  });

  it('应该为有 text 和出边的节点传播数据', async () => {
    const src = `happy-src-${testCounter}`;
    const tgt = `happy-tgt-${testCounter}`;
    (useCanvasStore.getState as any).mockReturnValue(
      makeState({
        nodes: [
          { id: src, data: { text: 'Hello world' } },
          { id: tgt, data: {} },
        ],
        edges: [{ id: 'e1', source: src, target: tgt }],
      })
    );
    (callAi as any).mockResolvedValue({ success: true, content: 'AI response' });

    await propagateFromNode(src);

    expect(callAi).toHaveBeenCalledWith([{ role: 'user', content: 'Hello world' }]);
    expect(mockUpdateNodeData).toHaveBeenCalledWith(tgt, {
      aiOutput: 'AI response',
      _aiLoading: false,
    });
  });

  it('传播失败时应设置目标节点为错误状态', async () => {
    const src = `error-src-${testCounter}`;
    const tgt = `error-tgt-${testCounter}`;
    (useCanvasStore.getState as any).mockReturnValue(
      makeState({
        nodes: [
          { id: src, data: { text: 'Hello world' } },
          { id: tgt, data: {} },
        ],
        edges: [{ id: 'e2', source: src, target: tgt }],
      })
    );
    (callAi as any).mockResolvedValue({ success: false, error: 'API timeout' });

    await propagateFromNode(src);

    expect(callAi).toHaveBeenCalled();
    expect(mockUpdateNodeData).toHaveBeenCalledWith(tgt, {
      aiOutput: '❌ API timeout',
      _aiError: 'API timeout',
      _aiLoading: false,
    });
    expect(mockSetError).toHaveBeenCalledWith(tgt, 'API timeout');
  });

  it('传播异常时应捕获并标记错误', async () => {
    const src = `exception-src-${testCounter}`;
    const tgt = `exception-tgt-${testCounter}`;
    (useCanvasStore.getState as any).mockReturnValue(
      makeState({
        nodes: [
          { id: src, data: { text: 'Hello world' } },
          { id: tgt, data: {} },
        ],
        edges: [{ id: 'e3', source: src, target: tgt }],
      })
    );
    (callAi as any).mockRejectedValue(new Error('Network error'));

    await propagateFromNode(src);

    expect(callAi).toHaveBeenCalled();
    expect(mockUpdateNodeData).toHaveBeenCalledWith(tgt, {
      aiOutput: '❌ Network error',
      _aiError: 'Network error',
      _aiLoading: false,
    });
    expect(mockSetError).toHaveBeenCalledWith(tgt, 'Network error');
  });

  it('节流机制应阻止短时间内重复调用', async () => {
    const src = `throttle-src-${testCounter}`;
    const tgt = `throttle-tgt-${testCounter}`;
    (useCanvasStore.getState as any).mockReturnValue(
      makeState({
        nodes: [
          { id: src, data: { text: 'Hello' } },
          { id: tgt, data: {} },
        ],
        edges: [{ id: 'e4', source: src, target: tgt }],
      })
    );
    (callAi as any).mockResolvedValue({ success: true, content: 'ok' });

    await propagateFromNode(src);
    expect(callAi).toHaveBeenCalledTimes(1);

    // 第二次调用同一 sourceId 应被节流
    await propagateFromNode(src);
    expect(callAi).toHaveBeenCalledTimes(1);
  });

  it('没有出边的节点不应传播', async () => {
    const src = `noedge-src-${testCounter}`;
    (useCanvasStore.getState as any).mockReturnValue(
      makeState({ nodes: [{ id: src, data: { text: 'Hello' } }] })
    );
    await propagateFromNode(src);
    expect(callAi).not.toHaveBeenCalled();
  });
});
