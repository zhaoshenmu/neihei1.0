/**
 * 人物核心 - 面板第三页
 * 主要角色列表 + 角色欲望/缺陷/弧光
 * 连接到 usePanelDataStore，实现数据双向绑定
 * 
 * 数据结构: characters: [{ name, desire, flaw, arc, ... }]
 * 兼容旧格式: characters: ["主角", "反派"] + desire/flaw/arc 作为全局字段
 * 
 * ⚠️ BUG修复历史：
 *   - 原使用 s.data[nodeId]?.characters ?? [] 虽不会无限循环，
 *     但当 characters 从 undefined 第一次被写入时，zustand 对比两次 selector 返回值不同（[] vs [实际数据]）
 *     触发正常重渲染，这是预期行为
 *   - 真正无限循环是 s.data[nodeId] ?? {}（容器级），已在 PageSetting/PageWorld 修复
 */
import React, { useState, useMemo } from 'react';
import { usePanelDataStore } from '@/store/usePanelDataStore';

interface Props {
  nodeId: string;
}

interface CharacterItem {
  name: string;
  desire: string;
  flaw: string;
  arc: string;
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
    userSelect: 'text' as const,
  },
};

/** 稳定的空数组引用，防止 zustand 选择器每次返回新 [] 导致额外重渲染 */
const STABLE_EMPTY_ARRAY: any[] = [];

export default function PageCharacter({ nodeId }: Props) {
  // ⚠️ 重要：当 characters 为 undefined 时返回 STABLE_EMPTY_ARRAY（稳定引用）
  // 避免 zustand 对比出"变化"触发不必要渲染
  const charactersRaw = usePanelDataStore(
    (s) => {
      const val = s.data[nodeId]?.characters;
      return val !== undefined ? val : STABLE_EMPTY_ARRAY;
    }
  );
  const updateNodeData = usePanelDataStore((s) => s.updateNodeData);
  
  // 构建统一的人物列表（兼容字符串、数组、对象等各种旧格式）
  const characterList: CharacterItem[] = useMemo(() => {
    if (Array.isArray(charactersRaw)) {
      return charactersRaw.map((c: any) => {
        if (typeof c === 'string') {
          // 旧格式：只是字符串名称
          return { name: c, desire: '', flaw: '', arc: '' };
        }
        // 新格式：对象 { name, desire, flaw, arc }
        return {
          name: c?.name || '',
          desire: c?.desire || '',
          flaw: c?.flaw || '',
          arc: c?.arc || '',
        };
      });
    }
    
    // 兼容旧版：如果 characters 是纯字符串（如 "主角,反派"）
    if (typeof charactersRaw === 'string' && charactersRaw.trim()) {
      return charactersRaw.split(/[,，、\s]+/).filter(Boolean).map(name => ({
        name: name.trim(),
        desire: '',
        flaw: '',
        arc: '',
      }));
    }
    
    return [];
  }, [charactersRaw]);

  const [activeCharIdx, setActiveCharIdx] = useState(0);
  const activeChar = characterList[activeCharIdx];

  /** 获取角色的某个字段 */
  const getCharField = (field: keyof CharacterItem): string => {
    if (!activeChar) return '';
    return activeChar[field] || '';
  };

  /** 更新角色的某个字段 - 直接修改 characters 数组 */
  const setCharField = (field: keyof CharacterItem, value: string) => {
    if (!Array.isArray(charactersRaw)) return;
    
    const updatedChars = charactersRaw.map((c: any, idx: number) => {
      if (idx !== activeCharIdx) return c;
      if (typeof c === 'string') {
        // 旧格式升级为新格式
        return {
          name: c,
          desire: field === 'desire' ? value : '',
          flaw: field === 'flaw' ? value : '',
          arc: field === 'arc' ? value : '',
        };
      }
      return { ...c, [field]: value };
    });
    
    updateNodeData(nodeId, 'characters', updatedChars);
  };

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
        <div style={styles.sideAdd}>＋ 添加</div>
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
