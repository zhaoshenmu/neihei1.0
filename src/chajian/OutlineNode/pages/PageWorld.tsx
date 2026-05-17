/**
 * 世界构建 - 面板第二页
 * 保持原始布局结构：核心法则与运行逻辑 + 社会架构与权力分配 两大区
 * 只缩小标签与输入框上下间距，所有标签保留完整
 * 连接到 usePanelDataStore，实现数据双向绑定
 *
 * ⚠️ 每个字段必须独立订阅，严禁使用 s.data[nodeId] ?? {}
 * 因为 ?? {} 每次创建新对象引用，导致 zustand 误判数据变化 → 无限循环渲染
 */
import React from 'react';
import { usePanelDataStore } from '@/store/usePanelDataStore';

interface Props {
  nodeId: string;
}

const styles: Record<string, React.CSSProperties> = {
  sectionTitle: {
    fontSize: 14,
    margin: '12px 0 4px',
    fontWeight: 600,
    color: '#4a6ab8',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  desc: {
    fontSize: 12,
    color: '#808080',
    marginBottom: 6,
    userSelect: 'text' as const,
  },
  areaLabel: {
    fontSize: 13,
    margin: '8px 0 3px',
    color: '#c8c8c8',
    userSelect: 'text' as const,
  },
  textarea: {
    width: '100%',
    height: 80,
    borderRadius: 10,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid #1e1e1e',
    padding: 10,
    color: '#e0e0e0',
    resize: 'none',
    outline: 'none',
    fontSize: 12,
    boxSizing: 'border-box' as const,
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    userSelect: 'text' as const,
  },
  divider: {
    borderTop: '1px solid rgba(255,255,255,0.06)',
    margin: '16px 0',
  },
};

export default function PageWorld({ nodeId }: Props) {
  // ⚠️ 重要：每个字段独立订阅，避免 ?? {} 创建新引用导致无限循环
  const powerSystem = usePanelDataStore((s) => (s.data[nodeId]?.powerSystem as string) ?? '');
  const physicsRules = usePanelDataStore((s) => (s.data[nodeId]?.physicsRules as string) ?? '');
  const magicTech = usePanelDataStore((s) => (s.data[nodeId]?.magicTech as string) ?? '');
  const politicalSystem = usePanelDataStore((s) => (s.data[nodeId]?.politicalSystem as string) ?? '');
  const economyMode = usePanelDataStore((s) => (s.data[nodeId]?.economyMode as string) ?? '');
  const classSystem = usePanelDataStore((s) => (s.data[nodeId]?.classSystem as string) ?? '');
  const conflict = usePanelDataStore((s) => (s.data[nodeId]?.conflict as string) ?? '');
  const updateNodeData = usePanelDataStore((s) => s.updateNodeData);

  const setVal = (key: string, val: any) => updateNodeData(nodeId, key, val);

  return (
    <div>
      {/* 核心法则与运行逻辑 */}
      <div style={styles.sectionTitle}>核心法则与运行逻辑</div>
      <div style={styles.desc}>世界的基石 - 力量体系、物理规律、魔法/科技机制</div>

      <div style={styles.areaLabel}>力量体系</div>
      <textarea placeholder="请输入内容..." style={styles.textarea} value={powerSystem} onChange={(e) => setVal('powerSystem', e.target.value)} />
      <div style={styles.areaLabel}>物理规则</div>
      <textarea placeholder="请输入内容..." style={styles.textarea} value={physicsRules} onChange={(e) => setVal('physicsRules', e.target.value)} />
      <div style={styles.areaLabel}>魔法/科技机制</div>
      <textarea placeholder="请输入内容..." style={styles.textarea} value={magicTech} onChange={(e) => setVal('magicTech', e.target.value)} />

      <div style={styles.divider} />

      {/* 社会架构与权力分配 */}
      <div style={styles.sectionTitle}>社会架构与权力分配</div>
      <div style={styles.desc}>张力来源 - 政治、经济、阶级、冲突</div>

      <div style={styles.areaLabel}>政治体制</div>
      <textarea placeholder="请输入内容..." style={styles.textarea} value={politicalSystem} onChange={(e) => setVal('politicalSystem', e.target.value)} />
      <div style={styles.areaLabel}>经济模式</div>
      <textarea placeholder="请输入内容..." style={styles.textarea} value={economyMode} onChange={(e) => setVal('economyMode', e.target.value)} />
      <div style={styles.areaLabel}>阶级系统</div>
      <textarea placeholder="请输入内容..." style={styles.textarea} value={classSystem} onChange={(e) => setVal('classSystem', e.target.value)} />
      <div style={styles.areaLabel}>冲突</div>
      <textarea placeholder="请输入内容..." style={styles.textarea} value={conflict} onChange={(e) => setVal('conflict', e.target.value)} />
    </div>
  );
}
