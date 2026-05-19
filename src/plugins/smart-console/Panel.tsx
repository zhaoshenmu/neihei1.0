/**
 * smart-console/Panel.tsx
 *
 * 智能控制台面板组件（自包含）
 * 自己管理开关状态和右下角开关按钮
 * 通过插件系统自动注册到 floating 插槽
 *
 * 功能：
 *   - 聊天模式（默认）：纯聊天，不显示节点/AI 信息
 *   - 调试模式（点击 🔧 切换）：左侧弹出 300px 调试面板
 *
 * 布局（聊天模式）：
 * ┌──────────────────────────────┐
 * │  💬 聊天           [🔧]      │
 * ├──────────────────────────────┤
 * │                              │
 * │    消息气泡                   │  ← flex: 1，可滚动
 * │                              │
 * ├──────────────────────────────┤
 * │  [输入框 + 发送按钮]          │
 * └──────────────────────────────┘
 *
 * 布局（调试模式）：
 * ┌──────────────────────────────────────────┐
 * │  🔧 调试           [💬]  保留聊天框      │
 * ├──────────────────┬───────────────────────┤
 * │  调试面板 300px   │  聊天面板 300px       │
 * │  节点信息         │  消息气泡             │
 * │  输入/输出        │                      │
 * │  ▼ 数据流         │                      │
 * │  ▼ 面板数据       │                      │
 * │  执行结果         │                      │
 * ├──────────────────┴───────────────────────┤
 * │  [调试指令: 运行 / 展示输出...]            │
 * └──────────────────────────────────────────┘
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { create } from 'zustand';
import { theme } from '@/theme/neihei-theme';
import { useCanvasStore } from '@/store/canvas-store';
import { usePanelDataStore } from '@/store/panel-data-store';
import { useWorldEditorFlowStore } from '@/store/world-editor-flow-store';
import { useApiConnectionStore } from '@/store/api-connection-store';
import { useApiSettingsStore } from '@/store/api-settings-store';
import { executeAiNode } from '@/dataflow/execute-ai-node';
import { pluginRegistry } from '@/plugin-system/plugin-registry';
import { callAiStream } from '@/services/ai-service';

// ── 消息类型 ──
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

// ── 内部状态管理 ──
interface SmartConsoleState {
  isOpen: boolean;
  togglePanel: () => void;
  openPanel: () => void;
  closePanel: () => void;

  /** 调试模式开关 */
  isDebugMode: boolean;
  toggleDebugMode: () => void;

  /** 聊天消息 */
  messages: ChatMessage[];
  addMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  updateMessage: (id: string, content: string) => void;
  deleteMessage: (id: string) => void;
  clearMessages: () => void;

  /** AI 回复加载状态 */
  isAiResponding: boolean;
  setIsAiResponding: (v: boolean) => void;

  /** 调试执行结果 */
  debugOutput: string;
  setDebugOutput: (output: string) => void;
  appendDebugOutput: (output: string) => void;
  clearDebugOutput: () => void;
}

const useSmartConsoleStore = create<SmartConsoleState>()((set) => ({
  isOpen: false,
  togglePanel: () => set((s) => ({ isOpen: !s.isOpen })),
  openPanel: () => set({ isOpen: true }),
  closePanel: () => set({ isOpen: false }),

  isDebugMode: false,
  toggleDebugMode: () => set((s) => ({ isDebugMode: !s.isDebugMode })),

  messages: [],
  addMessage: (msg) =>
    set((s) => ({
      messages: [
        ...s.messages,
        {
          ...msg,
          id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          timestamp: Date.now(),
        },
      ],
    })),
  updateMessage: (id, content) =>
    set((s) => ({
      messages: s.messages.map((m) =>
        m.id === id ? { ...m, content } : m
      ),
    })),
  deleteMessage: (id) =>
    set((s) => ({
      messages: s.messages.filter((m) => m.id !== id),
    })),
  clearMessages: () => set({ messages: [] }),

  isAiResponding: false,
  setIsAiResponding: (v) => set({ isAiResponding: v }),

  debugOutput: '',
  setDebugOutput: (output) => set({ debugOutput: output }),
  appendDebugOutput: (output) =>
    set((s) => ({ debugOutput: s.debugOutput + '\n' + output })),
  clearDebugOutput: () => set({ debugOutput: '' }),
}));

const PANEL_WIDTH = 300;

// ── 工具函数 ──
function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
}

