/**
 * 人物核心 - 面板第三页
 * 主要角色列表 + 角色欲望/缺陷/弧光
 * 紧凑布局：sidebar窄70px，标题+小字同排，textarea增大
 */
import React, { useState } from 'react';

const styles: Record<string, React.CSSProperties> = {
  layout: {
    display: 'flex',
    height: '100%',
    gap: 10,
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
    height: 180,
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

const characters = ['张三', '李四', '王五'];

export default function PageCharacter() {
  const [activeChar, setActiveChar] = useState(characters[0]);

  return (
    <div style={styles.layout}>
      <div style={styles.sidebar}>
        <div style={styles.sideTitle}>主要角色</div>
        {characters.map((name) => (
          <div
            key={name}
            style={{
              ...styles.sideItem,
              ...(activeChar === name ? styles.sideItemActive : {}),
            }}
            onClick={() => setActiveChar(name)}
          >
            {name}
          </div>
        ))}
        <div style={styles.sideAdd}>＋ 添加</div>
      </div>

      <div style={styles.mainContent}>
        <div style={styles.mainTitle}>{activeChar}</div>
        <CharacterBlock title="欲望" desc="角色内心最强烈的渴求或目标" />
        <CharacterBlock title="缺陷" desc="阻碍角色成长的弱点或性格缺陷" />
        <CharacterBlock title="弧光" desc="角色在故事中的成长与转变轨迹" />
      </div>
    </div>
  );
}

function CharacterBlock({ title, desc }: { title: string; desc: string }) {
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
