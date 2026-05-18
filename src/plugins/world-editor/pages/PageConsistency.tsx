/**
 * 一致性检查 - 面板第五页
 * 各项一致性评分报告
 * 连接到 usePanelDataStore，基于已有数据动态生成报告
 */
import React from 'react';
import { usePanelDataStore } from '@/store/panel-data-store';

interface Props {
  nodeId: string;
}

const styles: Record<string, React.CSSProperties> = {
  checkTitle: {
    textAlign: 'center',
    marginBottom: 24,
    fontSize: 16,
    color: '#e0e0e0',
    fontWeight: 600,
    userSelect: 'text' as const,
  },
  gridContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  itemLabel: {
    fontSize: 13,
    marginBottom: 8,
    color: '#b0b0b0',
    userSelect: 'text' as const,
  },
  progressTrack: {
    width: '100%',
    height: 6,
    background: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #6a9fb5, #8ac4d8)',
    borderRadius: 3,
    transition: 'width 300ms ease',
  },
  scoreText: {
    fontSize: 12,
    color: '#808080',
    marginTop: 4,
    textAlign: 'right',
    userSelect: 'text' as const,
  },
  reportContainer: {
    marginTop: 32,
    padding: 16,
    borderRadius: 12,
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid #1e1e1e',
  },
  reportTitle: {
    fontSize: 14,
    color: '#c8c8c8',
    marginBottom: 8,
    fontWeight: 500,
    userSelect: 'text' as const,
  },
  reportDesc: {
    fontSize: 13,
    color: '#808080',
    lineHeight: 1.6,
    whiteSpace: 'pre-wrap',
    userSelect: 'text' as const,
  },
  aiTag: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 4,
    background: 'rgba(68, 204, 68, 0.12)',
    border: '1px solid rgba(68, 204, 68, 0.25)',
    color: '#44cc44',
    fontSize: 11,
    fontWeight: 500,
    marginLeft: 8,
    verticalAlign: 'middle',
  },
  placeholderTag: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 4,
    background: 'rgba(255, 170, 0, 0.1)',
    border: '1px solid rgba(255, 170, 0, 0.2)',
    color: '#ffaa00',
    fontSize: 11,
    fontWeight: 500,
    marginLeft: 8,
    verticalAlign: 'middle',
  },
};

/**
 * 从AI生成的字符串中提取评分数字（兼容格式："8/10"、"评分8"、"8分" 等）
 */
function extractScoreFromAI(val: any): number | null {
  if (typeof val !== 'string') return null;
  const trimmed = val.trim();
  const match = trimmed.match(/(\d+)(?:\s*\/\s*10)?/);
  if (match) {
    const score = parseInt(match[1], 10);
    if (score >= 1 && score <= 10) return score;
  }
  return null;
}

/**
 * 安全获取字符串长度（null/undefined/非字符串返回0）
 */
function strLen(val: any): number {
  if (typeof val === 'string') return val.trim().length;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val).length;
  return 0;
}

/**
 * 从 data.characters 数组中提取角色字段的文本总长度
 */
function sumCharField(data: Record<string, any>, field: string): number {
  const chars = data.characters;
  if (!Array.isArray(chars)) return 0;
  return chars.reduce((sum: number, c: any) => {
    if (typeof c === 'string') return sum;
    return sum + strLen(c?.[field]);
  }, 0);
}

/**
 * 本地算法计算一致性评分（当AI数据不存在时作为兜底）
 */
function calculateScoresLocally(data: Record<string, any>) {
  let characterScore = 5;
  const chars = data.characters;
  if (Array.isArray(chars) && chars.length > 0) {
    characterScore += 1;
    if (sumCharField(data, 'desire') > 20) characterScore += 2;
    if (sumCharField(data, 'flaw') > 10) characterScore += 1;
    if (sumCharField(data, 'arc') > 20) characterScore += 1;
    if (chars.length >= 3) characterScore += 1;
    const completeChars = chars.filter((c: any) =>
      typeof c === 'object' && c !== null &&
      strLen(c.desire) > 5 && strLen(c.flaw) > 3 && strLen(c.arc) > 5
    );
    if (completeChars.length >= 2) characterScore += 1;
  }

  let worldScore = 5;
  const worldFields = ['powerSystem', 'physicsRules', 'magicTech', 'politicalSystem', 'economyMode', 'classSystem', 'conflict'];
  const filledWorldFields = worldFields.filter(f => strLen(data[f]) > 5);
  worldScore += filledWorldFields.length;
  if (worldFields.some(f => strLen(data[f]) > 50)) worldScore += 1;
  if (filledWorldFields.length >= 5) worldScore += 1;

  let plotScore = 5;
  if (strLen(data.synopsis) > 10) plotScore += 1;
  if (strLen(data.synopsis) > 50) plotScore += 1;
  const plotStruct = data.plot_structure;
  if (plotStruct && typeof plotStruct === 'object') {
    if (strLen(plotStruct.first_act) > 10) plotScore += 1;
    if (strLen(plotStruct.second_act) > 10) plotScore += 1;
    if (strLen(plotStruct.third_act) > 10) plotScore += 1;
    const totalActLen = strLen(plotStruct.first_act) + strLen(plotStruct.second_act) + strLen(plotStruct.third_act);
    if (totalActLen > 100) plotScore += 1;
  }
  if (strLen(data.firstAct) > 5) plotScore += 1;
  if (strLen(data.secondAct) > 5) plotScore += 1;
  if (strLen(data.thirdAct) > 5) plotScore += 1;

  let timelineScore = 5;
  if (strLen(data.chapterWordCount) > 0) timelineScore += 2;
  if (strLen(data.totalWordCount) > 0) timelineScore += 2;
  if (plotStruct && typeof plotStruct === 'object') {
    if (strLen(plotStruct.first_act) > 0) timelineScore += 1;
  }

  return {
    characterConsistency: Math.min(characterScore, 10),
    worldConsistency: Math.min(worldScore, 10),
    plotLogic: Math.min(plotScore, 10),
    timeline: Math.min(timelineScore, 10),
  };
}

