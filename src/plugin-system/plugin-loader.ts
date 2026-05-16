/**
 * 插件自动加载器
 * 使用 Vite 的 import.meta.glob 实现真正的自动注册
 * 用户只需将插件文件夹放入 chajian/ 目录，系统自动扫描加载
 * 
 * 加载策略：
 * 1. 扫描 chajian 下所有 manifest.json 获取插件元数据
 * 2. 扫描 chajian 下所有 index.tsx 获取插件组件
 * 3. 匹配文件夹名，将 manifest 和组件组合注册
 */
import { pluginRegistry } from './plugin-registry';
import type { PluginManifest, PluginLoadResult, PortDefinition } from './plugin-types';

/**
 * 简化端口定义（manifest.json 中使用）
 * 不需要 type 字段，因为 inputs 数组隐含 input 类型
 */
export interface SimplePortDef {
  id: string;
  label?: string;
  dataType?: string;
}

/**
 * manifest.json 字段校验规则
 * 运行时校验，防止坏掉的插件文件导致静默失败。
 * schema 严格程度：开发环境宽容，生产环境严格。
 */
const MANIFEST_SCHEMA_RULES: Record<string, { required: boolean; type: string; validator?: (v: unknown) => boolean }> = {
  type: { required: true, type: 'string', validator: (v) => typeof v === 'string' && v.length > 0 },
  label: { required: false, type: 'string' },
  category: { required: false, type: 'string' },
  icon: { required: false, type: 'string' },
  description: { required: false, type: 'string' },
  inputs: { required: false, type: 'array' },
  outputs: { required: false, type: 'array' },
};

/**
 * 校验 manifest 数据是否符合 schema
 * 返回校验结果，包含所有错误信息
 */
