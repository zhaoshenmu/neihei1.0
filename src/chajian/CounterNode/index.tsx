/**
 * 计数器节点插件
 * 带 +1 按钮的交互式计数器
 */
import React, { useState, useCallback } from 'react';
import type { NodeProps } from '@xyflow/react';

const CounterNode: React.FC<NodeProps> = () => {
  const [count, setCount] = useState(0);

  const increment = useCallback(() => {
    setCount((c) => c + 1);
  }, []);

  const reset = useCallback(() => {
    setCount(0);
  }, []);

  return (
    <div
      style={{
        padding: '8px 4px',
        color: '#b0b0b0',
        fontSize: 13,
        textAlign: 'center',
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
      }}
    >
      {/* 计数值 */}
      <div
        style={{
          fontSize: 28,
          fontWeight: 700,
          color: '#e0e0e0',
          marginBottom: 8,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {count}
      </div>

      {/* 按钮组 */}
      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
        <button
          onClick={increment}
          style={{
            background: '#333333',
            border: '1px solid #4a4a4a',
            color: '#e0e0e0',
            borderRadius: 6,
            padding: '4px 16px',
            fontSize: 13,
            cursor: 'pointer',
            transition: 'all 100ms ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#404040';
            e.currentTarget.style.borderColor = '#6a9fb5';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#333333';
            e.currentTarget.style.borderColor = '#4a4a4a';
          }}
        >
          +1
        </button>
        <button
          onClick={reset}
          style={{
            background: 'transparent',
            border: '1px solid #3a3a3a',
            color: '#808080',
            borderRadius: 6,
            padding: '4px 12px',
            fontSize: 12,
            cursor: 'pointer',
            transition: 'all 100ms ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#b0b0b0';
            e.currentTarget.style.borderColor = '#4a4a4a';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#808080';
            e.currentTarget.style.borderColor = '#3a3a3a';
          }}
        >
          重置
        </button>
      </div>
    </div>
  );
};

export default CounterNode;
