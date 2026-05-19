/**
 * 插件注册表 - 全局单例
 * 维护所有已注册插件的索引，提供查询和访问接口
 * 
 * 每个插件的固定ID（fixedId）写死在 manifest.json 中（如 "001"、"002"）
 * 同类型所有节点实例共享同一个 fixedId
 * 
 * 支持两种插件类型：
 * 1. 节点插件（hidden: false）— 注册为画布节点组件
 * 2. 面板插件（hidden: true） — 注册为面板组件，通过插槽渲染
 */
import type { 
  PluginNodeDefinition, 
  PluginRegistryEntry, 
  PluginPanelEntry,
  PluginLoadResult,
  PluginManifest,
  PanelSlot,
} from './plugin-types';

class PluginRegistry {
  private plugins: Map<string, PluginRegistryEntry> = new Map();
  /** 面板插件注册表 key = 插件类型 */
  private panels: Map<string, PluginPanelEntry> = new Map();
  private static instance: PluginRegistry;

  private constructor() {}

  static getInstance(): PluginRegistry {
    if (!PluginRegistry.instance) {
      PluginRegistry.instance = new PluginRegistry();
    }
    return PluginRegistry.instance;
  }

  /**
   * 注册一个插件
   * 支持幂等更新：如果已存在则更新组件，不报错
   * fixedId 从 manifest.json 中读取
   */
  register(pluginDef: PluginNodeDefinition): PluginLoadResult {
    const { manifest, component, panel } = pluginDef;
    const { type } = manifest;

    if (!type || typeof type !== 'string') {
      return {
        success: false,
        error: '插件缺少有效的 "type" 字段',
      };
    }

    if (!manifest.fixedId) {
      return {
        success: false,
        error: `插件 "${type}" 缺少 "fixedId" 字段（manifest.json 中必须定义）`,
      };
    }

    if (this.plugins.has(type)) {
      // 已存在则更新（幂等）
      const existing = this.plugins.get(type)!;
      existing.component = component;
      if (panel) existing.panel = panel;
      existing.manifest = manifest;
      existing.loadedAt = Date.now();
      return { success: true, type, plugin: pluginDef };
    }

    // 检查 fixedId 是否已被其他类型占用
    for (const [, entry] of this.plugins) {
      if (entry.manifest.fixedId === manifest.fixedId) {
        return {
          success: false,
          error: `fixedId "${manifest.fixedId}" 已被 "${entry.type}" 占用`,
        };
      }
    }

    this.plugins.set(type, {
      type,
      manifest,
      component,
      panel,
      enabled: true,
      loadedAt: Date.now(),
    });

    console.log(`[Registry] 注册插件 "${manifest.label}" → fixedId: ${manifest.fixedId}`);
    return { success: true, type, plugin: pluginDef };
  }

  /**
   * 注册面板插件
   * 面板类插件（hidden: true）通过此方法注册
   */
  registerPanel(
    type: string,
    manifest: PluginManifest,
    PanelComponent: React.ComponentType,
    slot: PanelSlot = 'floating'
  ): boolean {
    if (!type || !PanelComponent) {
      console.warn(`[Registry] 面板注册失败: 缺少 type 或 PanelComponent`);
      return false;
    }

    if (this.panels.has(type)) {
      // 已存在则更新
      const existing = this.panels.get(type)!;
      existing.PanelComponent = PanelComponent;
      existing.slot = slot;
      existing.manifest = manifest;
      existing.loadedAt = Date.now();
      console.log(`[Registry] 更新面板 "${manifest.label}" → slot: ${slot}`);
      return true;
    }

    this.panels.set(type, {
      type,
      manifest,
      PanelComponent,
      slot,
      enabled: true,
      loadedAt: Date.now(),
    });

    console.log(`[Registry] 注册面板 "${manifest.label}" → slot: ${slot}`);
    return true;
  }

  /**
   * 获取指定插槽的所有面板组件
   */
  getPanelsBySlot(slot: PanelSlot): PluginPanelEntry[] {
    return Array.from(this.panels.values())
      .filter(entry => entry.slot === slot && entry.enabled);
  }

  /**
   * 获取某个面板组件
   */
  getPanelComponent(type: string): React.ComponentType | undefined {
    return this.panels.get(type)?.PanelComponent;
  }

  /**
   * 检查面板是否已注册
   */
  hasPanel(type: string): boolean {
    return this.panels.has(type);
  }

  /**
   * 启用/禁用某个面板
   */
  setPanelEnabled(type: string, enabled: boolean): boolean {
    const entry = this.panels.get(type);
    if (!entry) return false;
    entry.enabled = enabled;
    return true;
  }

  /**
   * 获取所有已注册的面板
   */
  getAllPanels(): PluginPanelEntry[] {
    return Array.from(this.panels.values());
  }

  /**
   * 获取插件类型的固定ID（从 manifest 读取）
   */
  getFixedId(type: string): string | undefined {
    return this.plugins.get(type)?.manifest.fixedId;
  }

  /**
   * 批量注册插件
   */
  registerAll(pluginDefs: PluginNodeDefinition[]): PluginLoadResult[] {
    return pluginDefs.map(def => this.register(def));
  }

  /**
   * 获取某个插件类型对应的组件
   */
  getComponent(type: string): React.ComponentType<any> | undefined {
    return this.plugins.get(type)?.component;
  }

  /**
   * 获取某个插件的 Panel 组件
   */
  getPanel(type: string): React.ComponentType<{ nodeId: string }> | undefined {
    return this.plugins.get(type)?.panel;
  }

  /**
   * 检查插件是否有 Panel 组件
   */
  hasNodePanel(type: string): boolean {
    const entry = this.plugins.get(type);
    return !!entry?.panel;
  }

  /**
   * 获取某个插件的 manifest
   */
  getManifest(type: string): PluginManifest | undefined {
    return this.plugins.get(type)?.manifest;
  }

  /**
   * 获取所有已注册的插件条目
   */
  getAllEntries(): PluginRegistryEntry[] {
    return Array.from(this.plugins.values());
  }

  /**
   * 获取所有已注册的插件类型列表
   */
  getAllTypes(): string[] {
    return Array.from(this.plugins.keys());
  }

  /**
   * 获取所有插件的 manifest 列表（用于侧边栏展示）
   */
  getAllManifests(): PluginManifest[] {
    return Array.from(this.plugins.values()).map(e => e.manifest);
  }

  /**
   * 按分类获取插件
   */
  getByCategory(category: string): PluginRegistryEntry[] {
    return Array.from(this.plugins.values())
      .filter(entry => entry.manifest.category === category);
  }

  /**
   * 启用/禁用某个插件
   */
  setEnabled(type: string, enabled: boolean): boolean {
    const entry = this.plugins.get(type);
    if (!entry) return false;
    entry.enabled = enabled;
    return true;
  }

  /**
   * 检查某个插件类型是否已注册
   */
  hasType(type: string): boolean {
    return this.plugins.has(type);
  }

  /**
   * 获取已注册的插件数量
   */
  get size(): number {
    return this.plugins.size;
  }

  /**
   * 清空注册表（用于热重载/刷新）
   */
  clear(): void {
    this.plugins.clear();
    this.panels.clear();
  }
}

export const pluginRegistry = PluginRegistry.getInstance();
