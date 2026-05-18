/**
 * usePromptStore.ts
 *
 * 提示词存储 - 管理世界编辑器5个面板的提示词模板
 * 存储结构：{ 面板ID: { content: '提示词模板', variables: ['变量名'], constraint: '约束条件', updatedAt: 时间戳 } }
 * 内置默认提示词，用户未自定义时回退使用
 * PromptSquare 保存时同步更新到此 store
 *
 * ⚠️ 重要映射说明（按钮ID → 对应的 OutlinePanel 标签页 → 生成的数据供哪个页面显示）：
 *   - button[id=world]   → tab=world   → AI生成角色数组 → PageCharacter页面显示
 *   - button[id=character] → tab=character → AI生成剧情大纲(synopsis+plot_structure) → PagePlot页面显示
 *   - button[id=plot]    → tab=plot    → AI生成一致性检查报告 → PageConsistency页面显示
 *   - button[id=consistency] → tab=consistency → AI打包所有数据传递给后继节点
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type PromptPanelId = 'setting' | 'world' | 'character' | 'plot' | 'consistency';

export interface PromptEntry {
  content: string;
  variables: string[];
  constraint: string; // 约束条件（用户自定义，自动附加到提示词末尾）
  updatedAt: number;
}

interface PromptStore {
  /** 所有提示词数据 */
  prompts: Record<PromptPanelId, PromptEntry>;
  /** 获取某个面板的提示词（优先自定义，回退默认） */
  getPrompt: (panelId: PromptPanelId) => PromptEntry;
  /** 更新某个面板的提示词 */
  setPrompt: (panelId: PromptPanelId, content: string) => void;
  /** 设置某个面板的约束条件 */
  setConstraint: (panelId: PromptPanelId, constraint: string) => void;
  /** 重置某个面板为默认提示词 */
  resetPrompt: (panelId: PromptPanelId) => void;
  /** 提取提示词中的变量占位符 */
  extractVariables: (content: string) => string[];
}

/** 默认提示词模板 - 每个面板一个 */
const DEFAULT_PROMPTS: Record<PromptPanelId, string> = {
  // ===== setting → 点击运行 → 生成世界构建字段 → PageWorld显示 =====
  setting: `请根据以下作品设定信息，生成世界构建的详细内容。

你是专业小说世界观设计师。请严格按照JSON格式输出（不要包含markdown代码块标记）。

【创意核心】{{creativeIdea}}
【叙事视角】{{perspective}}
【主角性别】{{protagonistGender}}
【主角名字】{{protagonistName}}
【风格选择】{{style}}
【风格展开】{{styleDetails}}
【世界规则】{{worldRule}}
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

  // ===== world → 点击运行 → 生成角色数组 → PageCharacter显示 =====
  world: `请根据以下已有的世界观设定，生成人物核心的设计。

你是专业小说角色设计师。请严格按照JSON格式输出（不要包含markdown代码块标记）。

【创意核心】{{creativeIdea}}
【叙事视角】{{perspective}}
【主角性别】{{protagonistGender}}
【主角名字】{{protagonistName}}
【风格选择】{{style}}
【风格展开】{{styleDetails}}
【世界规则】{{worldRule}}
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
    { "name": "角色名", "desire": "欲望", "flaw": "缺陷", "arc": "弧光" },
    { "name": "角色名", "desire": "欲望", "flaw": "缺陷", "arc": "弧光" }
  ]
}

至少生成3个角色（主角、重要配角、反派）。不要输出其他任何内容，只输出JSON。`,

  // ===== character → 点击运行 → 生成剧情大纲（带章节规划）→ PagePlot显示 =====
  character: `请根据以下世界观设定和角色信息，生成一句话总纲和三幕式剧情大纲。

你是专业小说剧情架构师。请严格按照JSON格式输出（不要包含markdown代码块标记）。

【创意核心】{{creativeIdea}}
【叙事视角】{{perspective}}
【主角名字】{{protagonistName}}
【风格选择】{{style}}
【风格展开】{{styleDetails}}
【世界规则】{{worldRule}}
【每章字数区间】{{chapterWordCount}}
【总字数】{{totalWordCount}}
【力量体系】{{powerSystem}}
【物理规则】{{physicsRules}}
【魔法/科技机制】{{magicTech}}
【政治体制】{{politicalSystem}}
【经济模式】{{economyMode}}
【阶级系统】{{classSystem}}
【冲突】{{conflict}}

角色列表：
{{characters}}

请基于以上设定，根据总字数和每章字数区间，合理分配三幕的章节数量，生成：
1. 一句话总纲（synopsis）：用一句话概括整个故事的核心
2. 三幕式剧情大纲（plot_structure）：每幕的**第一行必须是章节规划**（格式：第X章-第Y章）

注意：描述保持简洁，每幕3-5句话，避免超长输出被截断。

输出的JSON必须包含以下字段：
{
  "synopsis": "用一句话概括整个故事的核心...",
  "plot_structure": {
    "first_act": "第1章-第5章\n第一幕剧情描述……",
    "second_act": "第6章-第15章\n第二幕剧情描述……",
    "third_act": "第16章-第20章\n第三幕剧情描述……"
  }
}

每幕第一行必须是"第X章-第Y章"格式的章节规划。不要输出其他任何内容，只输出JSON。`,

  // ===== plot → 点击运行 → 生成一致性检查报告 → PageConsistency显示 =====
  plot: `请根据以下所有的世界观、人物和剧情设定，生成一致性检查报告。

