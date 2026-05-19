/**
 * world-rule-constraints.ts
 *
 * 世界规则预设 → 约束提示词映射表
 * 当用户在作品设定中选择某个世界规则时，自动将对应的约束文本追加到 AI 调用中
 *
 * 内置 4 个预设规则不可修改
 * 自定义规则由用户新增，存储在 localStorage 'neihei-custom-world-rules' 中
 *
 * ✓ 已阅读 docs/standards/02-代码规范.md
 */

/** 自定义规则的数据结构 */
export interface CustomWorldRule {
  id: string;
  name: string;
  constraint: string;
}

/** 内置预设规则的约束提示词 */
export const BUILT_IN_RULES: Record<string, string> = {
  '现代世界': `⚠️ 核心约束：禁止魔法、超自然力量、科幻黑科技（如强人工智能、机甲、星际航行）。除非创意核心中明确提及，否则所有设定必须符合现实世界的物理规则和科技水平。主角不得拥有超能力或特殊血统。`,
  '末日世界': `⚠️ 核心约束：允许末世生存、资源争夺、变异体、科技衰退背景。除非创意核心中明确提及，否则禁止修仙、魔法、修真等非科幻要素。末日源头可以是病毒、核战、自然灾难，但必须遵循科学基础或科幻设定。`,
  '未来世界': `⚠️ 核心约束：允许高科技、人工智能、赛博义体、星际殖民、虚拟世界。除非创意核心中明确提及，否则禁止中古、修仙、魔法等非科技要素。科技进步应有合理的科学推演，避免凭空造物。`,
  '仙侠世界': `⚠️ 核心约束：允许修仙、法术、灵器、飞升、洞天福地。除非创意核心中明确提及，否则禁止高科技、机甲、人工智能等科技要素。力量体系以灵力/真气为核心，保持东方玄幻风格的一致性。`,
};

/** localStorage 键名 */
const STORAGE_KEY = 'neihei-custom-world-rules';

/** 读取自定义规则列表 */
export function loadCustomRules(): CustomWorldRule[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // 简单的数据清洗
    return parsed.filter(
      (r: unknown) =>
        r !== null &&
        typeof r === 'object' &&
        typeof (r as Record<string, unknown>).id === 'string' &&
        typeof (r as Record<string, unknown>).name === 'string' &&
        typeof (r as Record<string, unknown>).constraint === 'string'
    ) as CustomWorldRule[];
  } catch {
    return [];
  }
}

/** 保存自定义规则列表（完整覆盖） */
export function saveCustomRules(rules: CustomWorldRule[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
  } catch (e) {
    console.warn('[WorldRule] 保存自定义规则失败:', e);
  }
}

/** 新增一条自定义规则 */
export function addCustomRule(name: string, constraint: string): CustomWorldRule | null {
  if (!name.trim() || !constraint.trim()) return null;
  const rules = loadCustomRules();
  // 生成唯一 ID
  const id = `custom_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const newRule: CustomWorldRule = { id, name: name.trim(), constraint: constraint.trim() };
  saveCustomRules([...rules, newRule]);
  return newRule;
}

/** 删除一条自定义规则（通过 ID） */
export function deleteCustomRule(id: string): void {
  const rules = loadCustomRules();
  saveCustomRules(rules.filter((r) => r.id !== id));
}

/** 判断一个规则是否为内置预设 */
export function isBuiltInRule(name: string): boolean {
  return name in BUILT_IN_RULES;
}

/** 获取某个规则的约束文本（内置 or 自定义） */
export function getRuleConstraint(name: string, customRules: CustomWorldRule[]): string {
  // 先查内置
  if (name in BUILT_IN_RULES) {
    return BUILT_IN_RULES[name];
  }
  // 再查自定义
  const found = customRules.find((r) => r.name === name);
  return found?.constraint || '';
}
