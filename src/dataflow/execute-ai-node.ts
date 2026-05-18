/**
 * execute-ai-node.ts
 *
 * 统一的 AI 节点执行函数
 *
 * 解决 P1-1：dataflow/engine.ts 和 hooks/useRunHandler.ts 中
 * 高度雷同的 AI 调用逻辑。两处均改为调用此公共函数。
 *
 * 流程：
 * 1. 读取源节点的 text
 * 2. 调用 AI service
 * 3. 将结果写入目标节点的 aiOutput
 * 4. 更新 execution-store 状态（运行/成功/错误）
 * 5. 写入日志
 */
import { useCanvasStore } from '@/store/canvas-store';
import { useLogStore } from '@/store/log-store';
import { useExecutionStore } from '@/store/execution-store';
import { useApiConnectionStore } from '@/store/api-connection-store';
import { callAi } from '@/services/ai-service';

/** 源节点类型 → 读取 data 中哪个字段 */
const SOURCE_DATA_KEY = 'text';

/** 目标节点类型 → AI 结果写入 data 中哪个字段 */
const TARGET_DATA_KEY = 'aiOutput';

export interface ExecuteAiNodeParams {
  sourceNodeId: string;
  targetNodeId: string;
  /** 可选：自定义提示词（若不传则从 source 节点 data.text 读取） */
  prompt?: string;
  /** 可选：添加日志时的前缀标签 */
  logTag?: string;
}

export interface ExecuteAiNodeResult {
  success: boolean;
  content?: string;
  error?: string;
}

/**
 * 执行一个 AI 节点：
 *  - 读取 source 节点的 text → 调用 AI → 写入 target 节点的 aiOutput
 *  - 更新 execution-store 状态
 *  - 写入日志
 */
export async function executeAiNode({
  sourceNodeId,
  targetNodeId,
  prompt,
  logTag = '',
}: ExecuteAiNodeParams): Promise<ExecuteAiNodeResult> {
  const { nodes } = useCanvasStore.getState();
  const sourceNode = nodes.find((n) => n.id === sourceNodeId);
  const targetNode = nodes.find((n) => n.id === targetNodeId);

  if (!sourceNode || !targetNode) {
    return { success: false, error: '源节点或目标节点不存在' };
  }

  const text = prompt ?? (sourceNode.data?.[SOURCE_DATA_KEY] as string);
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return { success: false, error: '源节点没有输入内容' };
  }

  const prefix = logTag ? `[${logTag}] ` : '';
  const addLog = useLogStore.getState().addLog;
  const execStore = useExecutionStore.getState();

  addLog({
    type: 'info',
    message: `${prefix}${sourceNodeId} → ${targetNodeId} : "${text.substring(0, 30)}..."`,
  });

  // 运行前清空上次的结果
  useCanvasStore.getState().updateNodeData(targetNodeId, {
    [TARGET_DATA_KEY]: '',
    _aiLoading: true,
  });

  execStore.setRunning(sourceNodeId);
  execStore.setRunning(targetNodeId);

  try {
    const result = await callAi([{ role: 'user', content: text }]);

    if (result.success) {
      useCanvasStore.getState().updateNodeData(targetNodeId, {
        [TARGET_DATA_KEY]: result.content,
        _aiLoading: false,
      });

      execStore.setSuccess(sourceNodeId, { text });
      execStore.setSuccess(targetNodeId, result.content);

      addLog({
        type: 'success',
        message: `${prefix}AI 回复已写入 ${targetNodeId}`,
        detail: result.content.substring(0, 100),
      });

      return { success: true, content: result.content };
    } else {
      useCanvasStore.getState().updateNodeData(targetNodeId, {
        [TARGET_DATA_KEY]: `❌ ${result.error}`,
        _aiError: result.error,
        _aiLoading: false,
      });

      execStore.setError(targetNodeId, result.error || '未知错误');
      execStore.setSuccess(sourceNodeId, { text });

      if (result.apiId) {
        useApiConnectionStore.getState().setStatus(result.apiId, 'disconnected');
      }

      addLog({
        type: 'error',
        message: `${prefix}AI 调用失败 [${targetNodeId}]`,
        detail: result.error,
      });

      return { success: false, error: result.error };
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);

    useCanvasStore.getState().updateNodeData(targetNodeId, {
      [TARGET_DATA_KEY]: `❌ ${errorMsg}`,
      _aiError: errorMsg,
      _aiLoading: false,
    });

    execStore.setError(targetNodeId, errorMsg);
    execStore.setSuccess(sourceNodeId, { text });

    addLog({
      type: 'error',
      message: `${prefix}执行异常 [${targetNodeId}]`,
      detail: errorMsg,
    });

    return { success: false, error: errorMsg };
  }
}
