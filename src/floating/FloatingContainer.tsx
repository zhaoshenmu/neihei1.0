/**
 * FloatingContainer.tsx
 * 
 * 可拖拽、可调整大小的悬浮窗
 * - 拖拽：react-draggable（无bounds限制）
 * - 调整大小：右下角手动拖拽（mousedown/mousemove/mouseup）
 * - 支持「固定到工作台」和「置顶到画布」
 * 
 * 色调风格：深色 #0d0d0d / #111111
 * 
 * 修复记录：
 * - 移除 CSS resize + ResizeObserver（振荡问题导致窗口变小）
 * - 改为 JS 手动 resize handle
 * - 未传入 defaultX/defaultY 时自动居中
 */
import React, { useRef, useEffect, useState, useCallback } from 'react';
import Draggable from 'react-draggable';
import { createPortal } from 'react-dom';
import { theme } from '@/theme/neihei-theme';
import { useLayoutStore } from '@/store/useLayoutStore';

interface FloatingContainerProps {
  children: React.ReactNode;
  nodeId: string;
  pluginType: string;
  title: string;
  onClose: () => void;
  onPin?: () => void;
  onSticky?: () => void;
  isPinnedToWorkbench?: boolean;
  isSticky?: boolean;
  defaultX?: number;
  defaultY?: number;
  defaultWidth?: number;
  defaultHeight?: number;
  onDragStop?: (x: number, y: number) => void;
  onResizeStop?: (width: number, height: number) => void;
  onClick?: () => void;
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
  onPin,
  onSticky,
  isPinnedToWorkbench = false,
  isSticky = false,
  defaultX,
  defaultY,
  defaultWidth = 420,
  defaultHeight = 300,
  onDragStop,
  onResizeStop,
  onClick,
}: FloatingContainerProps) {
  const nodeRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(() => {
    if (defaultX !== undefined && defaultY !== undefined) {
      return { x: defaultX, y: defaultY };
    }
    return getInitialCenter(defaultWidth, defaultHeight);
  });
  const [size, setSize] = useState({ width: defaultWidth, height: defaultHeight });

  // ── resize 手动拖拽 ──
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
      const newW = Math.max(300, startSize.current.w + dx);
      const newH = Math.max(180, startSize.current.h + dy);
      setSize({ width: newW, height: newH });
    };
    const onMouseUp = () => {
      if (!resizing.current) return;
      resizing.current = false;
      onResizeStop?.(size.width, size.height);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [onResizeStop, size]);

  // ESC 关闭
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleDrag = useCallback((_e: any, data: { x: number; y: number }) => {
    setPosition({ x: data.x, y: data.y });
  }, []);

  const handleDragStop = useCallback((_e: any, data: { x: number; y: number }) => {
    setPosition({ x: data.x, y: data.y });
    onDragStop?.(data.x, data.y);
  }, [onDragStop]);

  const workbenchPanels = useLayoutStore((s) => s.panels);
  const alreadyPinned = workbenchPanels.some(
    (p) => p.nodeId === nodeId || p.id === `${pluginType}:${nodeId}`
  );
  const pinDisabled = isPinnedToWorkbench || alreadyPinned;

  return createPortal(
    <Draggable
      nodeRef={nodeRef}
      handle=".drag-handle"
      position={position}
      onDrag={handleDrag}
      onStop={handleDragStop}
    >
      <div
        ref={nodeRef}
        onClick={onClick}
        style={{
          position: 'fixed',
          zIndex: isSticky ? 900 : 1000,
          top: 0,
          left: 0,
          pointerEvents: 'auto',
          width: size.width,
          height: size.height,
          minWidth: 300,
          minHeight: 180,
          overflow: 'hidden',
          background: '#0d0d0d',
          borderRadius: 12,
          boxShadow: '-4px 0 24px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          border: `1px solid ${theme.colors.inputBorder}`,
        }}
      >
        {/* 标题栏 - 拖拽手柄 */}
        <div
          className="drag-handle"
          style={{
            cursor: 'move',
            padding: '12px 16px',
            background: '#111111',
            borderBottom: `1px solid ${theme.colors.inputBorder}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            userSelect: 'none',
            flexShrink: 0,
          }}
        >
          <span style={{ color: theme.colors.textPrimary, fontSize: 14, fontWeight: 600 }}>
            ⚙️ {title || '配置面板'}
          </span>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            {onPin && (
              <button
                onClick={pinDisabled ? undefined : onPin}
                title={pinDisabled ? '已在工作台中' : '固定到工作台'}
                disabled={pinDisabled}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: pinDisabled ? '#555' : theme.colors.textMuted,
                  fontSize: 15,
                  cursor: pinDisabled ? 'not-allowed' : 'pointer',
                  padding: '0 4px',
                  lineHeight: 1,
                  transition: 'color 150ms ease',
                  opacity: pinDisabled ? 0.5 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!pinDisabled) e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  if (!pinDisabled) e.currentTarget.style.color = theme.colors.textMuted;
                }}
              >
                📌 固定
              </button>
            )}
            {onSticky && (
              <button
                onClick={onSticky}
                title={isSticky ? '已置顶' : '置顶到画布'}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: isSticky ? theme.colors.nodeBorderSelected : theme.colors.textMuted,
                  fontSize: 15,
                  cursor: 'pointer',
                  padding: '0 4px',
                  lineHeight: 1,
                  transition: 'color 150ms ease',
                }}
                onMouseEnter={(e) => {
                  if (!isSticky) e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  if (!isSticky) e.currentTarget.style.color = theme.colors.textMuted;
                }}
              >
                📍 置顶
              </button>
            )}
            <button
              onClick={onClose}
              title="关闭"
              style={{
                background: 'transparent',
                border: 'none',
                color: theme.colors.textMuted,
                fontSize: 18,
                cursor: 'pointer',
                padding: '0 4px',
                lineHeight: 1,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#e06060'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = theme.colors.textMuted; }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* 内容区域 */}
        <div
          ref={innerRef}
          style={{
            padding: 20,
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
