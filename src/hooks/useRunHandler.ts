/**
 * useRunHandler — 运行流程 hook
 *
 * 从 App.tsx 中抽离的运行逻辑，解决：
 * 1. 异步操作锁使用 useRef 替代 useState，避免闭包陷阱
 * 2. 硬编码字符串 'outline' / 'Outline' 引用常量
 * 3. handleRun 逻辑独立可测试
 * 4. 重复的 AI 调用逻辑统一使用 executeAiNode
 */
import { useCallback, useRef, useEffect } from 'react';
import { useCanvasStore } from '@/store/canvas-store';
import { useLogStore } from '@/store/log-store';
import { useWorldEditorFlowStore } from '@/store/world-editor-flow-store';
import { executeAiNode } from '@/dataflow/execute-ai-node';

/** 世界编辑器节点 type 常量（必须与 manifest.json 中一致） */
const WORLD_EDITOR_NODE_TYPE = 'world-editor';

/**
 * 运行流程 hook
 * @returns handleRun 函数 和 runState
 */
export function useRunHandler() {
  /** 使用 useRef 替代 useState 作为异步操作锁，避免闭包陷阱 */
  const isRunningRef = useRef(false);
  /** 同步到 UI 的状态值，便于组件渲染 */
  const runStateRef = useRef<'idle' | 'running'>('idle');

  // 订阅世界编辑器的运行状态
  const flowIsRunning = useWorldEditorFlowStore((s) => s.isRunning);

  /**
   * 获取当前运行状态（供外部组件使用）
   */
  const getRunState = useCallback(() => runStateRef.current, []);

  /**
   * 同步世界编辑器运行状态到 runState
   */
  useEffect(() => {
    const { nodes } = useCanvasStore.getState();
    const hasOutlineNode = nodes.some(
      (n) => n.type === WORLD_EDITOR_NODE_TYPE || n.type?.includes('Outline')
    );
    if (hasOutlineNode) {
      runStateRef.current = flowIsRunning ? 'running' : 'idle';
    }
  }, [flowIsRunning]);

  /**
   * 主要运行逻辑
   */
  const handleRun = useCallback(async () => {
    // 异步操作锁 — 运行时禁止重复点击
    if (isRunningRef.current) {
      console.warn('[运行] 正在执行中，请等待完成');
      return;
    }

    isRunningRef.current = true;
    runStateRef.current = 'running';

    const addLog = useLogStore.getState().addLog;
    const { nodes } = useCanvasStore.getState();

    // 检测画布上是否有 OutlineNode（世界编辑器）
    const outlineNode = nodes.find(
      (n) => n.type === WORLD_EDITOR_NODE_TYPE || n.type?.includes('Outline')
    );

    if (outlineNode) {
      // 触发世界编辑器流程
      addLog({ type: 'info', message: '[运行] 检测到世界编辑器节点，启动流程...' });
      useWorldEditorFlowStore.getState().triggerExternalRun();
      isRunningRef.current = false;
      runStateRef.current = 'idle';
      return;
    }

    // 原有逻辑：遍历所有边，提取源节点 text → 调 AI → 写入目标节点 aiOutput
    // 使用统一函数 executeAiNode 简化代码
    const { edges } = useCanvasStore.getState();

    if (edges.length === 0) {
      addLog({ type: 'info', message: '[运行] 没有连线，跳过' });
      isRunningRef.current = false;
      runStateRef.current = 'idle';
      return;
    }

    addLog({ type: 'info', message: `[运行] 开始处理 ${edges.length} 条连线...` });

    try {
      for (const edge of edges) {
        const sourceNode = nodes.find((n) => n.id === edge.source);
        const targetNode = nodes.find((n) => n.id === edge.target);

        if (!sourceNode || !targetNode) continue;

        await executeAiNode({
          sourceNodeId: sourceNode.id,
          targetNodeId: targetNode.id,
          logTag: '运行',
        });
      }

      addLog({ type: 'success', message: '[运行] 全部处理完成' });
    } finally {
      isRunningRef.current = false;
      runStateRef.current = 'idle';
    }
  }, []);

  return {
    handleRun,
    /** 供外部组件读取当前运行状态的 getter */
    getRunState,
    /** 直接返回当前 ref 值供响应式渲染（通过订阅） */
    runState: runStateRef.current,
  };
}
