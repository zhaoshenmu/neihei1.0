/**
 * dataflow/engine.ts
 *
 * 数据流引擎
 * 监听画布节点数据变化，通过连线自动传播数据
 * 当源节点数据变化且有出边时：
 *   1. 读取源节点 data.text
 *   2. 调用 AI service（使用当前选中的 API）
 *   3. 将 AI 回复写入目标节点的 data.aiOutput
 */
import { useCanvasStore } from '@/store/canvas-store';
import { callAi } from '@/services/ai-service';
import { useLogStore } from '@/store/log-store';
import { useExecutionStore } from '@/store/execution-store';

/** 源节点类型 → 读取 data 中哪个字段 */
const SOURCE_DATA_KEY = 'text';

/** 目标节点类型 → AI结果写入 data 中哪个字段 */
const TARGET_DATA_KEY = 'aiOutput';

/** 节流：同一 source node 的传播间隔（毫秒） */
const THROTTLE_MS = 800;

/** 各源节点上次传播时间 */
const lastPropagation: Record<string, number> = {};

/**
 * 核心传播函数
 * 当某个节点的数据变化时调用此函数
 */
export async function propagateFromNode(sourceNodeId: string) {
  const { nodes, edges } = useCanvasStore.getState();

  // 找到源节点
  const sourceNode = nodes.find((n) => n.id === sourceNodeId);
  if (!sourceNode) return;

  // 源节点必须有 text 数据
  const text = sourceNode.data?.[SOURCE_DATA_KEY];
  if (!text || typeof text !== 'string' || text.trim().length === 0) return;

  // 节流检查
  const now = Date.now();
  const last = lastPropagation[sourceNodeId] || 0;
  if (now - last < THROTTLE_MS) return;
  lastPropagation[sourceNodeId] = now;

    // 找到从该节点出发的所有边
    const outEdges = edges.filter((e) => e.source === sourceNodeId);

    // 对每条边的目标节点传播数据
    for (const edge of outEdges) {
      const targetNode = nodes.find((n) => n.id === edge.target);
      if (!targetNode) continue;

      const addLog = useLogStore.getState().addLog;
      const execStore = useExecutionStore.getState();

      addLog({
        type: 'info',
        message: `[数据流] ${sourceNodeId} → ${targetNode.id} : "${text.substring(0, 30)}..."`,
      });

      // 标记源节点和目标节点为运行中（边框变蓝）
      execStore.setRunning(sourceNodeId);
      execStore.setRunning(targetNode.id);

      try {
        // 调用 AI
        const result = await callAi([
          { role: 'user', content: text },
        ]);

        if (result.success) {
          // 写入目标节点 data
          useCanvasStore.getState().updateNodeData(targetNode.id, {
            [TARGET_DATA_KEY]: result.content,
            _aiLoading: false,
          });

          // 标记源节点和目标节点为成功（边框变绿）
          execStore.setSuccess(sourceNodeId, { text });
          execStore.setSuccess(targetNode.id, result.content);

          addLog({
            type: 'success',
            message: `[数据流] AI回复已写入 ${targetNode.id}`,
            detail: result.content.substring(0, 100),
          });
        } else {
          // 写入错误信息到目标节点
          useCanvasStore.getState().updateNodeData(targetNode.id, {
            [TARGET_DATA_KEY]: `❌ ${result.error}`,
            _aiError: result.error,
            _aiLoading: false,
          });

          // 目标节点标记为错误（边框变红），源节点标记为成功
          execStore.setError(targetNode.id, result.error || '未知错误');
          execStore.setSuccess(sourceNodeId, { text });

          addLog({
            type: 'error',
            message: `[数据流] AI调用失败 [${targetNode.id}]`,
            detail: result.error,
          });
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        useCanvasStore.getState().updateNodeData(targetNode.id, {
          [TARGET_DATA_KEY]: `❌ ${errorMsg}`,
          _aiError: errorMsg,
          _aiLoading: false,
        });

        // 目标节点标记为错误（边框变红），源节点标记为成功
        execStore.setError(targetNode.id, errorMsg);
        execStore.setSuccess(sourceNodeId, { text });

        addLog({
          type: 'error',
          message: `[数据流] 传播异常 [${targetNode.id}]`,
          detail: errorMsg,
        });
      }
    }
}

/**
 * 初始化数据流引擎（在 App 启动时调用）
 * 监听画布 store 的 nodes 变化，当节点数据更新时自动传播
 */
let initialized = false;
let unsubscribe: (() => void) | null = null;

export function initDataflowEngine() {
  if (initialized) return;
  initialized = true;

  console.log('[数据流引擎] 已启动');

  // 订阅 canvas-store 状态变化，监听 dataVersion 递增
  // Zustand v4 subscribe 接收完整 state，我们手动跟踪 dataVersion 变化
  let lastDataVersion = useCanvasStore.getState().dataVersion;
  unsubscribe = useCanvasStore.subscribe(() => {
    const { dataVersion } = useCanvasStore.getState();
    // 只在 dataVersion 增长时才触发，防止循环
    if (dataVersion <= lastDataVersion) return;
    lastDataVersion = dataVersion;

    // 延迟执行，等待状态稳定
    setTimeout(() => {
      const { nodes: currentNodes } = useCanvasStore.getState();
      if (currentNodes.length === 0) return;

      // 遍历所有节点，找到 data 中有 text 字段的、非 _aiLoading 的节点
      for (const node of currentNodes) {
        if (node.data?.text && typeof node.data.text === 'string' && node.data.text.trim().length > 0) {
          // 避免在 AI loading 期间重复传播
          if (node.data._aiLoading) continue;
          propagateFromNode(node.id).catch((err) => {
            console.error(`[数据流引擎] 传播失败 [${node.id}]:`, err);
          });
          break; // 每次只传播一个节点，防止风暴
        }
      }
    }, 100);
  });

  console.log('[数据流引擎] 订阅已建立');
}

/**
 * 停止数据流引擎（清理订阅）
 */
export function destroyDataflowEngine() {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
  initialized = false;
  console.log('[数据流引擎] 已停止');
}