你是专业小说编辑和质量审核员。请严格按照JSON格式输出（不要包含markdown代码块标记）。

【创意核心】{{creativeIdea}}
【叙事视角】{{perspective}}
【主角名字】{{protagonistName}}
【风格选择】{{style}}
【风格展开】{{styleDetails}}
【世界规则】{{worldRule}}
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

⚠️ 重要：评分和分析必须分开输出！每个维度要有单独的 score 字段（纯数字1-10）和 detail 字段（纯分析文字，不要在开头带上任何评分数字）。

输出的JSON必须包含以下字段：
{
  "characterConsistencyScore": 8,
  "characterConsistency": "角色行为基本符合人设，但反派的动机略显单薄……",
  "worldConsistencyScore": 7,
  "worldConsistency": "世界观设定基本自洽，但魔法与科技的界限不够清晰……",
  "plotLogicScore": 9,
  "plotLogic": "情节发展逻辑通顺，伏笔设计合理……",
  "timelineScore": 6,
  "timeline": "时间线存在少量跳跃，建议增加过渡章节……",
  "analysis": "综合分析报告和改进建议"
}

score 字段必须是纯数字（不要带"分"或"/10"等文字），detail 字段必须是纯分析文字（不含评分数字）。不要输出其他任何内容，只输出JSON。`,

  // ===== consistency → 点击运行 → 打包所有数据传递给后面节点 =====
  consistency: `请根据以下所有设定数据，整理并输出完整的故事设定包，供后续流程使用。

你是专业小说整理员。请严格按照JSON格式输出（不要包含markdown代码块标记）。

【创意核心】{{creativeIdea}}
【叙事视角】{{perspective}}
【主角性别】{{protagonistGender}}
【主角名字】{{protagonistName}}
【风格选择】{{style}}
【风格展开】{{styleDetails}}
【世界规则】{{worldRule}}
【每章字数区间】{{chapterWordCount}}
【总字数】{{totalWordCount}}
【力量体系】{{powerSystem}}
【物理规则】{{physicsRules}}
【魔法/科技机制】{{magicTech}}
【政治体制】{{politicalSystem}}
【经济模式】{{economyMode}}
【阶级系统】{{classSystem}}
【冲突】{{conflict}}
【一句话总纲】{{synopsis}}
【剧情结构】{{plot_structure}}

角色列表：
{{characters}}

一致性检查报告：
- 人物一致性：{{characterConsistency}}
- 世界观一致性：{{worldConsistency}}
- 情节逻辑：{{plotLogic}}
- 时间线：{{timeline}}
- 综合分析：{{analysis}}

请将以上所有数据整理为一个完整的故事设定包JSON。输出的JSON必须包含以下字段：
{
  "storyPackage": {
    "basicInfo": {
      "creativeIdea": "创意核心",
      "perspective": "叙事视角",
      "protagonistName": "主角名字",
      "style": "风格选择"
    },
    "worldSettings": {
      "powerSystem": "力量体系",
      "physicsRules": "物理规则",
      "magicTech": "魔法/科技机制",
      "politicalSystem": "政治体制",
      "economyMode": "经济模式",
      "classSystem": "阶级系统",
      "conflict": "冲突"
    },
    "characters": "角色列表",
    "plotOutline": {
      "synopsis": "一句话总纲",
      "plot_structure": "剧情结构"
    },
    "consistencyReport": {
      "characterConsistency": "人物一致性",
      "worldConsistency": "世界观一致性",
      "plotLogic": "情节逻辑",
      "timeline": "时间线",
      "analysis": "综合分析"
    }
  }
}

不要输出其他任何内容，只输出JSON。`,
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
    constraint: '',
    updatedAt: 0,
  };
}

export const usePromptStore = create<PromptStore>()(
  persist(
    (set, get) => ({
      prompts: {} as Record<PromptPanelId, PromptEntry>,

      getPrompt: (panelId) => {
        // 对于 plot 和 character 面板，强制使用最新默认提示词（包含章节规划要求）
        if (panelId === 'plot' || panelId === 'character') {
          return getDefaultEntry(panelId);
        }
        const saved = get().prompts[panelId];
        if (saved && saved.content) {
          return saved;
        }
        return getDefaultEntry(panelId);
      },

      setPrompt: (panelId, content) => {
        const variables = extractVariables(content);
        const current = get().prompts[panelId];
        set((state) => ({
          prompts: {
            ...state.prompts,
            [panelId]: {
              content,
              variables,
              constraint: current?.constraint || '',
              updatedAt: Date.now(),
            },
          },
        }));
      },

      setConstraint: (panelId, constraint) => {
        set((state) => {
          const current = state.prompts[panelId];
          const defaultEntry = getDefaultEntry(panelId);
          return {
            prompts: {
              ...state.prompts,
              [panelId]: {
                content: current?.content || defaultEntry.content,
                variables: current?.variables || defaultEntry.variables,
                constraint,
                updatedAt: Date.now(),
              },
            },
          };
        });
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
      version: 4,
      migrate: (persistedState: unknown, version: number) => {
        if (version < 4) {
          // 迁移：旧版本没有 constraint 字段，全部重置
          return { prompts: {} } as any;
        }
        return persistedState as any;
      },
    }
  )
);
