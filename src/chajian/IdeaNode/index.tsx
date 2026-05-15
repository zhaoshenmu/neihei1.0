/**
 * Idea 节点 - 想法输入节点
 * 用户输入想法或创意
 * 固定高度，文字自动换行，删除文字不崩溃
 * 使用纯内部状态，不依赖外部 data
 */
import React, { useState, useCallback } from 'react';
import type { NodeProps } from '@xyflow/react';

const IdeaNode: React.FC<NodeProps> = () => {
  const [text, setText] = useState('');

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setText(e.target.value);
    },
    []
  );

  return (
    <div
      style={{
        padding: '8px 4px',
        color: '#b0b0b0',
        fontSize: 13,
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
        minWidth: 200,
        maxWidth: 300,
      }}
    >
      {/* 文本输入框 - 固定高度，自动换行 */}
      <textarea
        value={text}
        onChange={handleChange}
        placeholder="输入你的想法..."
        style={{
          width: '100%',
          height: 72,
          background: '#1a1a1a',
          border: '1px solid #333333',
          borderRadius: 4,
          color: '#e0e0e0',
          padding: '6px 8px',
          fontSize: 13,
          fontFamily: "'Inter', 'Segoe UI', sans-serif",
          lineHeight: 1.5,
          resize: 'none',
          outline: 'none',
          boxSizing: 'border-box',
          transition: 'border-color 150ms ease',
          textAlign: 'left',
          overflowY: 'auto',
          wordWrap: 'break-word',
          whiteSpace: 'pre-wrap',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = '#6a9fb5';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = '#333333';
        }}
      />

      {/* 字数统计 - 右下角 */}
      <div
        style={{
          marginTop: 4,
          fontSize: 10,
          color: '#606060',
          textAlign: 'right',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {text.length} 字
      </div>
    </div>
  );
};

export default IdeaNode;
