/**
 * undo-store.ts
 *
 * 撤销/重做状态管理
 * 记录画布节点和边的历史快照，支持 Ctrl+Z / Ctrl+Shift+Z
 *
 * 设计原则：
 * - 独立于 canvas-store，职责单一
 * - 每次关键操作前自动快照
 * - 最大历史 50 步（防止内存溢出）
 * - 只记录 nodes/edges，不记录选中状态（视觉非破坏性）
 */
import { create } from 'zustand';
import type { Node, Edge } from '@xyflow/react';
import { useCanvasStore } from '@/store/canvas-store';

interface CanvasSnapshot {
  nodes: Node[];
  edges: Edge[];
}

interface UndoState {
  /** 历史栈（前进方向：索引 0 为最早） */
  undoStack: CanvasSnapshot[];
  /** 重做栈（前进方向：索引 0 为最早） */
  redoStack: CanvasSnapshot[];
  /** 是否可撤销 */
  canUndo: boolean;
  /** 是否可重做 */
  canRedo: boolean;

  /** 保存当前状态快照（在关键操作前调用） */
  snapshot: () => void;
  /** 撤销：从历史栈恢复并推送当前状态到重做栈 */
  undo: () => void;
  /** 重做：从重做栈恢复并推送当前状态到历史栈 */
  redo: () => void;
  /** 清空历史（新建画布时调用） */
  clear: () => void;
}

const MAX_HISTORY = 50;

/**
 * 深拷贝 nodes/edges（避免引用突变导致历史被篡改）
 */
function cloneSnapshot(nodes: Node[], edges: Edge[]): CanvasSnapshot {
  return {
    nodes: JSON.parse(JSON.stringify(nodes)),
    edges: JSON.parse(JSON.stringify(edges)),
  };
}

export const useUndoStore = create<UndoState>()((set, get) => ({
  undoStack: [],
  redoStack: [],
  canUndo: false,
  canRedo: false,

  /** 保存当前画布状态快照（在关键操作前由 canvas-store 调用） */
  snapshot: () => {
    const { nodes, edges } = useCanvasStore.getState();
    const snapshot = cloneSnapshot(nodes, edges);
    const { undoStack } = get();

    // 避免重复记录完全相同的状态
    const last = undoStack[undoStack.length - 1];
    if (last && JSON.stringify(last) === JSON.stringify(snapshot)) {
      return;
    }

    const newStack = [...undoStack, snapshot].slice(-MAX_HISTORY);
    set({
      undoStack: newStack,
      redoStack: [],
      canUndo: newStack.length > 0,
      canRedo: false,
    });
  },

  /** 撤销：回到上一步 */
  undo: () => {
    const { undoStack, redoStack } = get();
    if (undoStack.length === 0) return;

    // 弹出上一个快照
    const prev = undoStack[undoStack.length - 1];
    const newUndoStack = undoStack.slice(0, -1);

    // 当前状态推入重做栈
    const { nodes: currentNodes, edges: currentEdges } = useCanvasStore.getState();
    const currentSnapshot = cloneSnapshot(currentNodes, currentEdges);
    const newRedoStack = [...redoStack, currentSnapshot].slice(-MAX_HISTORY);

    // 恢复历史状态到 canvas-store
    useCanvasStore.getState().loadCanvas(prev.nodes, prev.edges);

    set({
      undoStack: newUndoStack,
      redoStack: newRedoStack,
      canUndo: newUndoStack.length > 0,
      canRedo: true,
    });
  },

  /** 重做：恢复被撤销的操作 */
  redo: () => {
    const { redoStack } = get();
    if (redoStack.length === 0) return;

    // 弹出重做栈顶
    const next = redoStack[redoStack.length - 1];
    const newRedoStack = redoStack.slice(0, -1);

    // 恢复状态到 canvas-store
    useCanvasStore.getState().loadCanvas(next.nodes, next.edges);

    set({
      redoStack: newRedoStack,
      canRedo: newRedoStack.length > 0,
      canUndo: true,
    });
  },

  clear: () => {
    set({
      undoStack: [],
      redoStack: [],
      canUndo: false,
      canRedo: false,
    });
  },
}));
