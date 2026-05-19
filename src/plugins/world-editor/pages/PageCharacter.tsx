/**
 * 人物核心 - 面板第三页
 * 主要角色列表 + 角色欲望/缺陷/弧光
 * 连接到 usePanelDataStore，实现数据双向绑定
 *
 * 数据结构: characters: [{ name, desire, flaw, arc, ... }]
 * 兼容旧格式: characters: ["主角", "反派"] + desire/flaw/arc 作为全局字段
 */
import React, { useState, useMemo } from 'react';
import { usePanelDataStore } from '@/store/panel-data-store';

interface Props {
  nodeId: string;
}

interface CharacterItem {
  name: string;
  desire: string;
  flaw: string;
  arc: string;
  personality: string;
}

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
    userSelect: 'text' as const,
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
    userSelect: 'none' as const,
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
    color: '#b84a4a',
    fontWeight: 600,
    userSelect: 'text' as const,
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
    color: '#b84a4a',
    whiteSpace: 'nowrap',
    userSelect: 'text' as const,
  },
  blockDesc: {
    fontSize: 12,
    color: '#666',
    userSelect: 'text' as const,
  },
  textarea: {
    width: '100%',
    height: 130,
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
    userSelect: 'text' as const,
  },
};

/** 稳定的空数组引用，防止 zustand 选择器每次返回新 [] 导致额外重渲染 */
const STABLE_EMPTY_ARRAY: readonly unknown[] = [];

export default function PageCharacter({ nodeId }: Props) {
  const charactersRaw = usePanelDataStore(
    (s) => {
      const val = s.data[nodeId]?.characters;
      return val !== undefined ? val : STABLE_EMPTY_ARRAY;
    }
  );
  const updateNodeData = usePanelDataStore((s) => s.updateNodeData);

  // 构建统一的角色列表（兼容字符串、数组、对象等各种旧格式）
  const characterList: CharacterItem[] = useMemo(() => {
    if (Array.isArray(charactersRaw)) {
      return charactersRaw.map((c: unknown) => {
        if (typeof c === 'string') {
          return { name: c, desire: '', flaw: '', arc: '', personality: '' };
        }
        const obj = (c ?? {}) as Record<string, unknown>;
        return {
          name: typeof obj.name === 'string' ? obj.name : '',
          desire: typeof obj.desire === 'string' ? obj.desire : '',
          flaw: typeof obj.flaw === 'string' ? obj.flaw : '',
          arc: typeof obj.arc === 'string' ? obj.arc : '',
          personality: typeof obj.personality === 'string' ? obj.personality : '',
        };
      });
    }

    if (typeof charactersRaw === 'string' && charactersRaw.trim()) {
      return charactersRaw.split(/[,，、\s]+/).filter(Boolean).map(name => ({
        name: name.trim(),
        desire: '',
        flaw: '',
        arc: '',
        personality: '',
      }));
    }

    return [];
  }, [charactersRaw]);

  const [activeCharIdx, setActiveCharIdx] = useState(0);
  const activeChar = characterList[activeCharIdx];

  const getCharField = (field: keyof CharacterItem): string => {
    if (!activeChar) return '';
    return activeChar[field] || '';
  };

  const setCharField = (field: keyof CharacterItem, value: string) => {
    if (!Array.isArray(charactersRaw)) return;

    const updatedChars = charactersRaw.map((c: unknown, idx: number) => {
      if (idx !== activeCharIdx) return c;
      if (typeof c === 'string') {
        return {
          name: c,
          desire: field === 'desire' ? value : '',
          flaw: field === 'flaw' ? value : '',
          arc: field === 'arc' ? value : '',
          personality: field === 'personality' ? value : '',
        };
      }
      const obj = (c ?? {}) as Record<string, unknown>;
      return { ...obj, [field]: value };
    });

    updateNodeData(nodeId, 'characters', updatedChars);
  };

  // 🔍 调试：打印 AI 返回的原始 characters 数据
  if (process.env.NODE_ENV === 'development' && Array.isArray(charactersRaw) && charactersRaw.length > 0) {
    const sample = charactersRaw[0];
    if (typeof sample === 'object' && sample !== null) {
      const hasPersonality = 'personality' in (sample as Record<string, unknown>);
      console.log(`[PageCharacter] characters[0] 字段: ${Object.keys(sample as Record<string, unknown>).join(', ')}`, hasPersonality ? '✅ 有 personality' : '❌ 无 personality');
    }
  }

  if (characterList.length === 0) {
    return (
      <div style={{ color: '#808080', textAlign: 'center', padding: 40 }}>
        暂无角色数据，请先在作品设定中填写主要角色名称，或通过 AI 生成。
      </div>
    );
  }

  return (
    <div style={styles.layout}>
      {/* 左侧角色列表 */}
      <div style={styles.sidebar}>
        <div style={styles.sideTitle}>主要角色</div>
        {characterList.map((char, idx) => (
          <div
            key={idx}
            style={{
              ...styles.sideItem,
              ...(idx === activeCharIdx ? styles.sideItemActive : {}),
            }}
            onClick={() => setActiveCharIdx(idx)}
          >
            {char.name || `角色${idx + 1}`}
          </div>
        ))}
        <div style={styles.sideAdd}>+ 添加</div>
      </div>

      {/* 右侧角色详情 */}
      {activeChar && (
        <div style={styles.mainContent}>
          <div style={styles.mainTitle}>{activeChar.name || '未命名角色'}</div>
          <CharacterBlock
            title="欲望"
            desc="角色内心最强烈的渴求或目标"
            value={getCharField('desire')}
            onChange={(v) => setCharField('desire', v)}
          />
          <CharacterBlock
            title="缺陷"
            desc="阻碍角色成长的弱点或性格缺陷"
            value={getCharField('flaw')}
            onChange={(v) => setCharField('flaw', v)}
          />
          <CharacterBlock
            title="弧光"
            desc="角色在故事中的成长与转变轨迹"
            value={getCharField('arc')}
            onChange={(v) => setCharField('arc', v)}
          />
          <CharacterBlock
            title="性格"
            desc="角色的性格特征与行为模式"
            value={getCharField('personality')}
            onChange={(v) => setCharField('personality', v)}
          />
        </div>
      )}
    </div>
  );
}

function CharacterBlock({
  title,
  desc,
  value,
  onChange,
}: {
  title: string;
  desc: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div style={styles.block}>
      <div style={styles.blockHeader}>
        <span style={styles.blockTitle}>{title}</span>
        <span style={styles.blockDesc}>— {desc}</span>
      </div>
      <textarea
        placeholder={`请输入${title}...`}
        style={styles.textarea}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