/** 等待节点执行完成 */
function waitForNodeExecution(
  nodeId: string,
  nodeType: string,
  timeout = 120000
): Promise<void> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    let phase: 'waitStart' | 'waitEnd' = 'waitStart';

    const check = () => {
      if (Date.now() - start > timeout) {
        reject(new Error('等待超时（120s）'));
        return;
      }

      const { isRunning, stepStatus } = useWorldEditorFlowStore.getState();
      const hasStartedStep = Object.values(stepStatus).some(
        (s) => s === 'running' || s === 'done'
      );

      if (nodeType === 'world-editor' || nodeType?.includes('Outline')) {
        if (phase === 'waitStart') {
          if (isRunning || hasStartedStep) {
            phase = 'waitEnd';
          } else if (Date.now() - start > 8000) {
            reject(
              new Error(
                '执行未启动。请确保：① 已双击打开世界编辑器面板 ② 世界编辑器面板已渲染完毕'
              )
            );
            return;
          }
        }

        if (phase === 'waitEnd') {
          if (!isRunning) {
            resolve();
            return;
          }
        }
      } else {
        const { nodes } = useCanvasStore.getState();
        const node = nodes.find((n) => n.id === nodeId);
        if (!node) {
          reject(new Error('节点已不存在'));
          return;
        }
        const loading = node.data?._aiLoading;
        const output = node.data?.aiOutput;
        if (!loading || output) {
          resolve();
          return;
        }
      }

      setTimeout(check, 300);
    };

    check();
  });
}

/** 格式化任意数据为可读字符串 */
function formatOutput(data: unknown): string {
  if (data === null || data === undefined) return '（空）';
  if (typeof data === 'string') return data;
  if (typeof data === 'number' || typeof data === 'boolean') return String(data);
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
}

// ════════════════════════════════════════
// 右下角开关按钮
// ════════════════════════════════════════
function ToggleButton() {
  const togglePanel = useSmartConsoleStore((s) => s.togglePanel);

  return (
    <button
      onClick={togglePanel}
      style={{
        position: 'fixed',
        bottom: 20,
        right: 196,
        width: 40,
        height: 30,
        borderRadius: 6,
        background: '#1a1a1a',
        border: `1px solid ${theme.colors.inputBorder}`,
        color: theme.colors.textMuted,
        fontSize: 16,
        cursor: 'pointer',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 150ms ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = '#2a2a2a';
        e.currentTarget.style.borderColor = theme.colors.nodeBorder;
        e.currentTarget.style.color = theme.colors.textPrimary;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = '#1a1a1a';
        e.currentTarget.style.borderColor = theme.colors.inputBorder;
        e.currentTarget.style.color = theme.colors.textMuted;
      }}
      title="智能控制台"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="4 17 10 11 4 5" />
        <line x1="12" y1="19" x2="20" y2="19" />
      </svg>
    </button>
  );
}

