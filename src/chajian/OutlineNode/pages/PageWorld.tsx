/**
 * 世界构建 - 面板第二页
 * 保持原始布局结构：核心法则与运行逻辑 + 社会架构与权力分配 两大区
 * 只缩小标签与输入框上下间距，所有标签保留完整
 */
import React from 'react';

const styles: Record<string, React.CSSProperties> = {
  sectionTitle: {
    fontSize: 14,
    margin: '12px 0 4px',
    fontWeight: 600,
    color: '#e0e0e0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  desc: {
    fontSize: 12,
    color: '#808080',
    marginBottom: 6,
  },
  areaLabel: {
    fontSize: 13,
    margin: '8px 0 3px',
    color: '#c8c8c8',
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
  },
  divider: {
    borderTop: '1px solid rgba(255,255,255,0.06)',
    margin: '16px 0',
  },
};

export default function PageWorld() {
  return (
    <div>
      {/* 核心法则与运行逻辑 */}
      <div style={styles.sectionTitle}>核心法则与运行逻辑</div>
      <div style={styles.desc}>世界的基石 - 力量体系、物理规律、魔法/科技机制</div>

      <div style={styles.areaLabel}>力量体系</div>
      <textarea placeholder="请输入内容..." style={styles.textarea} />
      <div style={styles.areaLabel}>物理规则</div>
      <textarea placeholder="请输入内容..." style={styles.textarea} />
      <div style={styles.areaLabel}>魔法/科技机制</div>
      <textarea placeholder="请输入内容..." style={styles.textarea} />

      <div style={styles.divider} />

      {/* 社会架构与权力分配 */}
      <div style={styles.sectionTitle}>社会架构与权力分配</div>
      <div style={styles.desc}>张力来源 - 政治、经济、阶级、冲突</div>

      <div style={styles.areaLabel}>政治体制</div>
      <textarea placeholder="请输入内容..." style={styles.textarea} />
      <div style={styles.areaLabel}>经济模式</div>
      <textarea placeholder="请输入内容..." style={styles.textarea} />
      <div style={styles.areaLabel}>阶级系统</div>
      <textarea placeholder="请输入内容..." style={styles.textarea} />
      <div style={styles.areaLabel}>冲突</div>
      <textarea placeholder="请输入内容..." style={styles.textarea} />
    </div>
  );
}
