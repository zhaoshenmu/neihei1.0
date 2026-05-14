/**
 * 画布状态管理
 * 使用 Zustand 管理画布上的节点、边和交互状态
 */
import { create } from 'zustand';
import type {
  Node,
  Edge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  Connection,
  NodeChange,
  EdgeChange,
  XYPosition,
} from '@xyflow/react';
import {
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
} from '@xyflow/react';

export interface CanvasState {
  /** 画布上的所有节点 */
  nodes: Node[];
  /** 画布上的所有边 */
  edges: Edge[];
  /** 选中的节点 ID 列表 */
  selectedNodeIds: string[];

  // 操作方法
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  addNode: (type: string, position: XYPosition, data?: Record<string, unknown>) => string;
  removeNodes: (ids: string[]) => void;
  removeEdges: (ids: string[]) => void;
  updateNodeData: (nodeId: string, data: Record<string, unknown>) => void;
  setSelectedNodes: (ids: string[]) => void;
  clearCanvas: () => void;
  /** 从外部导入画布数据（用于加载保存的文件） */
  loadCanvas: (nodes: Node[], edges: Edge[]) => void;
}

let nodeIdCounter = 0;
function generateNodeId(): string {
  nodeIdCounter += 1;
  return `node_${Date.now()}_${nodeIdCounter}`;
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeIds: [],

  onNodesChange: (changes: NodeChange[]) => {
    set({ nodes: applyNodeChanges(changes, get().nodes) });
  },

  onEdgesChange: (changes: EdgeChange[]) => {
    set({ edges: applyEdgeChanges(changes, get().edges) });
  },

  onConnect: (connection: Connection) => {
    set({ edges: addEdge(connection, get().edges) });
  },

  addNode: (type: string, position: XYPosition, data?: Record<string, unknown>) => {
    const id = generateNodeId();
    const newNode: Node = {
      id,
      type,
      position,
      data: data || { label: type },
    };
    set({ nodes: [...get().nodes, newNode] });
    return id;
  },

  removeNodes: (ids: string[]) => {
    set({
      nodes: get().nodes.filter(n => !ids.includes(n.id)),
      edges: get().edges.filter(
        e => !ids.includes(e.source) && !ids.includes(e.target)
      ),
    });
  },

  removeEdges: (ids: string[]) => {
    set({ edges: get().edges.filter(e => !ids.includes(e.id)) });
  },

  updateNodeData: (nodeId: string, data: Record<string, unknown>) => {
    set({
      nodes: get().nodes.map(n =>
        n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n
      ),
    });
  },

  setSelectedNodes: (ids: string[]) => {
    set({ selectedNodeIds: ids });
  },

  clearCanvas: () => {
    set({ nodes: [], edges: [], selectedNodeIds: [] });
  },

  loadCanvas: (nodes: Node[], edges: Edge[]) => {
    set({ nodes, edges, selectedNodeIds: [] });
  },
}));
