/**
 * 共享类型定义 - 统一导出
 *
 * 将分散在各处的共享类型集中到此处再 re-export，
 * 避免循环引用，也为后续增加新类型提供中心入口。
 */
export type {
  PluginNodeDefinition,
  PluginManifest,
  PluginRegistryEntry,
  PluginLoadResult,
  PortDefinition,
  PluginLifecycleState,
} from '@/plugin-system/plugin-types';

export type { DataPacket, Triple, DataFlowEdge } from '@/dataflow/data-packet';

/**
 * 世界编辑器/大纲流程相关类型
 * 定义在此处避免 types.ts 与 world-editor-flow-store.ts 重复定义
 */
export type WorldEditorTabId = 'setting' | 'world' | 'character' | 'plot' | 'consistency';

export type SignalStatus = 'waiting' | 'running' | 'done';

export type EditorMode = 'auto' | 'manual';
