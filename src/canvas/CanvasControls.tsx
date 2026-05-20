/**
 * CanvasControls.tsx
 * 
 * 自定义画布控制按钮组
 * 替代 React Flow 默认的 Controls（左下角竖排）
 * 
 * 布局：
 * 固定在右下角，与 LogPanel 按钮同一行
 * 横向排列 3 个按钮：
 *   [＋] [−] [⟲]
 *   ZoomIn ZoomOut FitView
 * 
 * 按钮尺寸：30px 高，40px 宽
 * 位置：距底部 20px，紧挨 LogPanel 按钮（日志按钮右侧）
 */
import React from 'react';
import { useReactFlow } from '@xyflow/react';
import { theme } from '@/theme/neihei-theme';

const btnStyle: React.CSSProperties = {
  width: 40,
  height: 30,
  background: '#1a1a1a',
  border: `1px solid ${theme.colors.inputBorder}`,
  color: theme.colors.textMuted,
  fontSize: 16,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 120ms ease',
  userSelect: 'none',
  fontFamily: "'Consolas', 'Courier New', monospace",
};

const btnHoverStyle: React.CSSProperties = {
  background: '#2a2a2a',
  borderColor: theme.colors.nodeBorder,
  color: theme.colors.textPrimary,
};

export default function CanvasControls() {
  const reactFlow = useReactFlow();

  const handleZoomIn = () => {
    reactFlow.zoomIn({ duration: 200 });
  };

  const handleZoomOut = () => {
    reactFlow.zoomOut({ duration: 200 });
  };

  const handleFitView = () => {
    reactFlow.fitView({ duration: 200, padding: 0.2 });
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        right: 64, // 日志按钮在 right:20, 宽40px → left edge=60; 64-60=4px 等距缝隙
        display: 'flex',
        flexDirection: 'row',
        gap: 4,
        zIndex: 1000,
        borderRadius: 6,
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      }}
    >
      {/* Zoom In */}
      <button
        title="放大 (Zoom In)"
        onClick={handleZoomIn}
        style={{
          ...btnStyle,
          borderTopLeftRadius: 6,
          borderBottomLeftRadius: 6,
        }}
        onMouseEnter={(e) => Object.assign(e.currentTarget.style, btnHoverStyle)}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = btnStyle.background as string;
          e.currentTarget.style.borderColor = (btnStyle.borderColor as string) || theme.colors.inputBorder;
          e.currentTarget.style.color = btnStyle.color as string;
        }}
      >
        ＋
      </button>

      {/* Zoom Out */}
      <button
        title="缩小 (Zoom Out)"
        onClick={handleZoomOut}
        style={btnStyle}
        onMouseEnter={(e) => Object.assign(e.currentTarget.style, btnHoverStyle)}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = btnStyle.background as string;
          e.currentTarget.style.borderColor = (btnStyle.borderColor as string) || theme.colors.inputBorder;
          e.currentTarget.style.color = btnStyle.color as string;
        }}
      >
        −
      </button>

      {/* Fit View */}
      <button
        title="适配画布 (Fit View)"
        onClick={handleFitView}
        style={{
          ...btnStyle,
          borderTopRightRadius: 6,
          borderBottomRightRadius: 6,
        }}
        onMouseEnter={(e) => Object.assign(e.currentTarget.style, btnHoverStyle)}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = btnStyle.background as string;
          e.currentTarget.style.borderColor = (btnStyle.borderColor as string) || theme.colors.inputBorder;
          e.currentTarget.style.color = btnStyle.color as string;
        }}
      >
        ⟲
      </button>
    </div>
  );
};


