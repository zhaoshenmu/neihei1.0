/**
 * workflow-store.ts
 * 
 * 工作流管理 - 持久化到 localStorage
 * 
 * 功能：
 * - 保存工作流（画布上所有节点、边、位置）
 * - 加载工作流
 * - 删除工作流（单个/批量）
 * - 列表显示
 */

import { create } from 'zustand';

export interface WorkflowEntry {
  id: string;
  name: string;
  /** ISO timestamp of when it was saved */
  savedAt: string;
  /** The serialized flow data */
  data: any;
}

interface WorkflowStore {
  workflows: WorkflowEntry[];
  /** 选中的工作流 ID（用于批量删除） */
  selectedIds: Set<string>;

  /** 保存工作流 */
  saveWorkflow: (name: string, data: any) => void;
  /** 加载工作流 */
  loadWorkflow: (id: string) => WorkflowEntry | undefined;
  /** 删除单个工作流 */
  deleteWorkflow: (id: string) => void;
  /** 批量删除 */
  deleteSelected: () => void;
  /** 切换选中 */
  toggleSelect: (id: string) => void;
  /** 全选/取消全选 */
  selectAll: () => void;
  /** 取消全选 */
  deselectAll: () => void;
  /** 重命名工作流 */
  renameWorkflow: (id: string, newName: string) => void;
}

const STORAGE_KEY = 'neihei_workflows';

function loadFromStorage(): WorkflowEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveToStorage(workflows: WorkflowEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workflows));
  } catch {}
}

export const useWorkflowStore = create<WorkflowStore>((set, get) => ({
  workflows: loadFromStorage(),
  selectedIds: new Set<string>(),

  saveWorkflow: (name, data) => {
    const entry: WorkflowEntry = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name,
      savedAt: new Date().toISOString(),
      data,
    };
    const workflows = [...get().workflows, entry];
    saveToStorage(workflows);
    set({ workflows });
  },

  loadWorkflow: (id) => {
    return get().workflows.find(w => w.id === id);
  },

  deleteWorkflow: (id) => {
    const workflows = get().workflows.filter(w => w.id !== id);
    const selectedIds = new Set(get().selectedIds);
    selectedIds.delete(id);
    saveToStorage(workflows);
    set({ workflows, selectedIds });
  },

  deleteSelected: () => {
    const selected = get().selectedIds;
    const workflows = get().workflows.filter(w => !selected.has(w.id));
    saveToStorage(workflows);
    set({ workflows, selectedIds: new Set() });
  },

  toggleSelect: (id) => {
    const selectedIds = new Set(get().selectedIds);
    if (selectedIds.has(id)) {
      selectedIds.delete(id);
    } else {
      selectedIds.add(id);
    }
    set({ selectedIds });
  },

  selectAll: () => {
    const selectedIds = new Set(get().workflows.map(w => w.id));
    set({ selectedIds });
  },

  deselectAll: () => {
    set({ selectedIds: new Set() });
  },

  renameWorkflow: (id, newName) => {
    const workflows = get().workflows.map(w =>
      w.id === id ? { ...w, name: newName } : w
    );
    saveToStorage(workflows);
    set({ workflows });
  },
}));
