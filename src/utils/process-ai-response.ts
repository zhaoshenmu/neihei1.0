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

  // 确保 characters 数组中每个角色对象都有 personality 字段（兜底）
  if (Array.isArray(parsedData.characters)) {
    parsedData.characters = parsedData.characters.map((c: unknown) => {
      if (typeof c === 'string') {
        return { name: c, desire: '', flaw: '', arc: '', personality: '' };
      }
      if (typeof c === 'object' && c !== null) {
        const obj = c as Record<string, unknown>;
        return {
          name: typeof obj.name === 'string' ? obj.name : '',
          desire: typeof obj.desire === 'string' ? obj.desire : '',
          flaw: typeof obj.flaw === 'string' ? obj.flaw : '',
          arc: typeof obj.arc === 'string' ? obj.arc : '',
          personality: typeof obj.personality === 'string' ? obj.personality : '',
        };
      }
      return { name: '', desire: '', flaw: '', arc: '', personality: '' };
    });
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
 * 尝试修复不标准的 JSON 字符串
 * 处理常见的 AI 输出 JSON 格式问题：trailing comma、单引号、多余注释等
 */
function repairJSON(raw: string): string {
  let str = raw.trim();

  // 1. 去除可能的 md 代码块标识
  const codeBlockMatch = str.match(/^```(?:json)?\s*([\s\S]*?)```\s*$/);
  if (codeBlockMatch) {
    str = codeBlockMatch[1].trim();
  }

  // 2. 尝试提取第一个完整的 JSON 对象 { ... }
  const firstBrace = str.indexOf('{');
  if (firstBrace < 0) throw new Error('未找到 JSON 对象起始符号');
  const lastBrace = str.lastIndexOf('}');
  if (lastBrace < firstBrace) throw new Error('未找到 JSON 对象结束符号');
  str = str.slice(firstBrace, lastBrace + 1);

  // 3. 去除注释（// style 和 /* */ style）
  str = str.replace(/\/\/.*$/gm, '');
  str = str.replace(/\/\*[\s\S]*?\*\//g, '');

  // 4. 去除属性名周围不必要的引号变体（单引号 → 双引号）
  //    匹配 key: value 中 key 未加引号或为单引号的情况
  str = str.replace(/(['"])?([a-zA-Z_$][a-zA-Z0-9_$]*)(['"])?\s*:/g, (match, q1, key, q2) => {
    // 如果已经用双引号包好了，保持不变
    if (q1 === '"' && q2 === '"') return match;
    return `"${key}":`;
  });

  // 5. 去除 trailing commas: 在 ,] 或 ,} 之前删除逗号
  //    分两步：先处理 ,} → }，再处理 ,] → ]
  str = str.replace(/,(\s*[}\]])/g, '$1');

  // 6. 去除多余的逗号（如空数组或对象中的连续逗号）
  str = str.replace(/,\s*,/g, ',');

  // 7. 尝试修复字符串值中的未转义引号（常见 AI 错误）
  //    这个比较难完美处理，先试一下简单的

  return str;
}

/**
 * 解析 AI 响应 JSON
 * 优先 JSON.parse，失败则尝试修复格式后再次解析
 */
export function parseAIResponse(responseContent: string): Record<string, unknown> {
  let cleaned = responseContent.trim();

  // 去掉 markdown 代码块标记（```json 或 ```）
  const codeBlockMatch = cleaned.match(/^```(?:json)?\s*([\s\S]*?)```\s*$/);
  if (codeBlockMatch) {
    cleaned = codeBlockMatch[1].trim();
  }

  // 第一轮：直接解析
  try {
    return JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    // 直接解析失败，尝试从文本中提取 JSON + 格式修复
  }

  try {
    // 提取第一个完整的 {...} JSON 对象
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      const extracted = cleaned.slice(firstBrace, lastBrace + 1);

      // 尝试直接用提取的文本解析
      try {
        return JSON.parse(extracted) as Record<string, unknown>;
      } catch {
        // 继续修复流程
      }

      // 修复后再次尝试
      const repaired = repairJSON(extracted);
      try {
        return JSON.parse(repaired) as Record<string, unknown>;
      } catch {
        console.warn('[parseAIResponse] 修复后 JSON 仍无法解析，返回空对象', repaired.slice(0, 200));
        return {};
      }
    }

    // 尝试整体修复
    const repaired = repairJSON(cleaned);
    try {
      return JSON.parse(repaired) as Record<string, unknown>;
    } catch {
      console.warn('[parseAIResponse] AI 返回格式异常，返回空对象', cleaned.slice(0, 200));
      return {};
    }
  } catch {
    console.warn('[parseAIResponse] AI 返回格式异常，返回空对象', cleaned.slice(0, 200));
    return {};
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
  if (Object.keys(parsedData).length > 0) {
    processAIDataForStore(parsedData, updateNodeData, nodeId);
  }
  return parsedData;
}