// ════════════════════════════════════════
// 消息气泡组件（纯聊天用）
// ════════════════════════════════════════
function MessageBubble({ msg, isBatchMode, isSelected, onToggleSelect, onRequestBatch }: {
  msg: ChatMessage;
  isBatchMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  onRequestBatch?: () => void;
}) {
  const isUser = msg.role === 'user';
  const isSystem = msg.role === 'system';
  const deleteMessage = useSmartConsoleStore((s) => s.deleteMessage);
  const [showMenu, setShowMenu] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  // 点击菜单外部关闭
  useEffect(() => {
    if (!showMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMenu]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setMenuPos({ x: e.clientX, y: e.clientY });
    setShowMenu(true);
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isUser ? 'flex-end' : 'flex-start',
        marginBottom: 10,
      }}
      onContextMenu={handleContextMenu}
    >
      {/* 角色名 + 时间（移到内容上方） */}
      <span
        style={{
          fontSize: 10,
          color: theme.colors.textMuted,
          marginBottom: 2,
          padding: '0 4px',
        }}
      >
        {isBatchMode && (
          <input
            type="checkbox"
            checked={!!isSelected}
            onChange={() => onToggleSelect?.(msg.id)}
            style={{
              cursor: 'pointer',
              width: 12,
              height: 12,
              marginRight: 4,
              verticalAlign: 'middle',
            }}
          />
        )}
        {msg.role === 'user' ? '你' : msg.role === 'system' ? '系统' : 'AI'} ·{' '}
        {formatTime(msg.timestamp)}
      </span>
      <div
        style={{
          maxWidth: '85%',
          padding: '8px 12px',
          borderRadius: 10,
          background: isSystem
            ? 'rgba(255,255,255,0.04)'
            : isUser
              ? theme.colors.portColor + '22'
              : 'rgba(255,255,255,0.08)',
          border: `1px solid ${
            isSystem
              ? 'transparent'
              : isUser
                ? theme.colors.portColor + '44'
                : 'rgba(255,255,255,0.1)'
          }`,
          fontSize: 13,
          lineHeight: 1.5,
          color: theme.colors.textPrimary,
          wordBreak: 'break-word',
          whiteSpace: 'pre-wrap',
        }}
      >
        {msg.content}
      </div>

      {/* 右键菜单 — 固定在鼠标位置 */}
      {showMenu && (
        <div
          ref={menuRef}
          style={{
            position: 'fixed',
            left: menuPos.x,
            top: menuPos.y,
            zIndex: 9999,
            background: '#2a2a2a',
            border: `1px solid ${theme.colors.nodeBorder}`,
            borderRadius: 6,
            padding: '4px 0',
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            minWidth: 120,
          }}
        >
          <button
            onClick={() => {
              deleteMessage(msg.id);
              setShowMenu(false);
            }}
            style={{
              display: 'block',
              width: '100%',
              padding: '6px 12px',
              background: 'none',
              border: 'none',
              color: '#ff6b6b',
              fontSize: 12,
              cursor: 'pointer',
              textAlign: 'left',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
          >
            删除
          </button>
          <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '2px 0' }} />
          <button
            onClick={() => {
              onRequestBatch?.();
              setShowMenu(false);
            }}
            style={{
              display: 'block',
              width: '100%',
              padding: '6px 12px',
              background: 'none',
              border: 'none',
              color: theme.colors.textPrimary,
              fontSize: 12,
              cursor: 'pointer',
              textAlign: 'left',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
          >
            批量删除
          </button>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════
// 聊天面板（纯聊天，无节点信息）
// ════════════════════════════════════════
function ChatTab() {
  const messages = useSmartConsoleStore((s) => s.messages);
  const deleteMessage = useSmartConsoleStore((s) => s.deleteMessage);
  const isAiResponding = useSmartConsoleStore((s) => s.isAiResponding);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [dotCount, setDotCount] = useState(0);
  const [batchMode, setBatchMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // AI 回复中的省略号动画
  useEffect(() => {
    if (!isAiResponding) {
      setDotCount(0);
      return;
    }
    const timer = setInterval(() => {
      setDotCount((n) => (n + 1) % 4);
    }, 500);
    return () => clearInterval(timer);
  }, [isAiResponding]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isAiResponding, batchMode]);

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleRequestBatch = useCallback(() => {
    setBatchMode(true);
    setSelectedIds(new Set());
  }, []);

  const handleBatchDelete = useCallback(() => {
    selectedIds.forEach((id) => deleteMessage(id));
    setSelectedIds(new Set());
    setBatchMode(false);
  }, [selectedIds, deleteMessage]);

  const handleCancelBatch = useCallback(() => {
    setSelectedIds(new Set());
    setBatchMode(false);
  }, []);

  return (
    <>
      {/* 批量删除操作栏 — 固定在顶部，不随滚动条移动 */}
      {batchMode && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '6px 8px',
            marginBottom: 0,
            background: 'rgba(255,107,107,0.08)',
            borderBottom: '1px solid rgba(255,107,107,0.2)',
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 11, color: theme.colors.textPrimary }}>
            已选 {selectedIds.size} 条
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={handleCancelBatch}
              style={{
                padding: '3px 10px',
                borderRadius: 4,
                background: 'none',
                border: `1px solid ${theme.colors.nodeBorder}`,
                color: theme.colors.textMuted,
                fontSize: 11,
                cursor: 'pointer',
              }}
            >
              取消
            </button>
            <button
              onClick={handleBatchDelete}
              disabled={selectedIds.size === 0}
              style={{
                padding: '3px 10px',
                borderRadius: 4,
                background: selectedIds.size > 0 ? '#ff6b6b' : 'rgba(255,107,107,0.2)',
                border: 'none',
                color: selectedIds.size > 0 ? '#000' : '#666',
                fontSize: 11,
                cursor: selectedIds.size > 0 ? 'pointer' : 'default',
              }}
            >
              删除选中
            </button>
          </div>
        </div>
      )}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px',
        }}
      >
        {messages.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              paddingTop: 40,
              color: theme.colors.textMuted,
              fontSize: 12,
              lineHeight: 1.8,
            }}
          >
            <div style={{ fontSize: 24, marginBottom: 8 }}>💬</div>
            <div style={{ fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 4 }}>
              智能控制台
            </div>
            <div style={{ fontSize: 11, color: '#666' }}>
              输入消息开始聊天
              <br />
              🔧 点击右上角按钮切换到调试模式
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              isBatchMode={batchMode}
              isSelected={selectedIds.has(msg.id)}
              onToggleSelect={handleToggleSelect}
              onRequestBatch={handleRequestBatch}
            />
          ))
        )}

        {/* AI 正在回复动画 */}
        {isAiResponding && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              marginBottom: 10,
            }}
          >
            <span
              style={{
                fontSize: 12,
                color: theme.colors.textMuted,
                padding: '0 4px',
                fontStyle: 'italic',
              }}
            >
              {'·'.repeat(dotCount) || ' '}AI 正在回复{'.'.repeat(dotCount)}
            </span>
          </div>
        )}
      </div>
    </>
  );
}