function getScoreLabel(score: number): string {
  if (score >= 8) return '优秀';
  if (score >= 6) return '良好';
  if (score >= 4) return '需改进';
  return '薄弱';
}

const STABLE_EMPTY_DATA: Record<string, any> = {};

export default function PageConsistency({ nodeId }: Props) {
  const data = usePanelDataStore(
    (s) => s.data[nodeId] !== undefined ? s.data[nodeId]! : STABLE_EMPTY_DATA
  );

  // 读取新格式的独立评分字段（纯数字），优先使用
  const characterScoreFromField = data.characterConsistencyScore !== undefined ? Number(data.characterConsistencyScore) : 0;
  const worldScoreFromField = data.worldConsistencyScore !== undefined ? Number(data.worldConsistencyScore) : 0;
  const plotLogicScoreFromField = data.plotLogicScore !== undefined ? Number(data.plotLogicScore) : 0;
  const timelineScoreFromField = data.timelineScore !== undefined ? Number(data.timelineScore) : 0;

  // 读取详情文本（已由 process-ai-response 清理过前导评分文字）
  const aiCharacterConsistency = data.characterConsistency as string | undefined;
  const aiWorldConsistency = data.worldConsistency as string | undefined;
  const aiPlotLogic = data.plotLogic as string | undefined;
  const aiTimeline = data.timeline as string | undefined;
  const aiAnalysis = data.analysis as string | undefined;

  // 判断是否有AI数据（只要有一个字段有内容就算有）
  const hasAIData = Boolean(
    aiCharacterConsistency?.trim() ||
    aiWorldConsistency?.trim() ||
    aiPlotLogic?.trim() ||
    aiTimeline?.trim() ||
    aiAnalysis?.trim() ||
    characterScoreFromField > 0 ||
    worldScoreFromField > 0 ||
    plotLogicScoreFromField > 0 ||
    timelineScoreFromField > 0
  );

  // 从AI数据中提取分数（旧格式兜底）
  const aiScores = hasAIData ? {
    characterConsistency: extractScoreFromAI(aiCharacterConsistency) || null,
    worldConsistency: extractScoreFromAI(aiWorldConsistency) || null,
    plotLogic: extractScoreFromAI(aiPlotLogic) || null,
    timeline: extractScoreFromAI(aiTimeline) || null,
  } : null;

  // 本地算法兜底
  const localScores = calculateScoresLocally(data);

  // 最终使用的评分优先级：新格式独立分数 > 从AI文本提取 > 本地算法
  const reportData = [
    {
      label: '人物一致性',
      score: characterScoreFromField > 0 ? characterScoreFromField : (aiScores?.characterConsistency ?? localScores.characterConsistency),
      aiDetail: aiCharacterConsistency || '',
    },
    {
      label: '世界观一致性',
      score: worldScoreFromField > 0 ? worldScoreFromField : (aiScores?.worldConsistency ?? localScores.worldConsistency),
      aiDetail: aiWorldConsistency || '',
    },
    {
      label: '情节逻辑',
      score: plotLogicScoreFromField > 0 ? plotLogicScoreFromField : (aiScores?.plotLogic ?? localScores.plotLogic),
      aiDetail: aiPlotLogic || '',
    },
    {
      label: '时间线',
      score: timelineScoreFromField > 0 ? timelineScoreFromField : (aiScores?.timeline ?? localScores.timeline),
      aiDetail: aiTimeline || '',
    },
  ];

  return (
    <div>
      <div style={styles.checkTitle}>
        一致性检查报告
        {hasAIData && <span style={styles.aiTag}>AI生成</span>}
        {!hasAIData && <span style={styles.placeholderTag}>待AI生成</span>}
      </div>

      <div style={styles.gridContainer}>
        {reportData.map((item, i) => (
          <div key={i}>
            <div style={styles.itemLabel}>
              {item.label}：{item.score}/10
            </div>
            <div style={styles.progressTrack}>
              <div
                style={{
                  ...styles.progressFill,
                  width: `${item.score * 10}%`,
                }}
              />
            </div>
            <div style={styles.scoreText}>
              {getScoreLabel(item.score)}
            </div>
            {/* 如果有AI详细描述，展开显示 */}
            {item.aiDetail && (
              <div
                style={{
                  marginTop: 6,
                  padding: '8px 12px',
                  borderRadius: 6,
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  color: '#a0a0a0',
                  fontSize: 12,
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {item.aiDetail}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* AI综合分析 */}
      {aiAnalysis && (
        <div style={styles.reportContainer}>
          <div style={styles.reportTitle}>综合分析（AI生成）</div>
          <div style={styles.reportDesc}>{aiAnalysis}</div>
        </div>
      )}

      {/* 无AI数据时显示操作提示 */}
      {!hasAIData && (
        <div
          style={{
            marginTop: 16,
            padding: 12,
            borderRadius: 8,
            background: 'rgba(255, 170, 0, 0.05)',
            border: '1px solid rgba(255, 170, 0, 0.15)',
            color: '#ffaa00',
            fontSize: 12,
            textAlign: 'center',
            lineHeight: 1.5,
          }}
        >
          请先点击底部的「▶ 运行」按钮，AI 将根据已有数据生成一致性检查报告
        </div>
      )}
    </div>
  );
}