function validateManifestSchema(data: Record<string, unknown>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const [field, rule] of Object.entries(MANIFEST_SCHEMA_RULES)) {
    const value = data[field];

    // 检查必填字段
    if (rule.required && (value === undefined || value === null)) {
      errors.push(`缺少必填字段 "${field}"`);
      continue;
    }

    // 值存在时检查类型
    if (value !== undefined && value !== null) {
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      if (actualType !== rule.type) {
        errors.push(`字段 "${field}" 类型错误：期望 "${rule.type}"，实际 "${actualType}"`);
        continue;
      }
    }

    // 自定义校验
    if (value !== undefined && value !== null && rule.validator && !rule.validator(value)) {
      errors.push(`字段 "${field}" 校验失败`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * 动态导入所有插件的 manifest.json
 */
const manifestModules = import.meta.glob<Record<string, unknown>>(
  '../chajian/*/manifest.json',
  { eager: true, import: 'default' }
);

/**
 * 动态导入所有插件的 index.tsx（组件）
 */
const componentModules = import.meta.glob<Record<string, unknown>>(
  '../chajian/*/index.tsx',
  { eager: true, import: 'default' }
);

/**
 * 动态导入所有插件的 Panel.tsx（面板组件，可选）
 */
const panelModules = import.meta.glob<Record<string, unknown>>(
  '../chajian/*/Panel.tsx',
  { eager: true, import: 'default' }
);

/**
 * 从路径中提取文件夹名
 * e.g. '../chajian/HelloNode/manifest.json' => 'HelloNode'
 */
function getFolderName(path: string): string {
  const match = path.match(/chajian\/([^/]+)\//);
  return match ? match[1] : '';
}

/**
 * 将简化端口定义转换为完整 PortDefinition
 */
function toPortDefs(
  ports: SimplePortDef[] | undefined,
  type: 'input' | 'output'
): PortDefinition[] | undefined {
  if (!ports || !Array.isArray(ports)) {return undefined;}
  return ports.map((p) => ({
    id: p.id,
    label: p.label || p.id,
    type,
    dataType: p.dataType,
  }));
}

/**
 * 加载所有已发现的插件并注册到注册表
 */
export function loadAllPlugins(): PluginLoadResult[] {
  const results: PluginLoadResult[] = [];

  // 获取所有插件文件夹名
  const manifestPaths = Object.keys(manifestModules);
  const componentPaths = Object.keys(componentModules);
  const panelPaths = Object.keys(panelModules);

  console.log(`[插件系统] 发现 ${manifestPaths.length} 个 manifest, ${componentPaths.length} 个组件`);

  // 遍历 manifest，匹配对应的组件
  for (const manifestPath of manifestPaths) {
    try {
      const folderName = getFolderName(manifestPath);
      if (!folderName) {
        results.push({ success: false, error: `无法解析文件夹名: ${manifestPath}` });
        continue;
      }

      // 获取 manifest 数据
      const manifestData = manifestModules[manifestPath] as Record<string, unknown>;

      // 🔒 schema 校验：拒绝坏掉的 manifest 文件
      const schemaResult = validateManifestSchema(manifestData);
      if (!schemaResult.valid) {
        const errorMsg = `manifest schema 校验失败 [${manifestPath}]: ${schemaResult.errors.join('; ')}`;
        console.error(`  ❌ ${errorMsg}`);
        results.push({ success: false, error: errorMsg });
        continue;
      }

      // 构建 PluginManifest（转换端口定义）
      const manifest: PluginManifest = {
        type: manifestData.type as string,
        label: (manifestData.label as string) || (manifestData.type as string),
        category: (manifestData.category as string) || '通用',
        icon: manifestData.icon as string | undefined,
        description: manifestData.description as string | undefined,
        inputs: toPortDefs(manifestData.inputs as SimplePortDef[] | undefined, 'input'),
        outputs: toPortDefs(manifestData.outputs as SimplePortDef[] | undefined, 'output'),
      };

      // 查找对应的组件
      const componentPath = componentPaths.find(p => getFolderName(p) === folderName);
      const rawComponent = componentPath
        ? (componentModules[componentPath] as unknown)
        : undefined;

      if (!rawComponent) {
        results.push({
          success: false,
          error: `未找到组件文件: ${folderName}/index.tsx`,
        });
        continue;
      }

      // 🔒 运行时校验：确保加载的是有效的 React 组件
      const isValidComponent =
        typeof rawComponent === 'function' ||
        (typeof rawComponent === 'object' &&
          rawComponent !== null &&
          'render' in rawComponent);
      if (!isValidComponent) {
        const errorMsg = `组件文件不是有效的 React 组件 [${folderName}/index.tsx]`;
        console.error(`  ❌ ${errorMsg}`);
        results.push({ success: false, error: errorMsg });
        continue;
      }

      // 查找对应的 Panel 组件（可选）
      const panelPath = panelPaths.find(p => getFolderName(p) === folderName);
      const rawPanel = panelPath
        ? (panelModules[panelPath] as unknown)
        : undefined;

      // 注册到注册表（传入 panel 组件）
      const result = pluginRegistry.register({
        manifest,
        component: rawComponent as React.ComponentType<any>,
        panel: rawPanel as React.ComponentType<{ nodeId: string }> | undefined,
      });

      if (result.success) {
        console.log(`  ✅ [${manifest.type}] ${manifest.label} 已注册`);
      } else {
        console.warn(`  ⚠️  [${manifest.type}] ${result.error}`);
      }
      results.push(result);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '未知错误';
      console.error(`  ❌ 加载插件失败 [${manifestPath}]: ${errorMsg}`);
      results.push({
        success: false,
        error: `加载插件失败: ${errorMsg}`,
      });
    }
  }

  const successCount = results.filter(r => r.success).length;
  console.log(`[插件系统] 加载完成: ${successCount}/${manifestPaths.length} 个插件注册成功`);

  return results;
}

/**
 * 重新加载所有插件（清空注册表后重新扫描）
 */
export function reloadAllPlugins(): PluginLoadResult[] {
  pluginRegistry.clear();
  return loadAllPlugins();
}