// ════════════════════════════════════════
// 调试面板
// ════════════════════════════════════════
function DebugPanel() {
  const nodes = useCanvasStore((s) => s.nodes);
  const selectedNodeIds = useCanvasStore((s) => s.selectedNodeIds);
  const panelData = usePanelDataStore((s) => s.data);
  const allEdges = useCanvasStore((s) => s.edges);
  const debugOutput = useSmartConsoleStore((s) => s.debugOutput);
  const [, forceUpdate] = useState(0);

  // 每 500ms 刷新确保数据最新
  useEffect(() => {
    const timer = setInterval(() => forceUpdate((n) => n + 1), 500);
    return () => clearInterval(timer);
  }, []);

  const selectedNode = selectedNodeIds.length > 0
    ? nodes.find((n) => n.id === selectedNodeIds[0])
    : null;

  const nodeData = selectedNode?.data as Record<string, unknown> | undefined;
  const nodePanelData = selectedNode ? panelData[selectedNode.id] : undefined;

  // 节点间数据流：只展示选中节点及其上下游
  const upstreamEdges = selectedNode
    ? allEdges
        .filter((e) => e.target === selectedNode.id)
        .map((e) => ({
          sourceNode: nodes.find((n) => n.id === e.source),
          edge: e,
        }))
        .filter((p) => p.sourceNode)
    : [];

  const downstreamEdges = selectedNode
    ? allEdges
        .filter((e) => e.source === selectedNode.id)
        .map((e) => ({
          targetNode: nodes.find((n) => n.id === e.target),
          edge: e,
        }))
        .filter((p) => p.targetNode)
    : [];

  const hasDataFlow = selectedNode && (upstreamEdges.length > 0 || downstreamEdges.length > 0);

  return (
    <div
      style={{
        width: PANEL_WIDTH,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        borderRight: `1px solid ${theme.colors.nodeBorder}`,
        overflow: 'hidden',
      }}
    >
      {/* 可滚动内容区 */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px',
          fontSize: 12,
          color: theme.colors.textPrimary,
          lineHeight: 1.6,
        }}
      >
        {!selectedNode ? (
          <div style={{ textAlign: 'center', paddingTop: 40, color: theme.colors.textMuted, fontSize: 13 }}>
            未选中节点
            <br />
            <span style={{ fontSize: 11 }}>在画布上点击一个节点查看调试信息</span>
          </div>
        ) : (
          <>
            {/* ── 节点基本信息 ── */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: theme.colors.portColor }}>
                节点信息
              </div>
              <InfoRow label="ID" value={selectedNode.id} />
              <InfoRow label="类型" value={selectedNode.type || '未知'} />
              <InfoRow label="fixedId" value={(nodeData?.fixedId as string) || '无'} />
              <InfoRow
                label="位置"
                value={`(${Math.round(selectedNode.position.x)}, ${Math.round(selectedNode.position.y)})`}
              />
            </div>

            {/* ── 节点间数据流 ── */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: theme.colors.portColor }}>
                🔀 节点间数据流
              </div>

              {/* 当前节点的数据 */}
              <div
                style={{
                  marginBottom: 8,
                  border: `1px solid ${theme.colors.portColor}44`,
                  borderRadius: 6,
                  overflow: 'hidden',
                }}
              >
                <div style={{ padding: '5px 8px', background: `${theme.colors.portColor}15` }}>
                  <span style={{ fontWeight: 600, fontSize: 11, color: theme.colors.portColor }}>
                    ⬤ 当前节点（{selectedNode.type || '未知'}）
                  </span>
                </div>
                <div style={{ padding: '5px 8px', borderTop: `1px solid ${theme.colors.nodeBorder}` }}>
                  <div style={{ color: theme.colors.textMuted, fontSize: 10, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span>📥 text</span>
                    <span style={{ fontSize: 9, color: '#666', fontWeight: 400 }}>（从上游接收的数据）</span>
                  </div>
                  <div
                    style={{
                      background: 'rgba(255,255,200,0.06)',
                      borderRadius: 4,
                      padding: '4px 6px',
                      fontSize: 10,
                      color: '#c8b878',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      maxHeight: 60,
                      overflowY: 'auto',
                      lineHeight: 1.3,
                      marginBottom: 4,
                    }}
                  >
                    {nodeData?.text ? String(nodeData.text) : <span style={{ color: '#666' }}>（空）</span>}
                  </div>
                  <div style={{ color: theme.colors.textMuted, fontSize: 10, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span>📤 aiOutput</span>
                    <span style={{ fontSize: 9, color: '#666', fontWeight: 400 }}>（AI 处理结果）</span>
                  </div>
                  <div
                    style={{
                      background: 'rgba(0,255,0,0.04)',
                      borderRadius: 4,
                      padding: '4px 6px',
                      fontSize: 10,
                      color: '#b0d0b0',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      maxHeight: 80,
                      overflowY: 'auto',
                      lineHeight: 1.3,
                    }}
                  >
                    {nodeData?.aiOutput ? String(nodeData.aiOutput) : <span style={{ color: '#666' }}>暂无输出</span>}
                  </div>
                </div>
              </div>

              {/* 上游 → 当前 */}
              {upstreamEdges.map(({ sourceNode, edge }) => {
                const sData = sourceNode!.data as Record<string, unknown> | undefined;
                return (
                  <div
                    key={`up-${edge.id}`}
                    style={{
                      marginBottom: 6,
                      border: `1px solid ${theme.colors.inputBorder}`,
                      borderRadius: 6,
                      overflow: 'hidden',
                    }}
                  >
                    <div style={{ padding: '4px 8px', background: 'rgba(255,255,200,0.03)' }}>
                      <span style={{ fontWeight: 600, fontSize: 10, color: '#f0e0a0' }}>
                        ⬤ {sourceNode!.type || '未知'}（上游）
                      </span>
                      <span style={{ color: theme.colors.textMuted, fontSize: 9, marginLeft: 4 }}>→ text</span>
                    </div>
                    <div
                      style={{
                        padding: '4px 6px',
                        fontSize: 10,
                        color: '#c8b878',
                        background: 'rgba(255,255,200,0.06)',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        maxHeight: 50,
                        overflowY: 'auto',
                        lineHeight: 1.3,
                      }}
                    >
                      {(sData?.text as string) || <span style={{ color: '#666' }}>（空）</span>}
                    </div>
                  </div>
                );
              })}

              {/* 当前 → 下游 */}
              {downstreamEdges.map(({ targetNode, edge }) => {
                const tData = targetNode!.data as Record<string, unknown> | undefined;
                return (
                  <div
                    key={`down-${edge.id}`}
                    style={{
                      marginBottom: 6,
                      border: `1px solid ${theme.colors.inputBorder}`,
                      borderRadius: 6,
                      overflow: 'hidden',
                    }}
                  >
                    <div style={{ padding: '4px 8px', background: 'rgba(0,255,0,0.02)' }}>
                      <span style={{ fontWeight: 600, fontSize: 10, color: '#b0d0b0' }}>
                        ⬤ {targetNode!.type || '未知'}（下游）
                      </span>
                      <span style={{ color: theme.colors.textMuted, fontSize: 9, marginLeft: 4 }}>aiOutput →</span>
                    </div>
                    <div
                      style={{
                        padding: '4px 6px',
                        fontSize: 10,
                        color: '#b0d0b0',
                        background: 'rgba(0,255,0,0.04)',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        maxHeight: 50,
                        overflowY: 'auto',
                        lineHeight: 1.3,
                      }}
                    >
                      {(tData?.aiOutput as string) || <span style={{ color: '#666' }}>暂无输出</span>}
                    </div>
                  </div>
                );
              })}

              {!hasDataFlow && (
                <div style={{ color: theme.colors.textMuted, fontSize: 11, textAlign: 'center', padding: 8 }}>
                  该节点无上下游连接
                </div>
              )}
            </div>

            {/* ── 面板数据（折叠） ── */}
            <details style={{ marginBottom: 14 }}>
              <summary
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: theme.colors.portColor,
                  cursor: 'pointer',
                  padding: '2px 0',
                }}
              >
                📦 面板数据
                {nodePanelData &&
                  `（${Object.keys(nodePanelData).length} 字段）`}
              </summary>
              <div style={{ padding: '6px 0 0 4px' }}>
                {nodePanelData && Object.keys(nodePanelData).length > 0 ? (
                  Object.entries(nodePanelData).map(([key, value]) => (
                    <div key={key} style={{ marginBottom: 6 }}>
                      <div style={{ color: theme.colors.textMuted, marginBottom: 1, fontSize: 10 }}>
                        {key}
                      </div>
                      <div
                        style={{
                          background: 'rgba(255,255,255,0.03)',
                          borderRadius: 4,
                          padding: '4px 6px',
                          fontSize: 10,
                          color: '#d0b080',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          maxHeight: 80,
                          overflowY: 'auto',
                          lineHeight: 1.3,
                        }}
                      >
                        {formatOutput(value)}
                      </div>
                    </div>
                  ))
                ) : (
                  <span style={{ color: theme.colors.textMuted, fontSize: 11 }}>
                    无面板数据
                    <br />
                    <span style={{ fontSize: 9 }}>
                      世界编辑器数据可能存储在此
                    </span>
                  </span>
                )}
              </div>
            </details>
          </>
        )}

        {/* ── 执行结果 ── */}
        <div style={{ marginTop: 4 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 8,
              color: theme.colors.portColor,
            }}
          >
            📋 执行结果
          </div>
          {debugOutput ? (
            <div
              style={{
                background: 'rgba(255,255,255,0.04)',
                borderRadius: 6,
                padding: '8px 10px',
                fontSize: 12,
                color: theme.colors.textPrimary,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                maxHeight: 300,
                overflowY: 'auto',
                lineHeight: 1.5,
              }}
            >
              {debugOutput}
            </div>
          ) : (
            <div style={{ color: theme.colors.textMuted, fontSize: 11, textAlign: 'center', padding: 12 }}>
              输入调试指令，结果会显示在这里
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', marginBottom: 4 }}>
      <span style={{ color: theme.colors.textMuted, minWidth: 60, flexShrink: 0 }}>
        {label}
      </span>
      <span style={{ color: theme.colors.textPrimary, wordBreak: 'break-all' }}>
        {value}
      </span>
    </div>
  );
}

// ════════════════════════════════════════
// 输入框组件
// ════════════════════════════════════════
function InputArea() {
  const isDebugMode = useSmartConsoleStore((s) => s.isDebugMode);
  const toggleDebugMode = useSmartConsoleStore((s) => s.toggleDebugMode);
  const addMessage = useSmartConsoleStore((s) => s.addMessage);
  const isAiResponding = useSmartConsoleStore((s) => s.isAiResponding);
  const setIsAiResponding = useSmartConsoleStore((s) => s.setIsAiResponding);
  const setDebugOutput = useSmartConsoleStore((s) => s.setDebugOutput);
  const appendDebugOutput = useSmartConsoleStore((s) => s.appendDebugOutput);
  const selectedApi = useApiConnectionStore((s) => s.selectedApi);
  const apiSettings = useApiSettingsStore((s) => s.settings);
  const [text, setText] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 根据选中的 API 获取当前模型名和显示样式
  const currentModel = selectedApi === 'general-api'
    ? apiSettings.generalApi.model
    : selectedApi === 'local-api'
      ? apiSettings.localApi.model
      : '';
  const isNetworkModel = selectedApi === 'general-api';
  const hasModel = !!currentModel;

  const handleSend = useCallback(async () => {
    const content = text.trim();
    if (!content || isExecuting) return;

    setText('');

    if (isDebugMode) {
      // ── 调试模式：执行指令，结果进 debugOutput ──
      const { nodes, selectedNodeIds } = useCanvasStore.getState();
      const selectedNode = selectedNodeIds.length > 0
        ? nodes.find((n) => n.id === selectedNodeIds[0])
        : null;

      if (!selectedNode) {
        setDebugOutput('⚠️ 请在画布上选中一个节点再进行调试操作');
        return;
      }

      const lower = content.toLowerCase();

      // 展示输出 / 显示输出 / ai输出
      if (lower.includes('展示输出') || lower.includes('显示输出') || lower.includes('ai输出')) {
        const output = selectedNode.data?.aiOutput;
        if (output) {
          setDebugOutput(`📤 节点 "${selectedNode.type}" 的 AI 输出：\n\n${String(output)}`);
        } else {
          setDebugOutput('该节点暂无 AI 输出内容');
        }
        return;
      }

      // 展示输入 / 显示输入 / 输入内容
      if (lower.includes('展示输入') || lower.includes('显示输入') || lower.includes('输入内容')) {
        const input = selectedNode.data?.text;
        if (input) {
          setDebugOutput(`📥 节点 "${selectedNode.type}" 的输入内容：\n\n${String(input)}`);
        } else {
          setDebugOutput('该节点暂无输入内容');
        }
        return;
      }

      // 运行 / 执行 / 调用ai
      if (lower.includes('运行') || lower.includes('执行') || lower.includes('调用ai')) {
        const nodeType = selectedNode.type || '';

        // world-editor 节点
        if (nodeType === 'world-editor' || nodeType?.includes('Outline')) {
          setIsExecuting(true);
          setDebugOutput(`🔄 正在触发节点 "${nodeType}" 的完整执行流程（5个步骤）...`);

          const origMode: 'auto' | 'manual' = useWorldEditorFlowStore.getState().mode;

          try {
            useWorldEditorFlowStore.getState().resetStepStatus();
            useWorldEditorFlowStore.getState().goToStep(0);
            useWorldEditorFlowStore.getState().setMode('auto');

            const beforeKeys = Object.keys(
              usePanelDataStore.getState().data[selectedNode.id] || {}
            );
            appendDebugOutput(`📋 当前面板已有 ${beforeKeys.length} 个字段，开始触发执行...`);

            useWorldEditorFlowStore.getState().triggerExternalRun();
            await waitForNodeExecution(selectedNode.id, nodeType);

            const afterData = usePanelDataStore.getState().data[selectedNode.id] || {};
            const afterKeys = Object.keys(afterData);
            const newKeys = afterKeys.filter((k) => !beforeKeys.includes(k));

            let result = `✅ 节点 "${nodeType}" 完整流程执行完成\n\n`;
            if (afterKeys.length > 0) {
              result += `📦 面板数据（共 ${afterKeys.length} 个字段）：\n`;
              if (newKeys.length > 0) {
                result += `（新增 ${newKeys.length} 个字段: ${newKeys.join(', ')}）\n`;
              }
              result += `\`\`\`json\n${formatOutput(afterData)}\n\`\`\``;

            } else {
              result += `⚠️ 面板暂无数据。\n\n可能的原因：\n`;
              result += `1. 世界编辑器面板未打开（请双击画布上的节点打开）\n`;
              result += `2. 作品设定页未填写内容\n`;
              result += `3. AI 调用失败（查看浏览器控制台日志）\n\n`;
              result += `💡 请先在世界编辑器面板中填写内容，再试一次`;
            }

            useCanvasStore.getState().updateNodeData(selectedNode.id, {
              text: `世界编辑器输出（${afterKeys.length} 字段）：${Object.keys(afterData).join(', ')}`,
              aiOutput: `面板数据（${afterKeys.length} 字段）：\n${JSON.stringify(afterData, null, 2)}`,
            });

            if (afterKeys.length > 0) {
              result += `\n\n📤 面板数据已写入 text 字段，数据流引擎将自动传播到下游节点`;
            }

            setDebugOutput(result);
          } catch (err) {
            const errMsg = err instanceof Error ? err.message : String(err);
            setDebugOutput(`❌ 执行异常：${errMsg}\n\n💡 提示：请确保已双击打开世界编辑器面板（OutlinePanel），且画布上选中了该节点`);
          } finally {
            useWorldEditorFlowStore.getState().setMode(origMode);
            setIsExecuting(false);
          }
          return;
        }

        // 有连边的普通节点
        const { edges } = useCanvasStore.getState();
        const connectedEdges = edges.filter(
          (e) => e.source === selectedNode.id || e.target === selectedNode.id
        );

        if (connectedEdges.length > 0) {
          const edge = connectedEdges[0];
          const targetNode = nodes.find((n) => n.id === edge.target);
          const targetType = targetNode?.type || '未知';

          if (!pluginRegistry.hasType(targetType)) {
            setDebugOutput(`⏭️ 节点 "${targetType}" 为模板节点（无 AI 逻辑），已跳过 AI 调用`);
            return;
          }

          setDebugOutput(`🔄 正在调用 AI 处理节点 "${targetType}"...`);

          try {
            const result = await executeAiNode({
              sourceNodeId: edge.source,
              targetNodeId: edge.target,
              prompt: content,
              logTag: '调试',
            });

            if (result.success) {
              setDebugOutput(`✅ 节点 "${targetType}" 执行完成\n\n📤 输出内容：\n${result.content || '无输出'}`);
            } else {
              setDebugOutput(`❌ AI 执行失败：${result.error}`);
            }
          } catch (err) {
            setDebugOutput(`❌ 执行异常：${err instanceof Error ? err.message : String(err)}`);
          }
          return;
        }

        // 无连边 → 显示当前数据
        const nodeInput = selectedNode.data?.text;
        const nodeOutput = selectedNode.data?.aiOutput;
        const nodePanelData = usePanelDataStore.getState().data[selectedNode.id];

        let result = `📋 节点 "${selectedNode.type}" 调试信息：\n\n`;
        result += `📥 输入内容：${nodeInput ? `\n${String(nodeInput)}` : '（空）'}\n\n`;
        result += `📤 AI 输出：${nodeOutput ? `\n${String(nodeOutput)}` : '（空）'}`;

        if (nodePanelData && Object.keys(nodePanelData).length > 0) {
          result += `\n\n📦 面板数据：\n\`\`\`json\n${formatOutput(nodePanelData)}\n\`\`\``;
        }

        setDebugOutput(result);
        return;
      }

      // 默认：写入节点的 text 字段
      useCanvasStore.getState().updateNodeData(selectedNode.id, { text: content });
      setDebugOutput(`✅ 已将输入内容写入节点 "${selectedNode.type}" 的 text 字段`);
      return;
    }

    // ── 聊天模式：流式调用 AI 回复 ──
    addMessage({ role: 'user', content });
    setIsAiResponding(true);

    // 构建最近 10 条非 system 消息作为上下文
    const currentMessages = useSmartConsoleStore.getState().messages;
    const recentMessages = currentMessages
      .filter((m) => m.role !== 'system')
      .slice(-10)
      .map((m) => ({ role: m.role, content: m.content }));
    recentMessages.push({ role: 'user', content });

    // 先创建一条空消息，后续实时更新其内容
    addMessage({ role: 'assistant', content: '' });
    const msgs = useSmartConsoleStore.getState().messages;
    const aiMsgId = msgs[msgs.length - 1].id;
    const updateMessage = useSmartConsoleStore.getState().updateMessage;

    let fullText = '';
    await callAiStream(recentMessages, {
      onChunk: (text) => {
        fullText += text;
        updateMessage(aiMsgId, fullText);
      },
      onDone: (_fullText) => {
        setIsAiResponding(false);
        // 如果最终内容为空，显示错误提示
        if (!_fullText) {
          updateMessage(aiMsgId, '⚠️ AI 返回了空回复');
        }
      },
      onError: (err) => {
        updateMessage(aiMsgId, `⚠️ AI 回复失败：${err}`);
        setIsAiResponding(false);
      },
    });
  }, [text, isDebugMode, addMessage, setDebugOutput, appendDebugOutput, isExecuting, isAiResponding]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  return (
    <div
      style={{
        height: 150,
        flexShrink: 0,
        borderTop: `1px solid ${theme.colors.nodeBorder}`,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={
          isDebugMode
            ? '调试指令: 运行 / 展示输出 / 输入文本...'
            : '输入消息... (Enter 发送, Shift+Enter 换行)'
        }
        disabled={isExecuting}
        style={{
          flex: 1,
          width: '100%',
          background: 'rgba(255,255,255,0.04)',
          border: 'none',
          outline: 'none',
          color: theme.colors.textPrimary,
          fontSize: 13,
          fontFamily: theme.fontFamily.sans,
          padding: '10px 12px',
          resize: 'none',
          boxSizing: 'border-box',
          lineHeight: 1.5,
        }}
      />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '4px 8px 6px',
          flexShrink: 0,
        }}
      >
        <button
          onClick={toggleDebugMode}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 10,
            color: isDebugMode ? '#e8a040' : theme.colors.textMuted,
            padding: '2px 6px',
            borderRadius: 4,
            transition: 'all 150ms ease',
            flexShrink: 0,
          }}
          title={isDebugMode ? '切换到聊天模式' : '切换到调试模式'}
        >
          {isDebugMode ? '🔧 调试模式' : '💬 聊天模式'}
        </button>

        {/* 当前 AI 模型名称显示 */}
        <div style={{ flex: 1, textAlign: 'center', overflow: 'hidden', padding: '0 4px' }}>
          <span
            title={hasModel ? `当前模型: ${currentModel}` : '未选择模型'}
            style={{
              fontSize: 10,
              color: !hasModel ? '#666' : isNetworkModel ? '#e8a040' : '#4a9eff',
              textShadow: hasModel
                ? `0 0 6px ${isNetworkModel ? '#e8a040' : '#4a9eff'}, 0 0 12px ${isNetworkModel ? 'rgba(232,160,64,0.5)' : 'rgba(74,158,255,0.5)'}`
                : 'none',
              fontWeight: hasModel ? 600 : 400,
              letterSpacing: hasModel ? '0.3px' : 'normal',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: 'inline-block',
              maxWidth: '100%',
            }}
          >
            {hasModel ? currentModel : '未选择模型'}
          </span>
        </div>

        <button
          onClick={handleSend}
          disabled={!text.trim() || isExecuting}
          style={{
            padding: '4px 14px',
            borderRadius: 4,
            background: text.trim()
              ? isDebugMode
                ? '#e8a040'
                : theme.colors.portColor
              : 'rgba(255,255,255,0.06)',
            border: 'none',
            color: text.trim() ? '#000' : theme.colors.textMuted,
            fontSize: 12,
            cursor: text.trim() ? 'pointer' : 'default',
            opacity: text.trim() ? 1 : 0.4,
            transition: 'all 150ms ease',
            flexShrink: 0,
          }}
        >
          {isExecuting ? '执行中...' : isDebugMode ? '执行' : '发送'}
        </button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════
// 智能控制台主面板
// ════════════════════════════════════════
function ConsolePanel() {
  const isOpen = useSmartConsoleStore((s) => s.isOpen);
  const isDebugMode = useSmartConsoleStore((s) => s.isDebugMode);

  // 切换 API 时自动清空聊天记录（避免前文串模型）
  const prevApiRef = useRef(useApiConnectionStore.getState().selectedApi);
  useEffect(() => {
    const unsub = useApiConnectionStore.subscribe((state, prev) => {
      if (state.selectedApi !== prev.selectedApi) {
        useSmartConsoleStore.getState().clearMessages();
        prevApiRef.current = state.selectedApi;
      }
    });
    return unsub;
  }, []);

  if (!isOpen) return null;

  const totalWidth = isDebugMode ? PANEL_WIDTH * 2 : PANEL_WIDTH;

  return (
    <div
      style={{
        position: 'fixed',
        right: 0,
        top: 45,
        bottom: 55,
        width: totalWidth,
        background: theme.colors.sidebarBg,
        borderLeft: `1px solid ${theme.colors.nodeBorder}`,
        borderRadius: '12px 0 0 12px',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 998,
        fontFamily: theme.fontFamily.sans,
        overflow: 'hidden',
        transition: 'width 200ms ease',
      }}
    >

      {/* 内容区 */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {isDebugMode && <DebugPanel />}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <ChatTab />
          <InputArea />
        </div>
      </div>
    </div>
  );
}

/**
 * 面板主组件（默认导出）
 */
export default function SmartConsolePanel() {
  return (
    <>
      <ToggleButton />
      <ConsolePanel />
    </>
  );
}
