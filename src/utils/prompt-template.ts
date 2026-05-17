/**
 * prompt-template.ts
 *
 * 简易模板引擎
 * 将提示词中的 {{变量名}} 占位符替换为上下文对象中的实际值
 */

/**
 * 渲染模板字符串，替换 {{变量名}} 占位符
 * @param template 模板字符串，如 "你好，{{name}}！"
 * @param context 上下文对象，如 { name: "张三" }
 * @returns 替换后的字符串
 */
export function renderPrompt(
  template: string,
  context: Record<string, any>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, varName: string) => {
    const value = context[varName];
    if (value === undefined || value === null) {
      // 保留未匹配的占位符，但添加标记
      return `[未设置:${varName}]`;
    }
    // 如果是对象或数组，转成JSON字符串
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value, null, 2);
      } catch {
        return String(value);
      }
    }
    return String(value);
  });
}

/**
 * 从模板中提取所有变量名
 */
export function extractVariables(template: string): string[] {
  const regex = /\{\{(\w+)\}\}/g;
  const vars: string[] = [];
  let match;
  while ((match = regex.exec(template)) !== null) {
    if (!vars.includes(match[1])) {
      vars.push(match[1]);
    }
  }
  return vars;
}

/**
 * 构建AI调用所需的上下文对象
 * 从 usePanelDataStore 中提取指定面板的数据，合并成扁平对象
 */
export function buildContextFromPanels(
  panelData: Record<string, Record<string, any>>
): Record<string, any> {
  const context: Record<string, any> = {};
  for (const panelId of Object.keys(panelData)) {
    const fields = panelData[panelId];
    if (fields) {
      Object.assign(context, fields);
    }
  }
  return context;
}
