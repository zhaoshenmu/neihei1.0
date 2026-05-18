/**
 * AI 响应处理工具
 *
 * 提取 OutlinePanel.tsx 中重复的 AI 响应解析逻辑，
 * 处理 plot_structure 对象修复、consistency 字段强制转字符串
 */

/** 将任何值转为适合展示的字符串（对象转 JSON，其他直接转字符串） */
export function safeString(val: unknown): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  try {
    return JSON.stringify(val, null, 2);
  } catch {
    return String(val);
  }
}

/** 递归安全解析可能嵌套的 JSON 字符串 */
function deepParseJSON(val: unknown): unknown {
  if (typeof val !== 'string') return val;
  const trimmed = val.trim();
  // 尝试解析 JSON
  try {
    const parsed = JSON.parse(trimmed);
    // 如果解析结果还是字符串，继续递归解析
    if (typeof parsed === 'string') {
      return deepParseJSON(parsed);
    }
    return parsed;
  } catch {
    return val; // 解析失败，返回原字符串
  }
}

/** 修复 plot 面板返回的数据结构：确保 plot_structure 是对象，同时将内容同步到顶层驼峰字段供 PagePlot 读取 */
function fixPlotStructure(parsedData: Record<string, unknown>): void {
  // 先尝试从 plot_structure、first_act/firstAct 等字段中提取数据
  let psObj: Record<string, unknown> = {};

  // 情况1：plot_structure 存在
  if (parsedData.plot_structure !== undefined) {
    const ps = deepParseJSON(parsedData.plot_structure);
    if (typeof ps === 'object' && ps !== null) {
      psObj = ps as Record<string, unknown>;
    }
  }

  // 情况2：顶层直接有 first_act/second_act/third_act（蛇形）
  if (!psObj.first_act && parsedData.first_act) {
    psObj.first_act = parsedData.first_act;
    delete parsedData.first_act;
  }
  if (!psObj.second_act && parsedData.second_act) {
    psObj.second_act = parsedData.second_act;
    delete parsedData.second_act;
  }
  if (!psObj.third_act && parsedData.third_act) {
    psObj.third_act = parsedData.third_act;
    delete parsedData.third_act;
  }

  // 情况3：顶层直接有 act1/act2/act3
  if (!psObj.first_act && parsedData.act1) {
    psObj.first_act = parsedData.act1;
    delete parsedData.act1;
  }
  if (!psObj.second_act && parsedData.act2) {
    psObj.second_act = parsedData.act2;
    delete parsedData.act2;
  }
  if (!psObj.third_act && parsedData.act3) {
    psObj.third_act = parsedData.act3;
    delete parsedData.act3;
  }

  // 写入 plot_structure（确保始终是对象）
  parsedData.plot_structure = psObj;

  // 同步到 firstAct/secondAct/thirdAct 字段供 PagePlot.tsx 读取
  if (psObj.first_act) {
    parsedData.firstAct = safeString(psObj.first_act);
  }
  if (psObj.second_act) {
    parsedData.secondAct = safeString(psObj.second_act);
  }
  if (psObj.third_act) {
    parsedData.thirdAct = safeString(psObj.third_act);
  }

  // 处理 synopsis
  if (parsedData.synopsis === undefined || parsedData.synopsis === null || parsedData.synopsis === '') {
    if (psObj.synopsis) {
      parsedData.synopsis = safeString(psObj.synopsis);
    }
  } else {
    parsedData.synopsis = safeString(parsedData.synopsis);
  }

  // 兜底：如果 AI 没有返回 plot_structure 但返回了 synopsis，确保 synopsis 是字符串
  if (parsedData.synopsis !== undefined) {
    parsedData.synopsis = safeString(parsedData.synopsis);
  }
}

/**
 * 从字符串中提取第一个数字（1-10），用于兼容旧数据兜底
 */
function extractScoreFromText(val: unknown): number | null {
  if (typeof val !== 'string') return null;
  const match = val.match(/(\d+)(?:\s*\/\s*10)?/);
  if (match) {
    const score = parseInt(match[1], 10);
    if (score >= 1 && score <= 10) return score;
  }
  return null;
}

