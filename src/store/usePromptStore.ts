/**
 * usePromptStore.ts
 *
 * 提示词存储 - 管理世界编辑器5个面板的提示词模板
 * 存储结构：{ 面板ID: { content: '提示词模板', variables: ['变量名'], updatedAt: 时间戳 } }
 * 内置默认提示词，用户未自定义时回退使用
 * PromptSquare 保存时同步更新到此 store
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type PromptPanelId = 'setting' | 'world' | 'character' | 'plot' | 'consistency';

export interface PromptEntry {
  content: string;
  variables: string[];
  updatedAt: number;
}

interface PromptStore {
  /** 所有提示词数据 */
  prompts: Record<PromptPanelId, PromptEntry>;
  /** 获取某个面板的提示词（优先自定义，回退默认） */
  getPrompt: (panelId: PromptPanelId) => PromptEntry;
  /** 更新某个面板的提示词 */
  setPrompt: (panelId: PromptPanelId, content: string) => void;
  /** 重置某个面板为默认提示词 */
  resetPrompt: (panelId: PromptPanelId) => void;
  /** 提取提示词中的变量占位符 */
  extractVariables: (content: string) => string[];
}

/** 默认提示词模板 - 每个面板一个 */
const DEFAULT_PROMPTS: Record<PromptPanelId, string> = {
  setting: `请根据以下作品设定信息，生成世界构建的详细内容。

你是专业小说世界观设计师。请严格按照JSON格式输出（不要包含markdown代码块标记）。

【创意核心】{{creativeIdea}}
【叙事视角】{{perspective}}
【主角性别】{{protagonistGender}}
【主角名字】{{protagonistName}}
【风格选择】{{style}}
【每章字数区间】{{chapterWordCount}}
【总字数】{{totalWordCount}}

请基于以上设定，生成一个完整的世界构建方案。输出的JSON必须包含以下字段（每个字段的值都是字符串，不要嵌套对象）：
{
  "powerSystem": "力量体系描述",
  "physicsRules": "物理规则描述",
  "magicTech": "魔法/科技机制描述",
  "politicalSystem": "政治体制描述",
  "economyMode": "经济模式描述",
  "classSystem": "阶级系统描述",
  "conflict": "主要冲突描述"
}

不要输出其他任何内容，只输出JSON。`,

  world: `请根据以下已有的世界观设定，生成人物核心的设计。

你是专业小说角色设计师。请严格按照JSON格式输出（不要包含markdown代码块标记）。

【创意核心】{{creativeIdea}}
【叙事视角】{{perspective}}
【主角性别】{{protagonistGender}}
【主角名字】{{protagonistName}}
【风格选择】{{style}}
【力量体系】{{powerSystem}}
【物理规则】{{physicsRules}}
【魔法/科技机制】{{magicTech}}
【政治体制】{{politicalSystem}}
【经济模式】{{economyMode}}
【阶级系统】{{classSystem}}
【冲突】{{conflict}}

请基于以上世界观，生成主要人物设定。输出的JSON必须包含以下字段：
{
  "characters": [
    { "name": "角色名", "desire": "欲望", "flaw": "缺陷", "arc": "弧光" },
    { "name": "角色名", "desire": "欲望", "flaw": "缺陷", "arc": "弧光" }
  ]
}

至少生成3个角色（主角、重要配角、反派）。不要输出其他任何内容，只输出JSON。`,

  character: `请根据以下世界观设定和角色信息，生成剧情大纲的一句話总纲和三幕式结构。

你是专业小说剧情架构师。请严格按照JSON格式输出（不要包含markdown代码块标记）。

【创意核心】{{creativeIdea}}
【叙事视角】{{perspective}}
【主角名字】{{protagonistName}}
【风格选择】{{style}}
【力量体系】{{powerSystem}}
【物理规则】{{physicsRules}}
【魔法/科技机制】{{magicTech}}
【政治体制】{{politicalSystem}}
【经济模式】{{economyMode}}
【阶级系统】{{classSystem}}
【冲突】{{conflict}}

角色列表：
{{characters}}

请基于以上设定，生成：
1. 一句話总纲（synopsis）：用一句话概括整个故事的核心
2. 三幕式剧情大纲（plot_structure）

输出的JSON必须包含以下字段：
{
  "synopsis": "用一句话概括整个故事的核心...",
  "plot_structure": {
    "first_act": "第一幕开端剧情描述：主角日常、激励事件、决定冒险",
    "second_act": "第二幕中段剧情描述：冲突升级、转折、绝境",
    "third_act": "第三幕结尾剧情描述：高潮对决、主题升华、结局"
  }
}

不要输出其他任何内容，只输出JSON。`,

  plot: `请根据以下所有的世界观、人物和剧情设定，生成一致性检查报告。

你是专业小说编辑和质量审核员。请严格按照JSON格式输出（不要包含markdown代码块标记）。

【创意核心】{{creativeIdea}}
【叙事视角】{{perspective}}
【主角名字】{{protagonistName}}
【风格选择】{{style}}
【力量体系】{{powerSystem}}
【魔法/科技机制】{{magicTech}}
【主要冲突】{{conflict}}
【一句话总纲】{{synopsis}}
【剧情结构】{{plot_structure}}

角色列表：
{{characters}}

请基于以上所有设定，从以下四个维度进行评分（1-10分）并给出具体问题和修改建议：
1. 人物一致性（角色行为是否符合人设）
2. 世界观一致性（设定是否自洽）
3. 情节逻辑（剧情发展是否合理）
4. 时间线（时间顺序是否清晰）

输出的JSON必须包含以下字段（所有值均为字符串）：
{
  "characterConsistency": "人物一致性评分和分析",
  "worldConsistency": "世界观一致性评分和分析",
  "plotLogic": "情节逻辑评分和分析",
  "timeline": "时间线评分和分析",
  "analysis": "综合分析报告和改进建议"
}

不要输出其他任何内容，只输出JSON。`,

  consistency: `请将前面所有面板的数据合并打包成一个完整的最终JSON，并输出到画布节点。

你是专业小说数据整理师。请严格按照JSON格式输出（不要包含markdown代码块标记）。

【作品设定】
创意核心：{{creativeIdea}}
叙事视角：{{perspective}}
主角性别：{{protagonistGender}}
主角名字：{{protagonistName}}
风格选择：{{style}}
每章字数区间：{{chapterWordCount}}
总字数：{{totalWordCount}}

【世界构建】
力量体系：{{powerSystem}}
物理规则：{{physicsRules}}
魔法/科技机制：{{magicTech}}
政治体制：{{politicalSystem}}
经济模式：{{economyMode}}
阶级系统：{{classSystem}}
主要冲突：{{conflict}}

【人物核心】
角色列表：{{characters}}

【剧情大纲】
一句话总纲：{{synopsis}}
剧情结构：{{plot_structure}}

【一致性检查】
人物一致性：{{characterConsistency}}
世界观一致性：{{worldConsistency}}
情节逻辑：{{plotLogic}}
时间线：{{timeline}}
综合分析：{{analysis}}

请将所有数据整理合并为一个完整的JSON对象，结构如下：
{
  "setting": { "creativeIdea": "", "perspective": "", "protagonistGender": "", "protagonistName": "", "style": "", "chapterWordCount": "", "totalWordCount": "" },
  "world": { "powerSystem": "", "physicsRules": "", "magicTech": "", "politicalSystem": "", "economyMode": "", "classSystem": "", "conflict": "" },
  "character": { "characters": [] },
  "plot": { "synopsis": "", "plot_structure": { "first_act": "", "second_act": "", "third_act": "" } },
  "consistency": { "characterConsistency": "", "worldConsistency": "", "plotLogic": "", "timeline": "", "analysis": "" }
}

请将所有已有的数据填入对应字段，缺失的数据留空字符串。不要输出其他任何内容，只输出JSON。`,
};

