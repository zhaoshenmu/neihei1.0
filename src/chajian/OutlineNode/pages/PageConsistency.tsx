/**
 * 一致性检查 - 面板第五页
 * 各项一致性评分报告
 * 风格：#0d0d0d / #1e1e1e 暗色统一
 */
import React from 'react';

const styles: Record<string, React.CSSProperties> = {
  checkTitle: {
    textAlign: 'center',
    marginBottom: 24,
    fontSize: 16,
    color: '#e0e0e0',
    fontWeight: 600,
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
  },
};

const reportData = [
  { label: '人物一致性', score: 6 },
  { label: '世界观一致性', score: 7 },
  { label: '情节逻辑', score: 5 },
  { label: '时间线', score: 8 },
];

export default function PageConsistency() {
  return (
    <div>
      <div style={styles.checkTitle}>一致性检查报告摘要</div>

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
              {item.score >= 8
                ? '优秀'
                : item.score >= 6
                  ? '良好'
                  : item.score >= 4
                    ? '需改进'
                    : '薄弱'}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: 32,
          padding: 16,
          borderRadius: 12,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid #1e1e1e',
        }}
      >
        <div style={{ fontSize: 14, color: '#c8c8c8', marginBottom: 8, fontWeight: 500 }}>
          综合分析
        </div>
        <div style={{ fontSize: 13, color: '#808080', lineHeight: 1.6 }}>
          当前整体一致性评分中等，建议优先处理情节逻辑（5/10）中的漏洞，其次是人物一致性问题。世界观和时间线表现较好。
        </div>
      </div>
    </div>
  );
}
