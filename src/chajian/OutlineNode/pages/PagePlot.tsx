/**
 * 剧情大纲 - 面板第四页
 * 上区：故事总纲（故事总纲标签 + 小字描述 + 输入框）
 * 下区：三幕结构
 * 紧凑布局：sidebar窄70px，title/desc同排，textarea增大
 */
import React, { useState } from 'react';

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    gap: 12,
  },
  synopsisLabel: {
    fontSize: 14,
    fontWeight: 600,
    color: '#e0e0e0',
    marginBottom: 2,
  },
  synopsisDesc: {
    fontSize: 12,
    color: '#808080',
    marginBottom: 6,
  },
  synopsisInput: {
    width: '100%',
    height: 120,
    borderRadius: 10,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid #1e1e1e',
    padding: 10,
    color: '#e0e0e0',
    outline: 'none',
    fontSize: 12,
    boxSizing: 'border-box' as const,
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    resize: 'none',
  },
  layout: {
    display: 'flex',
    flex: 1,
    gap: 10,
    overflow: 'hidden',
  },
  sidebar: {
    width: 70,
    borderRight: '1px solid rgba(255,255,255,0.08)',
    paddingRight: 8,
    flexShrink: 0,
  },
  sideTitle: {
    marginBottom: 10,
    fontSize: 12,
    color: '#808080',
    fontWeight: 600,
  },
  sideItem: {
    padding: '6px 8px',
    borderRadius: 8,
    background: 'rgba(255,255,255,0.04)',
    marginBottom: 6,
    fontSize: 12,
    color: '#b0b0b0',
    cursor: 'pointer',
    transition: 'all 150ms ease',
  },
  sideItemActive: {
    background: 'rgba(106, 159, 181, 0.15)',
    border: '1px solid #6a9fb5',
    color: '#e0e0e0',
  },
  sideAdd: {
    padding: '6px 8px',
    borderRadius: 8,
    border: '1px dashed rgba(255,255,255,0.2)',
    color: '#666',
    textAlign: 'center',
    fontSize: 12,
    cursor: 'pointer',
    transition: 'all 150ms ease',
  },
  mainContent: {
    flex: 1,
    overflowY: 'auto' as const,
  },
  mainTitle: {
    fontSize: 16,
    marginBottom: 10,
    color: '#e0e0e0',
    fontWeight: 600,
  },
  block: {
    marginBottom: 20,
  },
  blockHeader: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 6,
  },
  blockTitle: {
    fontSize: 14,
    color: '#c8c8c8',
    whiteSpace: 'nowrap',
  },
  blockDesc: {
    fontSize: 12,
    color: '#666',
  },
  textarea: {
    width: '100%',
    height: 150,
    borderRadius: 10,
    border: '1px solid #1e1e1e',
    background: 'rgba(0,0,0,0.3)',
    color: '#e0e0e0',
    padding: 10,
    resize: 'none',
    outline: 'none',
    fontSize: 13,
    boxSizing: 'border-box' as const,
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
  },
};

const acts = ['第一幕', '第二幕', '第三幕'];

export default function PagePlot() {
  const [activeAct, setActiveAct] = useState(acts[0]);

  return (
    <div style={styles.container}>
      {/* 上区：故事总纲 */}
      <div>
        <div style={styles.synopsisLabel}>故事总纲</div>
        <div style={styles.synopsisDesc}>一句话概括主角+目标+障碍+结局走向</div>
        <textarea placeholder="请输入故事总纲..." style={styles.synopsisInput} />
      </div>

      {/* 下区：三幕结构 */}
      <div style={styles.layout}>
        <div style={styles.sidebar}>
          <div style={styles.sideTitle}>三幕九段</div>
          {acts.map((act) => (
            <div
              key={act}
              style={{
                ...styles.sideItem,
                ...(activeAct === act ? styles.sideItemActive : {}),
              }}
              onClick={() => setActiveAct(act)}
            >
              {act}
            </div>
          ))}
          <div style={styles.sideAdd}>＋ 添加</div>
        </div>

        <div style={styles.mainContent}>
          <div style={styles.mainTitle}>{activeAct}</div>
          <PlotBlock title="Summary" desc="本幕核心概要" />
          <PlotBlock title="Act" desc="本幕具体剧情展开" />
        </div>
      </div>
    </div>
  );
}

function PlotBlock({ title, desc }: { title: string; desc: string }) {
  return (
    <div style={styles.block}>
      <div style={styles.blockHeader}>
        <span style={styles.blockTitle}>{title}</span>
        <span style={styles.blockDesc}>— {desc}</span>
      </div>
      <textarea placeholder={`请输入${title}...`} style={styles.textarea} />
    </div>
  );
}