/**
 * 清理文本中的评分数字前缀，只保留纯分析文字
 */
function cleanDetailText(val: unknown): string {
  const str = safeString(val);
  // 去掉前导评分格式如 "8分"、"8/10"、"8 " 等
  return str.replace(/^\s*\d+(?:\s*\/\s*10)?\s*(分|分[，,。.．]|[:：]|)\s*/, '').trim();
}

/** 修复 consistency 面板字段：为新旧格式提供兼容 */
function fixConsistencyFields(parsedData: Record<string, unknown>): void {
  // 字段映射：detail 字段 → 对应的 score 字段名
  const fieldMap: Record<string, string> = {
    characterConsistency: 'characterConsistencyScore',
    worldConsistency: 'worldConsistencyScore',
    plotLogic: 'plotLogicScore',
    timeline: 'timelineScore',
  };

  for (const [detailKey, scoreKey] of Object.entries(fieldMap)) {
    const detail = parsedData[detailKey];
    const existingScore = parsedData[scoreKey];

    // 1. 如果已经有 score 字段（新格式），确保它是数字
    if (existingScore !== undefined) {
      parsedData[scoreKey] = typeof existingScore === 'number' ? existingScore : parseInt(String(existingScore), 10) || 0;
    } else {
      // 2. 旧格式：从 detail 文本中提取第一个数字作为 score
      const extracted = extractScoreFromText(detail);
      if (extracted !== null) {
        parsedData[scoreKey] = extracted;
      }
    }

    // 3. 确保 detail 字段是字符串，并清理前导评分文字
    parsedData[detailKey] = detail !== undefined ? cleanDetailText(detail) : '';
  }

  // 4. 确保 analysis 是字符串
  if (parsedData.analysis !== undefined) {
    parsedData.analysis = safeString(parsedData.analysis);
  }
}

/** 将 AI 返回数据写入 panel-data-store（按字段类型区分写入方式） */
export function processAIDataForStore(
  parsedData: Record<string, unknown>,
  updateNodeData: (nodeId: string, key: string, value: unknown) => void,
  nodeId: string,
): void {
  // 自动检测：如果 AI 返回了 plot 相关字段，则修复 plot 数据结构
  if (parsedData.plot_structure || parsedData.first_act || parsedData.firstAct || parsedData.act1 || parsedData.synopsis) {
    fixPlotStructure(parsedData);
  }

  // 自动检测：如果 AI 返回了一致性检查字段，则修复格式
  if (parsedData.characterConsistency !== undefined) {
    fixConsistencyFields(parsedData);
  }

  // 将数据写入 store
  for (const [key, value] of Object.entries(parsedData)) {
    if (key === 'characters' || key === 'plot_structure') {
      updateNodeData(nodeId, key, value);
    } else {
      updateNodeData(nodeId, key, safeString(value));
    }
  }
}

/**
 * 解析 AI 响应 JSON
 * 优先 JSON.parse，失败则尝试从响应中提取 JSON 对象
 */
export function parseAIResponse(responseContent: string): Record<string, unknown> {
  // 如果包含 markdown 代码块标记（```json 或 ```），先去掉
  let cleaned = responseContent.trim();
  const codeBlockMatch = cleaned.match(/^```(?:json)?\s*([\s\S]*?)```\s*$/);
  if (codeBlockMatch) {
    cleaned = codeBlockMatch[1].trim();
  }

  try {
    return JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as Record<string, unknown>;
    }
    throw new Error('AI 返回格式异常，无法解析为JSON');
  }
}

/**
 * 处理 AI 调用返回结果并写入 store
 * 整合解析 + 数据结构修复 + 写入
 */
export function handleAIResponse(
  responseContent: string,
  updateNodeData: (nodeId: string, key: string, value: unknown) => void,
  nodeId: string,
): Record<string, unknown> {
  const parsedData = parseAIResponse(responseContent);
  processAIDataForStore(parsedData, updateNodeData, nodeId);
  return parsedData;
}
