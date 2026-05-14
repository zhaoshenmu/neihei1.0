/**
 * 插件注册表 - 全局单例
 * 维护所有已注册插件的索引，提供查询和访问接口
 */
import type { 
  PluginNodeDefinition, 
  PluginRegistryEntry, 
  PluginLoadResult,
  PluginManifest,
} from './plugin-types';

class PluginRegistry {
  private plugins: Map<string, PluginRegistryEntry> = new Map();
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
   */
  register(pluginDef: PluginNodeDefinition): PluginLoadResult {
    const { manifest, component } = pluginDef;
    const { type } = manifest;

    if (!type || typeof type !== 'string') {
      return {
        success: false,
        error: '插件缺少有效的 "type" 字段',
      };
    }

    if (this.plugins.has(type)) {
      // 已存在则更新（幂等），HMR 或 StrictMode 双重调用时不会报错
      const existing = this.plugins.get(type)!;
      existing.component = component;
      existing.manifest = manifest;
      existing.loadedAt = Date.now();
      return { success: true, type, plugin: pluginDef };
    }

    this.plugins.set(type, {
      type,
      manifest,
      component,
      enabled: true,
      loadedAt: Date.now(),
    });

    return { success: true, type, plugin: pluginDef };
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
  }
}

export const pluginRegistry = PluginRegistry.getInstance();
