/**
 * 插件系统类型定义
 * 定义插件节点需要实现的接口和类型
 */
import { type NodeProps } from '@xyflow/react';

/**
 * 端口定义 - 节点上的连接点
 */
export interface PortDefinition {
  id: string;
  label: string;
  type: 'input' | 'output';
  dataType?: string; // 数据类型描述，如 'string', 'number', 'object'
}

/**
 * 插件节点配置元数据
 * 对应 manifest.json 的结构
 */
export interface PluginManifest {
  type: string;
  label: string;
  category: string;
  description?: string;
  version?: string;
  author?: string;
  icon?: string;
  inputs?: PortDefinition[];
  outputs?: PortDefinition[];
  defaultData?: Record<string, unknown>;
}

/**
 * 插件节点运行时接口
 * 每个插件文件必须导出一个符合此接口的对象
 */
export interface PluginNodeDefinition {
  manifest: PluginManifest;
  component: React.ComponentType<NodeProps>;
}

/**
 * 插件注册表中的条目
 */
export interface PluginRegistryEntry {
  type: string;
  manifest: PluginManifest;
  component: React.ComponentType<NodeProps>;
  enabled: boolean;
  loadedAt: number;
}

/**
 * 插件生命周期状态
 */
export type PluginLifecycleState = 
  | 'registered'
  | 'loading'
  | 'loaded'
  | 'error'
  | 'disabled';

/**
 * 插件加载结果
 */
export interface PluginLoadResult {
  success: boolean;
  type?: string;
  error?: string;
  plugin?: PluginNodeDefinition;
}
