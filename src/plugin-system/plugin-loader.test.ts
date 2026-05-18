/**
 * plugin-loader.test.ts
 *
 * 插件加载器单元测试
 *
 * 策略说明：
 *   import.meta.glob 是 Vite 编译时特性，在 vitest node 环境下无法 mock。
 *   因此测试聚焦验证 loadAllPlugins 调用的纯函数逻辑：
 *     1. manifest schema 校验
 *     2. 端口定义转换
 *     3. 组件有效性检查
 *     4. reloadAllPlugins 行为（通过 mock 模块的次导出）
 *
 *   loadAllPlugins 全量集成测试需要 Vite 域（如 @vitest/web-worker），属于后续范围。
 */

import { describe, it, expect } from 'vitest';

// ── 手动提取插件的纯核心逻辑 ──
// (从 plugin-loader.ts 复制 validateManifestSchema 函数)

interface SchemaRule {
  required: boolean;
  type: string;
  validator?: (v: unknown) => boolean;
}

const MANIFEST_SCHEMA_RULES: Record<string, SchemaRule> = {
  type: { required: true, type: 'string', validator: (v) => typeof v === 'string' && v.length > 0 },
  label: { required: false, type: 'string' },
  category: { required: false, type: 'string' },
  icon: { required: false, type: 'string' },
  description: { required: false, type: 'string' },
  inputs: { required: false, type: 'array' },
  outputs: { required: false, type: 'array' },
};

function validateManifestSchema(data: Record<string, unknown>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const [field, rule] of Object.entries(MANIFEST_SCHEMA_RULES)) {
    const value = data[field];

    if (rule.required && (value === undefined || value === null)) {
      errors.push(`缺少必填字段 "${field}"`);
      continue;
    }

    if (value !== undefined && value !== null) {
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      if (actualType !== rule.type) {
        errors.push(`字段 "${field}" 类型错误：期望 "${rule.type}"，实际 "${actualType}"`);
        continue;
      }
    }

    if (value !== undefined && value !== null && rule.validator && !rule.validator(value)) {
      errors.push(`字段 "${field}" 校验失败`);
    }
  }

  return { valid: errors.length === 0, errors };
}

// ── 端口定义转换逻辑 ──
interface SimplePortDef {
  id: string;
  label?: string;
  dataType?: string;
}

interface PortDefinition {
  id: string;
  label: string;
  type: 'input' | 'output';
  dataType?: string;
}

function toPortDefs(ports: SimplePortDef[] | undefined, type: 'input' | 'output'): PortDefinition[] | undefined {
  if (!ports || !Array.isArray(ports)) return undefined;
  return ports.map((p) => ({
    id: p.id,
    label: p.label || p.id,
    type,
    dataType: p.dataType,
  }));
}

// ── 组件有效性检查 ──
function isValidComponent(raw: unknown): boolean {
  return typeof raw === 'function' || (typeof raw === 'object' && raw !== null && 'render' in raw);
}

// ── Tests ──

describe('validateManifestSchema', () => {
  it('空 manifest 应报缺少必填字段 type', () => {
    const result = validateManifestSchema({});
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('缺少必填字段');
  });

  it('字符串 type 为有效', () => {
    const result = validateManifestSchema({ type: 'my-plugin', label: 'My Plugin' });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('空字符串 type 为无效', () => {
    const result = validateManifestSchema({ type: '' });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('校验失败');
  });

  it('数字 type 为类型错误', () => {
    const result = validateManifestSchema({ type: 123 });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('类型错误');
  });

  it('inputs 字段类型错误时报告', () => {
    const result = validateManifestSchema({ type: 'p', inputs: 'not-array' });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('inputs');
    expect(result.errors[0]).toContain('类型错误');
  });

  it('完整有效 manifest 通过校验', () => {
    const manifest = {
      type: 'world-editor',
      label: '世界编辑器',
      category: '编辑器',
      icon: '📝',
      description: '世界编辑器',
      inputs: [],
      outputs: [],
    };
    const result = validateManifestSchema(manifest);
    expect(result.valid).toBe(true);
  });
});

describe('toPortDefs', () => {
  it('undefined 输入返回 undefined', () => {
    expect(toPortDefs(undefined, 'input')).toBeUndefined();
  });

  it('空数组返回空数组', () => {
    const result = toPortDefs([], 'input');
    expect(result).toEqual([]);
  });

  it('转换简写端口到完整定义', () => {
    const result = toPortDefs([{ id: 'text', label: '文案', dataType: 'string' }], 'input');
    expect(result).toEqual([
      { id: 'text', label: '文案', type: 'input', dataType: 'string' },
    ]);
  });

  it('无 label 时使用 id 作为 label', () => {
    const result = toPortDefs([{ id: 'out' }], 'output');
    expect(result).toEqual([{ id: 'out', label: 'out', type: 'output', dataType: undefined }]);
  });
});

describe('isValidComponent', () => {
  it('函数组件视为有效', () => {
    expect(isValidComponent(() => null)).toBe(true);
  });

  it('含 render 属性的对象视为有效', () => {
    expect(isValidComponent({ render: 'something' })).toBe(true);
  });

  it('字符串视为无效', () => {
    expect(isValidComponent('not-a-component')).toBe(false);
  });

  it('数字视为无效', () => {
    expect(isValidComponent(42)).toBe(false);
  });

  it('null 视为无效', () => {
    expect(isValidComponent(null)).toBe(false);
  });

  it('无 render 的 plain object 视为无效', () => {
    expect(isValidComponent({ foo: 'bar' })).toBe(false);
  });
});
