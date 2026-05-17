/**
 * 作品设定 - 面板第一页
 * 填入创意、叙事视角、主角性别/名字、风格选择、规划字数
 * 风格：#0d0d0d / #1e1e1e 暗色统一，紧凑排版
 * 连接到 usePanelDataStore，实现数据双向绑定
 */
import React from 'react';
import { usePanelDataStore } from '@/store/usePanelDataStore';

interface Props {
  nodeId: string;
}

const styles: Record<string, React.CSSProperties> = {
  sectionTitle: {
    fontSize: 14,
    margin: '12px 0 6px',
    fontWeight: 600,
    color: '#b84a4a',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  desc: {
    fontSize: 12,
    color: '#808080',
    marginBottom: 6,
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
  row: {
    display: 'flex',
    gap: 8,
  },
  radioBtn: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 10px',
    borderRadius: 10,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid #1e1e1e',
    fontSize: 12,
    color: '#b0b0b0',
    cursor: 'pointer',
    transition: 'all 150ms ease',
    userSelect: 'none' as const,
  },
  radioBtnActive: {
    background: 'rgba(106, 159, 181, 0.15)',
    border: '1px solid #6a9fb5',
    color: '#e0e0e0',
  },
  radioCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    border: '2px solid #808080',
    flexShrink: 0,
  },
  radioCircleActive: {
    border: '2px solid #6a9fb5',
    background: '#6a9fb5',
  },
  input: {
    width: '100%',
    height: 36,
    borderRadius: 10,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid #1e1e1e',
    padding: '0 10px',
    color: '#e0e0e0',
    outline: 'none',
    fontSize: 12,
    boxSizing: 'border-box' as const,
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    userSelect: 'text' as const,
  },
  bigBox: {
    height: 60,
    borderRadius: 10,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid #1e1e1e',
    display: 'flex',
    alignItems: 'center',
    paddingLeft: 12,
    fontSize: 13,
    color: '#b0b0b0',
  },
  smallLabel: {
    fontSize: 12,
    color: '#808080',
    marginBottom: 4,
    userSelect: 'text' as const,
  },
  selectBox: {
    height: 36,
    borderRadius: 10,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid #1e1e1e',
    display: 'flex',
    alignItems: 'center',
    padding: '0 10px',
    justifyContent: 'space-between',
    fontSize: 12,
    color: '#808080',
    cursor: 'pointer',
  },
  plus: { fontSize: 18, color: '#808080', cursor: 'pointer' },
  arrow: { fontSize: 12, color: '#666' },
  unit: { fontSize: 12, color: '#666' },
};

export default function PageSetting({ nodeId }: Props) {
  // ⚠️ 重要：直接订阅数据字段（返回 undefined 是稳定值，不会导致无限循环）
  const creativeIdea = usePanelDataStore((s) => (s.data[nodeId]?.creativeIdea as string) ?? '');
  const perspective = usePanelDataStore((s) => (s.data[nodeId]?.perspective as string) ?? '第一人称');
  const protagonistGender = usePanelDataStore((s) => (s.data[nodeId]?.protagonistGender as string) ?? '男性');
  const protagonistName = usePanelDataStore((s) => (s.data[nodeId]?.protagonistName as string) ?? '');
  const style = usePanelDataStore((s) => (s.data[nodeId]?.style as string) ?? '番茄爽文');
  const chapterWordCount = usePanelDataStore((s) => (s.data[nodeId]?.chapterWordCount as string) ?? '');
  const totalWordCount = usePanelDataStore((s) => (s.data[nodeId]?.totalWordCount as string) ?? '');
  const updateNodeData = usePanelDataStore((s) => s.updateNodeData);

  const setVal = (key: string, val: any) => updateNodeData(nodeId, key, val);

  return (
    <div>
      <SectionTitle title="填入创意" />
      <textarea
        placeholder="输入您的创意..."
        style={styles.textarea}
        value={creativeIdea}
        onChange={(e) => setVal('creativeIdea', e.target.value)}
      />

      <SectionTitle title="叙事视角" />
      <div style={styles.row}>
        {['第一人称', '第三人称'].map((opt) => (
          <div
            key={opt}
            style={{
              ...styles.radioBtn,
              ...(perspective === opt ? styles.radioBtnActive : {}),
            }}
            onClick={() => setVal('perspective', opt)}
          >
            <div
              style={{
                ...styles.radioCircle,
                ...(perspective === opt ? styles.radioCircleActive : {}),
              }}
            />
            {opt}
          </div>
        ))}
      </div>

      <SectionTitle title="主角性别" />
      <div style={styles.row}>
        {['男性', '女性'].map((opt) => (
          <div
            key={opt}
            style={{
              ...styles.radioBtn,
              ...(protagonistGender === opt ? styles.radioBtnActive : {}),
            }}
            onClick={() => setVal('protagonistGender', opt)}
          >
            <div
              style={{
                ...styles.radioCircle,
                ...(protagonistGender === opt ? styles.radioCircleActive : {}),
              }}
            />
            {opt}
          </div>
        ))}
      </div>

      <SectionTitle title="主角名字" />
      <input
        placeholder="请输入主角名字..."
        style={styles.input}
        value={protagonistName}
        onChange={(e) => setVal('protagonistName', e.target.value)}
      />

      <SectionTitle title="风格选择" extra={<span style={styles.plus}>+</span>} />
      <div
        style={styles.bigBox}
        onClick={() => setVal('style', '番茄爽文')}
      >
        {style || '番茄爽文'}
      </div>

      <SectionTitle title="规划字数" />
      <div style={styles.smallLabel}>每章规划字数区间</div>
      <div style={styles.selectBox}>
        <input
          placeholder="请选择每章规划字数区间"
          style={{
            ...styles.input,
            border: 'none',
            background: 'transparent',
            padding: 0,
            height: 'auto',
          }}
          value={chapterWordCount}
          onChange={(e) => setVal('chapterWordCount', e.target.value)}
        />
        <span style={styles.arrow}>▾</span>
      </div>

      <div style={{ height: 8 }} />

      <div style={styles.smallLabel}>总字数</div>
      <div style={styles.selectBox}>
        <input
          placeholder="请输入总字数..."
          style={{
            ...styles.input,
            border: 'none',
            background: 'transparent',
            padding: 0,
            height: 'auto',
          }}
          value={totalWordCount}
          onChange={(e) => setVal('totalWordCount', e.target.value)}
        />
        <span style={styles.unit}>字</span>
      </div>
    </div>
  );
}

function SectionTitle({
  title,
  extra,
}: {
  title: string;
  extra?: React.ReactNode;
}) {
  return (
    <div style={styles.sectionTitle}>
      <span>{title}</span>
      {extra}
    </div>
  );
}
