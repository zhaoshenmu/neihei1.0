/**
 * 作品设定 - 面板第一页
 * 填入创意、叙事视角、主角性别/名字、风格选择、规划字数
 * 风格：#0d0d0d / #1e1e1e 暗色统一，紧凑排版
 */
import React, { useState } from 'react';

const styles: Record<string, React.CSSProperties> = {
  sectionTitle: {
    fontSize: 14,
    margin: '12px 0 6px',
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

export default function PageSetting() {
  const [perspective, setPerspective] = useState<'第一人称' | '第三人称'>('第一人称');
  const [gender, setGender] = useState<'男性' | '女性'>('男性');

  return (
    <div>
      <SectionTitle title="填入创意" />
      <textarea placeholder="输入您的创意..." style={styles.textarea} />

      <SectionTitle title="叙事视角" />
      <div style={styles.row}>
        <div
          style={{
            ...styles.radioBtn,
            ...(perspective === '第一人称' ? styles.radioBtnActive : {}),
          }}
          onClick={() => setPerspective('第一人称')}
        >
          <div
            style={{
              ...styles.radioCircle,
              ...(perspective === '第一人称' ? styles.radioCircleActive : {}),
            }}
          />
          第一人称
        </div>
        <div
          style={{
            ...styles.radioBtn,
            ...(perspective === '第三人称' ? styles.radioBtnActive : {}),
          }}
          onClick={() => setPerspective('第三人称')}
        >
          <div
            style={{
              ...styles.radioCircle,
              ...(perspective === '第三人称' ? styles.radioCircleActive : {}),
            }}
          />
          第三人称
        </div>
      </div>

      <SectionTitle title="主角性别" />
      <div style={styles.row}>
        <div
          style={{
            ...styles.radioBtn,
            ...(gender === '男性' ? styles.radioBtnActive : {}),
          }}
          onClick={() => setGender('男性')}
        >
          <div
            style={{
              ...styles.radioCircle,
              ...(gender === '男性' ? styles.radioCircleActive : {}),
            }}
          />
          男性
        </div>
        <div
          style={{
            ...styles.radioBtn,
            ...(gender === '女性' ? styles.radioBtnActive : {}),
          }}
          onClick={() => setGender('女性')}
        >
          <div
            style={{
              ...styles.radioCircle,
              ...(gender === '女性' ? styles.radioCircleActive : {}),
            }}
          />
          女性
        </div>
      </div>

      <SectionTitle title="主角名字" />
      <input placeholder="请输入主角名字..." style={styles.input} />

      <SectionTitle title="风格选择" extra={<span style={styles.plus}>+</span>} />
      <div style={styles.bigBox}>番茄爽文</div>

      <SectionTitle title="规划字数" />
      <div style={styles.smallLabel}>每章规划字数区间</div>
      <div style={styles.selectBox}>
        请选择每章规划字数区间
        <span style={styles.arrow}>▾</span>
      </div>

      <div style={{ height: 8 }} />

      <div style={styles.smallLabel}>总字数</div>
      <div style={styles.selectBox}>
        请输入总字数...
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
