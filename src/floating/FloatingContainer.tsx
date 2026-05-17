/**
 * FloatingContainer.tsx
 * 
 * 可拖拽、可调整大小的悬浮窗
 * - 拖拽：react-draggable（整个面板拖拽，无标题栏）
 * - 调整大小：右下角手动拖拽（mousedown/mousemove/mouseup）
 * - 标题栏、置顶按钮、关闭按钮已移除，改为右键菜单控制
 * - 右键菜单通过 onContextMenu 回调由父组件提供
 * - 紧凑排版：内部 padding 改为 12px 14px
 * 
 * 色调风格：深色 #0d0d0d / #111111
 */
import React, { useRef, useEffect, useState, useCallback } from 'react';
import Draggable from 'react-draggable';
import { createPortal } from 'react-dom';
import { theme } from '@/theme/neihei-theme';
import { getCanvasBounds, clampPositionWithinCanvas } from '@/utils/canvas-bounds';

interface FloatingContainerProps {
  children: React.ReactNode;
  nodeId: string;
  pluginType: string;
  title: string;
  onClose: () => void;
  onSticky?: () => void;
  isSticky?: boolean;
  defaultX?: number;
  defaultY?: number;
  defaultWidth?: number;
  defaultHeight?: number;
  onDragStop?: (x: number, y: number) => void;
  onResizeStop?: (width: number, height: number) => void;
  onClick?: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  /** 最小宽度（默认300） */
  minWidth?: number;
  /** 最大宽度（默认不限） */
  maxWidth?: number;
  /** 最小高度（默认180） */
  minHeight?: number;
  /** 最大高度（默认不限） */
  maxHeight?: number;
}

function getInitialCenter(width: number, height: number) {
  const cx = (window.innerWidth - width) / 2;
  const cy = (window.innerHeight - height) / 2;
  return { x: Math.max(0, cx), y: Math.max(0, cy) };
}

export function FloatingContainer({
  children,
  nodeId,
  pluginType,
  title,
  onClose,
  onSticky,
  isSticky = false,
  defaultX,
  defaultY,
  defaultWidth = 420,
  defaultHeight = 300,
  onDragStop,
  onResizeStop,
  onClick,
  onContextMenu,
  minWidth = 300,
  maxWidth,
  minHeight = 180,
  maxHeight,
}: FloatingContainerProps) {
  // mark these as used to suppress TS6133
  void nodeId;
  void pluginType;
  void title;
  void onClose;
  void onSticky;
  
  const nodeRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(() => {
    if (defaultX !== undefined && defaultY !== undefined) {
      return { x: defaultX, y: defaultY };
    }
    return getInitialCenter(defaultWidth, defaultHeight);
  });
  const [size, setSize] = useState({ width: defaultWidth, height: defaultHeight });

  // ── resize 手动拖拽（约束到画布容器内） ──
  const resizing = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const startSize = useRef({ w: 0, h: 0 });

  const onResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resizing.current = true;
    startPos.current = { x: e.clientX, y: e.clientY };
    startSize.current = { w: size.width, h: size.height };
  }, [size]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!resizing.current) return;
      const dx = e.clientX - startPos.current.x;
      const dy = e.clientY - startPos.current.y;
      let newW = startSize.current.w + dx;
      let newH = startSize.current.h + dy;
      newW = Math.max(minWidth, newW);
      if (maxWidth !== undefined) newW = Math.min(maxWidth, newW);
      newH = Math.max(minHeight, newH);
      if (maxHeight !== undefined) newH = Math.min(maxHeight, newH);
      
      // 约束 resize 不超出画布容器右/下边界
      const bounds = getCanvasBounds();
      if (bounds) {
        const maxPossibleW = bounds.right - position.x - 4;
        const maxPossibleH = bounds.bottom - position.y - 4;
        newW = Math.min(newW, maxPossibleW, maxWidth ?? Infinity);
        newH = Math.min(newH, maxPossibleH, maxHeight ?? Infinity);
      }
      
      setSize({ width: Math.max(minWidth, newW), height: Math.max(minHeight, newH) });
    };
    const onMouseUp = () => {
      if (!resizing.current) return;
      resizing.current = false;
      // 使用最新的 size（通过闭包获取最新值）
      setSize(prev => {
        onResizeStop?.(prev.width, prev.height);
        return prev;
      });
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [onResizeStop, size, position.x, position.y, minWidth, minHeight, maxWidth, maxHeight]);

  const handleDrag = useCallback((_e: any, data: { x: number; y: number }) => {
    // 拖拽过程中实时约束位置到画布容器内
    const clamped = clampPositionWithinCanvas(data.x, data.y, size.width, size.height);
    setPosition({ x: clamped.x, y: clamped.y });
  }, [size]);

  const handleDragStop = useCallback((_e: any, data: { x: number; y: number }) => {
    // 停止拖拽时确保位置在画布容器内
    const clamped = clampPositionWithinCanvas(data.x, data.y, size.width, size.height);
    setPosition({ x: clamped.x, y: clamped.y });
    onDragStop?.(clamped.x, clamped.y);
  }, [onDragStop, size]);

  return createPortal(
    <Draggable
      nodeRef={nodeRef}
      position={position}
      onDrag={handleDrag}
      onStop={handleDragStop}
      cancel="input, textarea, [contenteditable], [data-no-drag]"
    >
      <div
        ref={nodeRef}
        onClick={onClick}
        onContextMenu={onContextMenu}
        style={{
          position: 'fixed',
          zIndex: isSticky ? 900 : 1000,
          top: 0,
          left: 0,
          pointerEvents: 'auto',
          width: size.width,
          height: size.height,
          minWidth,
          minHeight,
          maxWidth,
          maxHeight,
          overflow: 'hidden',
          background: '#0d0d0d',
          borderRadius: 12,
          boxShadow: '-4px 0 24px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          border: `1px solid ${theme.colors.inputBorder}`,
          cursor: 'grab',
        }}
      >
        {/* 内容区域 */}
        <div
          ref={innerRef}
          style={{
            padding: '12px 14px',
            overflow: 'auto',
            flex: 1,
            color: theme.colors.textPrimary,
          }}
        >
          {children}
        </div>

        {/* 右下角手动 resize 手柄 */}
        <div
          onMouseDown={onResizeStart}
          style={{
            position: 'absolute',
            right: 0,
            bottom: 0,
            width: 16,
            height: 16,
            cursor: 'se-resize',
            zIndex: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 14 14">
            <line x1="10" y1="14" x2="14" y2="10" stroke="#888" strokeWidth="1.5" />
            <line x1="6" y1="14" x2="14" y2="6" stroke="#666" strokeWidth="1.5" />
            <line x1="2" y1="14" x2="14" y2="2" stroke="#444" strokeWidth="1.5" />
          </svg>
        </div>
      </div>
    </Draggable>,
    document.body
  );
}
