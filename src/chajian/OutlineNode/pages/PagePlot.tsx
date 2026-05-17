/**
 * 剧情大纲 - 面板第四页
 * 一句话总纲 + 三幕式结构（开端/中段/结尾）
 * 连接到 usePanelDataStore，数据双向绑定
 *
 * 数据结构:
 * - synopsis: string（一句话总纲）
 * - plot_structure: { first_act: string, second_act: string, third_act: string }
 * - 兼容旧格式：act1, act2, act3 作为独立字段
 */
import React from 'react';
import { usePanelDataStore } from '@/store/usePanelDataStore';

interface Props {
  nodeId: string;
}

interface PlotStructure {
  first_act?: string;
  second_act?: string;
  third_act?: string;
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '0 0px',
    overflowY: 'auto' as const,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  synopsisCard: {
    background: 'rgba(106, 159, 181, 0.08)',
    border: '1px solid rgba(106, 159, 181, 0.2)',
    borderRadius: 12,
    padding: 16,
  },
  synopsisLabel: {
    fontSize: 13,
    fontWeight: 600,
    color: '#e0e0e0',
    marginBottom: 8,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    userSelect: 'text' as const,
  },
  synopsisBadge: {
    fontSize: 11,
    background: 'rgba(106, 159, 181, 0.2)',
    color: '#6a9fb5',
    padding: '2px 8px',
    borderRadius: 10,
  },
  synopsisInput: {
    width: '100%',
    height: 44,
    borderRadius: 10,
    border: '1px solid rgba(106, 159, 181, 0.15)',
    background: 'rgba(0,0,0,0.3)',
    color: '#e0e0e0',
    padding: '0 12px',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box' as const,
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    userSelect: 'text' as const,
  },
  actCard: {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 16,
  },
  actHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  actBadge: {
    width: 6,
    height: 40,
    borderRadius: 3,
    flexShrink: 0,
  },
  actTitleBlock: {},
  actTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: '#4a6ab8',
    lineHeight: 1.3,
    userSelect: 'text' as const,
  },
  actDesc: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
    userSelect: 'text' as const,
  },
  textarea: {
    width: '100%',
    minHeight: 100,
    borderRadius: 8,
    border: '1px solid #1e1e1e',
    background: 'rgba(0,0,0,0.3)',
    color: '#e0e0e0',
    padding: 10,
    resize: 'vertical' as const,
    outline: 'none',
    fontSize: 13,
    lineHeight: 1.6,
    boxSizing: 'border-box' as const,
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    userSelect: 'text' as const,
  },
  tips: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    lineHeight: 1.5,
    userSelect: 'text' as const,
  },
};

const ACTS = [
  {
    key: 'first_act' as const,
    label: '第一幕 · 开端',
    desc: '建立世界观、引入主角、埋下冲突伏笔',
    color: '#6a9fb5',
    placeholder: '描述故事的开端：主角的日常、触发事件、核心冲突的萌芽...',
    tip: '💡 建议包含：主角登场 → 日常展示 → 激励事件 → 决定冒险',
  },
  {
    key: 'second_act' as const,
    label: '第二幕 · 中段',
    desc: '冲突升级、角色成长、转折与反转让故事跌宕起伏',
    color: '#b58a6a',
    placeholder: '描述故事的发展：主角面对的挑战、盟友与敌人、重大转折...',
    tip: '💡 建议包含：新挑战 → 团队集结 → 重大失败 → 绝境重生',
  },
  {
    key: 'third_act' as const,
    label: '第三幕 · 结尾',
    desc: '高潮对决、主题升华、角色弧光完成',
    color: '#8a6ab5',
    placeholder: '描述故事的结局：最终冲突、角色蜕变、结局呈现...',
    tip: '💡 建议包含：最终对决 → 主题揭示 → 角色完成弧光 → 余韵',
  },
];

export default function PagePlot({ nodeId }: Props) {
  // ⚠️ 重要：必须订阅实际的数据字段，而不是 getNodeData 函数本身。
  // 如果使用 getNodeData 函数，组件不会在数据变化时重新渲染！
  const synopsis = usePanelDataStore((s) => s.data[nodeId]?.synopsis ?? '');
  const plotStructureRaw = usePanelDataStore((s) => s.data[nodeId]?.plot_structure);
  const nodeData = usePanelDataStore((s) => s.data[nodeId]); // 订阅整个节点数据以获取 fallback 字段
  const updateNodeData = usePanelDataStore((s) => s.updateNodeData);

  // 兼容多种格式：
  // 1. 对象: { first_act: "...", second_act: "...", third_act: "..." }
  // 2. 字符串: 尝试解析
  // 3. undefined/null: 尝试读取扁平字段
  const plotData: PlotStructure = React.useMemo(() => {
    let result: PlotStructure = {};
    if (plotStructureRaw && typeof plotStructureRaw === 'object' && !Array.isArray(plotStructureRaw)) {
      result = plotStructureRaw as PlotStructure;
    } else if (plotStructureRaw && typeof plotStructureRaw === 'string') {
      try { result = JSON.parse(plotStructureRaw); } catch {}
    }
    
    // 兼容旧格式：从扁平的 nodeData 读取
    if (!result.first_act && nodeData?.first_act) result.first_act = nodeData.first_act;
    else if (!result.first_act && nodeData?.act1) result.first_act = nodeData.act1;
    if (!result.second_act && nodeData?.second_act) result.second_act = nodeData.second_act;
    else if (!result.second_act && nodeData?.act2) result.second_act = nodeData.act2;
    if (!result.third_act && nodeData?.third_act) result.third_act = nodeData.third_act;
    else if (!result.third_act && nodeData?.act3) result.third_act = nodeData.act3;
    
    return result;
  }, [plotStructureRaw, nodeData]);

  const getActValue = (actKey: string): string => {
    const val = (plotData as any)[actKey];
    return val && typeof val === 'string' && val.trim() ? val : '';
  };

  const setActValue = (actKey: string, value: string) => {
    const current = usePanelDataStore.getState().data[nodeId]?.plot_structure || {};
    const base = typeof current === 'object' ? current : {};
    updateNodeData(nodeId, 'plot_structure', { ...base, [actKey]: value });
  };

  return (
    <div style={styles.container}>
      {/* 一句话总纲 */}
      <div style={styles.synopsisCard}>
        <div style={styles.synopsisLabel}>
          📖 一句话总纲
          <span style={styles.synopsisBadge}>核心</span>
        </div>
        <input
          placeholder="用一句话概括整个故事的核心..."
          style={styles.synopsisInput}
          value={synopsis}
          onChange={(e) => updateNodeData(nodeId, 'synopsis', e.target.value)}
        />
      </div>

      {/* 三幕结构 */}
      {ACTS.map((act) => (
        <div key={act.key} style={styles.actCard}>
          <div style={styles.actHeader}>
            <div style={{ ...styles.actBadge, background: act.color }} />
            <div style={styles.actTitleBlock}>
              <div style={styles.actTitle}>{act.label}</div>
              <div style={styles.actDesc}>{act.desc}</div>
            </div>
          </div>
          <textarea
            style={styles.textarea}
            placeholder={act.placeholder}
            value={getActValue(act.key)}
            onChange={(e) => setActValue(act.key, e.target.value)}
          />
          <div style={styles.tips}>{act.tip}</div>
        </div>
      ))}
    </div>
  );
}