/** 从提示词中提取 {{变量名}} */
function extractVariables(content: string): string[] {
  const regex = /\{\{(\w+)\}\}/g;
  const vars: string[] = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    if (!vars.includes(match[1])) {
      vars.push(match[1]);
    }
  }
  return vars;
}

/** 获取默认提示词条目 */
function getDefaultEntry(panelId: PromptPanelId): PromptEntry {
  const content = DEFAULT_PROMPTS[panelId] || '';
  return {
    content,
    variables: extractVariables(content),
    updatedAt: 0,
  };
}

export const usePromptStore = create<PromptStore>()(
  persist(
    (set, get) => ({
      prompts: {} as Record<PromptPanelId, PromptEntry>,

      getPrompt: (panelId) => {
        const saved = get().prompts[panelId];
        if (saved && saved.content) {
          return saved;
        }
        return getDefaultEntry(panelId);
      },

      setPrompt: (panelId, content) => {
        const variables = extractVariables(content);
        set((state) => ({
          prompts: {
            ...state.prompts,
            [panelId]: {
              content,
              variables,
              updatedAt: Date.now(),
            },
          },
        }));
      },

      resetPrompt: (panelId) => {
        set((state) => {
          const newPrompts = { ...state.prompts };
          delete newPrompts[panelId];
          return { prompts: newPrompts };
        });
      },

      extractVariables: (content) => extractVariables(content),
    }),
    {
      name: 'neihei-prompt-store',
    }
  )
);
