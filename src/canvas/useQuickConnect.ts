/**
 * useQuickConnect.ts
 *
 * 快速连接菜单 Hook
 * 从端口拖出连线到空白处时弹出节点选择菜单
 */
import { useState, useCallback, useRef } from 'react';

export interface QuickConnectMenuState {
  x: number;
  y: number;
  sourceNodeId: string;
  sourceHandleId: string | null;
  handleType: 'source' | 'target' | null;
}

export function useQuickConnect() {
  const [quickConnectMenu, setQuickConnectMenu] = useState<QuickConnectMenuState | null>(null);
  const isConnectingRef = useRef(false);
  const quickConnectMenuRef = useRef<{
    sourceNodeId: string;
    sourceHandleId: string | null;
    handleType: 'source' | 'target' | null;
  }>({ sourceNodeId: '', sourceHandleId: null, handleType: null });

  const onConnectStart = useCallback(
    (
      _event: unknown,
      params: { nodeId: string | null; handleId: string | null; handleType: string | null }
    ) => {
      isConnectingRef.current = true;
      quickConnectMenuRef.current = {
        sourceNodeId: params.nodeId ?? '',
        sourceHandleId: params.handleId,
        handleType: params.handleType as 'source' | 'target' | null,
      };
    },
    []
  );

  /** 拖放结束：如果没连到节点则弹出快速选择菜单 */
  const onConnectEnd = useCallback((event: unknown) => {
    if (!isConnectingRef.current) return;
    isConnectingRef.current = false;

    const ev = event as { clientX?: number; clientY?: number; sourceEvent?: { clientX?: number; clientY?: number } };
    const clientX = ev?.clientX ?? ev?.sourceEvent?.clientX ?? 0;
    const clientY = ev?.clientY ?? ev?.sourceEvent?.clientY ?? 0;

    if (!quickConnectMenuRef.current.sourceNodeId) return;

    setQuickConnectMenu({
      x: clientX + 10,
      y: clientY + 10,
      sourceNodeId: quickConnectMenuRef.current.sourceNodeId,
      sourceHandleId: quickConnectMenuRef.current.sourceHandleId,
      handleType: quickConnectMenuRef.current.handleType,
    });
  }, []);

  /** 标记已成功连接到目标（由 onConnect 调用，阻止菜单弹出） */
  const markConnected = useCallback(() => {
    isConnectingRef.current = false;
  }, []);

  /** 关闭菜单 */
  const closeQuickConnect = useCallback(() => {
    setQuickConnectMenu(null);
  }, []);

  return {
    quickConnectMenu,
    isConnectingRef,
    quickConnectMenuRef,
    onConnectStart,
    onConnectEnd,
    markConnected,
    closeQuickConnect,
  };
}
