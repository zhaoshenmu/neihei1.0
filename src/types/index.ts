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
