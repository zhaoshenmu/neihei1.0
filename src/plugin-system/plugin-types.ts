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
  /** 节点固定ID（如 "001"），全局唯一，绑定节点类型，永不改变 */
  fixedId: string;
  /** 是否在节点库和菜单中隐藏（用于面板类插件） */
  hidden?: boolean;
  /** 面板插槽位置（仅对 hidden 面板类插件有效） */
  panelSlot?: PanelSlot;
  inputs?: PortDefinition[];
  outputs?: PortDefinition[];
  /** 节点计算代码（可选） 
   * 在 WebWorker 沙箱中执行，返回纯 JSON
   * 不提供则节点为纯 UI 节点，不参与计算 */
  execute?: string;
  defaultData?: Record<string, unknown>;
}

/**
 * 面板插槽位置
 * 面板类插件通过此声明在界面上的渲染位置
 */
export type PanelSlot = 'floating' | 'sidebar-bottom' | 'toolbar';

/**
 * 插件节点运行时接口
 * 每个插件文件必须导出一个符合此接口的对象
 * component = 画布节点渲染组件
 * panel = (可选) 节点配置面板组件，用于悬浮窗和工作台
 */
export interface PluginNodeDefinition {
  manifest: PluginManifest;
  component: React.ComponentType<NodeProps>;
  panel?: React.ComponentType<{ nodeId: string }>;
}

/**
 * 面板插件定义
 * 面板类插件（hidden: true）的运行时接口
 */
export interface PluginPanelDefinition {
  manifest: PluginManifest;
  /** 面板渲染组件，自己管理开关状态和 UI */
  PanelComponent: React.ComponentType;
}

/**
 * 面板注册条目
 */
export interface PluginPanelEntry {
  type: string;
  manifest: PluginManifest;
  PanelComponent: React.ComponentType;
  slot: PanelSlot;
  enabled: boolean;
  loadedAt: number;
}

/**
 * 插件注册表中的条目
 */
export interface PluginRegistryEntry {
  type: string;
  manifest: PluginManifest;
  component: React.ComponentType<NodeProps>;
  panel?: React.ComponentType<{ nodeId: string }>;
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
