/**
 * 计数器节点 - 带报错测试的交互式节点
 * 
 * 功能：
 * 1. 计数功能（加减）
 * 2. 「执行测试」按钮 → 触发 Worker 沙箱执行
 * 3. manifest 中的 execute 代码故意写错，用于测试节点隔离报错
 * 
 * 测试目的：
 * - 执行出错时，只有这个节点变红
 * - 其他节点（如 HelloNode）不受影响
 * - 错误信息显示在节点内部
 * - 错误信息同步到日志面板
 */
import React, { useState } from 'react';
import type { NodeProps } from '@xyflow/react';
import { WorkerPool } from '@/runtime';
import { useExecutionStore } from '@/store/execution-store';
import { useLogStore } from '@/store/log-store';

const workerPool = new WorkerPool();
const TIMEOUT_MS = 5000;

const CounterNode: React.FC<NodeProps> = ({ id }) => {
  const [count, setCount] = useState(0);
  const nodeState = useExecutionStore(s => s.states[id]);
  const addLog = useLogStore(s => s.addLog);

  const handleExecute = async () => {
    const execStore = useExecutionStore.getState();

    // 获取 manifest 中配置的 execute 代码
    // 这里直接硬编码了测试代码（实际应从 pluginRegistry 获取）
    // 这段代码故意写错：访问 undefined 的 toString()
    const brokenCode = `
      // 💥 故意写错：访问 undefined 的属性
      const x = undefined;
      return { value: x.toString() };
    `;

    // 1. 标记为运行中 → 边框变蓝
    execStore.setRunning(id);
    addLog({ type: 'info', message: `[计数器] 节点 ${id} 开始执行...` });

    try {
      // 2. 在 Worker 沙箱中执行
      const result = await workerPool.run(brokenCode, { count }, TIMEOUT_MS);

      // 3. 成功 → 边框变绿
      execStore.setSuccess(id, result);
      addLog({ type: 'success', message: `[计数器] 节点 ${id} 执行成功`, detail: JSON.stringify(result) });
    } catch (err) {
      // 4. ❗ 出错 → 只这个节点变红，不影响其他节点
      const errorMsg = err instanceof Error ? err.message : String(err);
      execStore.setError(id, errorMsg);
      addLog({ type: 'error', message: `[计数器] 节点 ${id} 执行失败`, detail: errorMsg });
      // 错误不会逃逸到这里之外
    }
  };

  return (
    <div
      style={{
        padding: '8px 12px',
        color: '#b0b0b0',
        fontSize: 13,
        textAlign: 'center',
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
      }}
    >
      <div style={{ fontSize: 28, marginBottom: 4, opacity: 0.6 }}>
        🔢
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, color: '#e0e0e0', marginBottom: 8 }}>
        {count}
      </div>
      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 6 }}>
        <button
          onClick={() => setCount(c => c - 1)}
          style={{
            background: '#2a2a2a',
            border: '1px solid #444',
            borderRadius: 4,
            color: '#ccc',
            padding: '4px 12px',
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          -1
        </button>
        <button
          onClick={() => setCount(c => c + 1)}
          style={{
            background: '#2a2a2a',
            border: '1px solid #444',
            borderRadius: 4,
            color: '#ccc',
            padding: '4px 12px',
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          +1
        </button>
      </div>
      
      {/* 执行测试按钮 */}
      <button
        onClick={handleExecute}
        disabled={nodeState?.status === 'running'}
        style={{
          background: nodeState?.status === 'running' ? '#1a3a5a' : '#2a2a3a',
          border: `1px solid ${nodeState?.status === 'running' ? '#4a9eff' : '#555'}`,
          borderRadius: 4,
          color: nodeState?.status === 'running' ? '#4a9eff' : '#ccc',
          padding: '4px 12px',
          fontSize: 11,
          cursor: nodeState?.status === 'running' ? 'wait' : 'pointer',
          width: '100%',
        }}
      >
        {nodeState?.status === 'running' ? '⏳ 执行中...' : '▶ 执行测试（会报错）'}
      </button>

      {/* 节点内部显示执行状态 */}
      {nodeState?.status === 'success' && (
        <div style={{ color: '#66bb6a', fontSize: 11, marginTop: 6 }}>
          ✅ {JSON.stringify(nodeState.result)}
        </div>
      )}
    </div>
  );
};

export default CounterNode;
