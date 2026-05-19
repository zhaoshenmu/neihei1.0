/**
 * bookshelf-store.ts
 *
 * 书架快照状态管理
 * 保存和恢复画布完整状态（节点、边、面板数据、流程状态）
 *
 * 快照包含：
 * - canvas-store: nodes, edges, collapsedNodes
 * - panel-data-store: 所有节点的面板表单数据
 * - world-editor-flow-store: mode, currentStep, stepStatus
 *
 * 设计原则：
 * - 快照是纯数据，不依赖 React 组件
 * - 恢复时从各 store 同步读取最新状态
 * - 持久化到 localStorage
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Node, Edge } from '@xyflow/react';
import { useCanvasStore } from './canvas-store';
import { usePanelDataStore } from './panel-data-store';
import { useWorldEditorFlowStore } from './world-editor-flow-store';
import type { EditorMode, SignalStatus } from '@/types';
import type { WorldEditorTabId as TabId } from '@/types';

/** 一本书的快照数据 */
export interface BookSnapshot {
  /** 唯一标识 */
  id: string;
  /** 书名 */
  name: string;
  /** 保存时间戳 */
  timestamp: number;
  /** 画布状态 */
  canvas: {
    nodes: Node[];
    edges: Edge[];
    collapsedNodes: string[];
  };
  /** 所有节点的面板数据（按 nodeId 索引） */
  panelData: Record<string, Record<string, unknown>>;
  /** 流程状态 */
  flowState: {
    mode: EditorMode;
    currentStep: number;
    stepStatus: Record<TabId, SignalStatus>;
  };
}

interface BookshelfState {
  /** 所有保存的书 */
  books: BookSnapshot[];
  /** 当前选中的书 ID */
  selectedBookId: string | null;

  /** 保存当前画布状态为一本新书 */
  saveBook: (name: string) => void;
  /** 恢复指定书的快照到画布 */
  loadBook: (id: string) => void;
  /** 删除一本书 */
  deleteBook: (id: string) => void;
  /** 重命名一本书 */
  renameBook: (id: string, newName: string) => void;
  /** 用当前画布状态覆盖更新指定书（继存） */
  updateBook: (id: string) => void;
  /** 选中一本书 */
  selectBook: (id: string | null) => void;
  /** 获取选中书的详情 */
  getSelectedBook: () => BookSnapshot | null;
}

export const useBookshelfStore = create<BookshelfState>()(
  persist(
    (set, get) => ({
      books: [],
      selectedBookId: null,

      saveBook: (name: string) => {
        // 从各 store 同步读取最新状态
        const canvasState = useCanvasStore.getState();
        const panelData = usePanelDataStore.getState().data;
        const flowState = useWorldEditorFlowStore.getState();

        const newBook: BookSnapshot = {
          id: `book_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          name,
          timestamp: Date.now(),
          canvas: {
            nodes: canvasState.nodes,
            edges: canvasState.edges,
            collapsedNodes: canvasState.collapsedNodes,
          },
          panelData,
          flowState: {
            mode: flowState.mode,
            currentStep: flowState.currentStep,
            stepStatus: { ...flowState.stepStatus },
          },
        };

        set((state) => ({
          books: [...state.books, newBook],
        }));

        console.log(`[Bookshelf] 保存快照: "${name}" (${newBook.canvas.nodes.length} 个节点, ${newBook.canvas.edges.length} 条连线)`);
      },

      loadBook: (id: string) => {
        const book = get().books.find((b) => b.id === id);
        if (!book) {
          console.warn(`[Bookshelf] 未找到书: ${id}`);
          return;
        }

        // 恢复画布状态
        useCanvasStore.getState().loadCanvas(book.canvas.nodes, book.canvas.edges);

        // 恢复面板数据
        const panelStore = usePanelDataStore.getState();
        // 先清空再逐个恢复
        for (const [nodeId, nodeData] of Object.entries(book.panelData)) {
          for (const [key, value] of Object.entries(nodeData)) {
            panelStore.updateNodeData(nodeId, key, value);
          }
        }

        // 恢复流程状态
        const flowStore = useWorldEditorFlowStore.getState();
        flowStore.setMode(book.flowState.mode);
        flowStore.goToStep(book.flowState.currentStep);
        // 恢复每个步骤的状态
        for (const [tabId, status] of Object.entries(book.flowState.stepStatus)) {
          if (status === 'done') {
            flowStore.markStepDone(tabId as TabId);
          } else if (status === 'running') {
            flowStore.markStepRunning(tabId as TabId);
          } else {
            flowStore.markStepWaiting(tabId as TabId);
          }
        }

        console.log(`[Bookshelf] 恢复快照: "${book.name}"`);
      },

      deleteBook: (id: string) => {
        set((state) => ({
          books: state.books.filter((b) => b.id !== id),
          selectedBookId: state.selectedBookId === id ? null : state.selectedBookId,
        }));
      },

      renameBook: (id: string, newName: string) => {
        set((state) => ({
          books: state.books.map((b) =>
            b.id === id ? { ...b, name: newName } : b
          ),
        }));
      },

      updateBook: (id: string) => {
        const book = get().books.find((b) => b.id === id);
        if (!book) {
          console.warn(`[Bookshelf] 未找到要更新的书: ${id}`);
          return;
        }

        // 从各 store 同步读取最新状态
        const canvasState = useCanvasStore.getState();
        const panelData = usePanelDataStore.getState().data;
        const flowState = useWorldEditorFlowStore.getState();

        set((state) => ({
          books: state.books.map((b) =>
            b.id === id
              ? {
                  ...b,
                  timestamp: Date.now(),
                  canvas: {
                    nodes: canvasState.nodes,
                    edges: canvasState.edges,
                    collapsedNodes: canvasState.collapsedNodes,
                  },
                  panelData,
                  flowState: {
                    mode: flowState.mode,
                    currentStep: flowState.currentStep,
                    stepStatus: { ...flowState.stepStatus },
                  },
                }
              : b
          ),
        }));

        console.log(`[Bookshelf] 更新快照: "${book.name}" (${canvasState.nodes.length} 个节点, ${canvasState.edges.length} 条连线)`);
      },

      selectBook: (id: string | null) => {
        set({ selectedBookId: id });
      },

      getSelectedBook: () => {
        const { books, selectedBookId } = get();
        if (!selectedBookId) return null;
        return books.find((b) => b.id === selectedBookId) || null;
      },
    }),
    {
      name: 'neihei-bookshelf',
      partialize: (state) => ({
        books: state.books,
        selectedBookId: state.selectedBookId,
      }),
    }
  )
);
