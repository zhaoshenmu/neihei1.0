/**
 * WorkflowPanel.tsx
 * 
 * 工作流面板 - 和 Sidebar 同宽（260px）
 * 点击左侧 Vault 的「工作流」按钮展开
 * 
 * 功能：
 * - 顶部标题栏：右边「保存」「删除」按钮
 * - 「删除」按钮切换显示多选框模式
 * - 点击工作流行加载到画布
 * - 右键菜单：「删除」「重命名」
 * - 点击名称直接重命名（inline edit）
 * 
 * 布局：
 * - 每个工作流卡片是独立区块，margin: 5px
 * - 列表容器 padding: 5px，保证距标题栏和左右边缘各 5px
 * - 卡片之间自然形成 5px 缝隙
 * - 滚动条支持鼠标滚轮滚动
 */
import React, { useState, useRef, useEffect } from 'react';
import { useWorkflowStore, type WorkflowEntry } from '@/store/workflow-store';
import { useCanvasStore } from '@/store/canvas-store';
import { theme } from '@/theme/neihei-theme';

/** 格式化 ISO 时间为友好显示 */
function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return iso;
  }
}

const WorkflowPanel: React.FC = () => {
  const {
    workflows,
    selectedIds,
    saveWorkflow,
    deleteWorkflow,
    deleteSelected,
    toggleSelect,
    deselectAll,
    renameWorkflow,
  } = useWorkflowStore();

  const loadCanvas = useCanvasStore((s) => s.loadCanvas);

  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [workflowName, setWorkflowName] = useState('');
  const [deleteMode, setDeleteMode] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    workflow: WorkflowEntry;
  } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  // 点击其他地方关闭右键菜单
  useEffect(() => {
    const close = () => setContextMenu(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, []);

  // 编辑时自动聚焦输入框
  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  // 退出删除模式时取消全选
  const handleToggleDeleteMode = () => {
    if (deleteMode) {
      deselectAll();
    }
    setDeleteMode(!deleteMode);
  };

  const handleSave = () => {
    const name = workflowName.trim();
    if (!name) return;
    const canvasState = useCanvasStore.getState();
    const flowData = {
      nodes: canvasState.nodes,
      edges: canvasState.edges,
    };
    saveWorkflow(name, flowData);
    setWorkflowName('');
    setSaveDialogOpen(false);
  };

  const handleLoad = (wf: WorkflowEntry) => {
    if (deleteMode) return;
    if (editingId) return;
    console.log(`[Workflow] 加载: ${wf.name}`);
    loadCanvas(wf.data.nodes || [], wf.data.edges || []);
  };

  const handleContextMenu = (e: React.MouseEvent, wf: WorkflowEntry) => {
    e.preventDefault();
    if (editingId) return;
    setContextMenu({ x: e.clientX, y: e.clientY, workflow: wf });
  };

  const handleContextDelete = () => {
    if (contextMenu) {
      deleteWorkflow(contextMenu.workflow.id);
      setContextMenu(null);
    }
  };

  const handleContextRename = () => {
    if (contextMenu) {
      setEditingId(contextMenu.workflow.id);
      setEditName(contextMenu.workflow.name);
      setContextMenu(null);
    }
  };

  const handleRenameSubmit = (id: string) => {
    const name = editName.trim();
    if (name) {
      renameWorkflow(id, name);
    }
    setEditingId(null);
    setEditName('');
  };

  // 统一面板色
  const savedBg = '#0d0d0d';

  return (
    <>
      <div
        style={{
          width: theme.spacing.sidebarWidth,
          height: '100%',
          background: theme.colors.sidebarBg,
          borderRight: `1px solid ${theme.colors.inputBorder}`,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        {/* 标题栏 */}
        <div
          style={{
            padding: '14px 16px 10px',
            borderBottom: `1px solid ${theme.colors.inputBorder}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <h2
            style={{
              color: theme.colors.textPrimary,
              fontSize: theme.fontSize.large,
              fontWeight: 700,
              margin: 0,
              fontFamily: theme.fontFamily.sans,
            }}
          >
            工作流
          </h2>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => setSaveDialogOpen(true)}
              style={{
                background: 'transparent',
                border: `1px solid ${theme.colors.inputBorder}`,
                borderRadius: 4,
                color: theme.colors.textMuted,
                padding: '3px 10px',
                fontSize: 11,
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = theme.colors.nodeBorder;
                e.currentTarget.style.color = theme.colors.textPrimary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = theme.colors.inputBorder;
                e.currentTarget.style.color = theme.colors.textMuted;
              }}
            >
              + 保存
            </button>
            <button
              onClick={handleToggleDeleteMode}
              style={{
                background: deleteMode ? 'rgba(224,96,96,0.15)' : 'transparent',
                border: `1px solid ${
                  deleteMode ? '#e06060' : theme.colors.inputBorder
                }`,
                borderRadius: 4,
                color: deleteMode ? '#e06060' : theme.colors.textMuted,
                padding: '3px 10px',
                fontSize: 11,
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#e06060';
                e.currentTarget.style.color = '#e06060';
              }}
              onMouseLeave={(e) => {
                if (!deleteMode) {
                  e.currentTarget.style.borderColor = theme.colors.inputBorder;
                  e.currentTarget.style.color = theme.colors.textMuted;
                }
              }}
            >
              {deleteMode ? '取消' : '删除'}
            </button>
          </div>
        </div>

        {/* 工作流列表 — overflow-y: auto 支持鼠标滚轮滚动 */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '5px',
          }}
          className="sidebar-scroll"
        >
          {workflows.length === 0 ? (
            <div
              style={{
                color: theme.colors.textMuted,
                fontSize: theme.fontSize.small,
                textAlign: 'center',
                padding: 40,
                fontFamily: theme.fontFamily.sans,
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 12, opacity: 0.5 }}>⚡</div>
              <div>暂无保存的工作流</div>
              <div style={{ marginTop: 8, opacity: 0.6, fontSize: 11 }}>
                点击上方「+ 保存」保存当前画布
              </div>
            </div>
          ) : (
            workflows.map((wf) => {
              const isSelected = selectedIds.has(wf.id);
              const isEditing = editingId === wf.id;
              return (
                <div
                  key={wf.id}
                  onClick={() => {
                    if (deleteMode) {
                      toggleSelect(wf.id);
                    } else if (!isEditing) {
                      handleLoad(wf);
                    }
                  }}
                  onContextMenu={(e) => handleContextMenu(e, wf)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '0 12px',
                    height: 40,
                    margin: '5px',
                    borderRadius: 6,
                    cursor: deleteMode ? 'default' : 'pointer',
                    background: isSelected
                      ? 'rgba(106, 159, 181, 0.15)'
                      : savedBg,
                    border: `1px solid ${
                      isSelected ? 'rgba(106,159,181,0.3)' : 'rgba(255,255,255,0.04)'
                    }`,
                    transition: 'background 150ms ease',
                    userSelect: 'none',
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected && !deleteMode) {
                      e.currentTarget.style.background = '#111111';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected && !deleteMode) {
                      e.currentTarget.style.background = savedBg;
                    }
                  }}
                >
                  {/* 复选框：仅在删除模式显示 */}
                  {deleteMode && (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(wf.id)}
                      onClick={(e) => e.stopPropagation()}
                      style={{ accentColor: theme.colors.portColor, flexShrink: 0 }}
                    />
                  )}

                  {/* 工作流信息 */}
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    {isEditing ? (
                      <input
                        ref={editInputRef}
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={() => handleRenameSubmit(wf.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRenameSubmit(wf.id);
                          if (e.key === 'Escape') {
                            setEditingId(null);
                            setEditName('');
                          }
                          e.stopPropagation();
                        }}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          width: '100%',
                          padding: '2px 6px',
                          background: '#0d0d0d',
                          border: `1px solid ${theme.colors.portColor}`,
                          borderRadius: 4,
                          color: theme.colors.textPrimary,
                          fontSize: 13,
                          fontWeight: 500,
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          color: theme.colors.textPrimary,
                          fontSize: 13,
                          fontWeight: 500,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {wf.name}
                      </div>
                    )}
                    <div
                      style={{
                        color: theme.colors.textMuted,
                        fontSize: 10,
                      }}
                    >
                      {formatTime(wf.savedAt)}
                    </div>
                  </div>

                  {/* 右键提示 */}
                  {!deleteMode && (
                    <span
                      style={{
                        color: theme.colors.textMuted,
                        fontSize: 10,
                        opacity: 0.4,
                      }}
                    >
                      ⋮
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* 删除模式底部提示 */}
        {deleteMode && (
          <div
            style={{
              padding: '8px 16px',
              borderTop: `1px solid ${theme.colors.inputBorder}`,
              display: 'flex',
              gap: 8,
              alignItems: 'center',
              flexShrink: 0,
            }}
          >
            <button
              onClick={deleteSelected}
              disabled={selectedIds.size === 0}
              style={{
                flex: 1,
                padding: '6px 0',
                background: selectedIds.size > 0 ? 'rgba(224,96,96,0.2)' : 'transparent',
                border: `1px solid ${
                  selectedIds.size > 0 ? '#e06060' : theme.colors.inputBorder
                }`,
                borderRadius: 4,
                color: selectedIds.size > 0 ? '#e06060' : theme.colors.textMuted,
                fontSize: 11,
                cursor: selectedIds.size > 0 ? 'pointer' : 'not-allowed',
                opacity: selectedIds.size > 0 ? 1 : 0.4,
              }}
            >
              删除所选 ({selectedIds.size})
            </button>
            <button
              onClick={handleToggleDeleteMode}
              style={{
                padding: '6px 12px',
                background: 'transparent',
                border: `1px solid ${theme.colors.inputBorder}`,
                borderRadius: 4,
                color: theme.colors.textMuted,
                fontSize: 11,
                cursor: 'pointer',
              }}
            >
              完成
            </button>
          </div>
        )}
      </div>

      {/* 保存对话框 */}
      {saveDialogOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1200,
          }}
          onClick={() => setSaveDialogOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#0d0d0d',
              border: `1px solid ${theme.colors.inputBorder}`,
              borderRadius: 12,
              padding: 20,
              width: 300,
            }}
          >
            <div
              style={{
                color: theme.colors.textPrimary,
                fontSize: 14,
                fontWeight: 600,
                marginBottom: 12,
              }}
            >
              保存工作流
            </div>
            <input
              ref={inputRef}
              type="text"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') setSaveDialogOpen(false);
              }}
              placeholder="输入工作流名称..."
              autoFocus
              style={{
                width: '100%',
                padding: '8px 10px',
                background: '#0d0d0d',
                border: `1px solid ${theme.colors.inputBorder}`,
                borderRadius: 6,
                color: theme.colors.textPrimary,
                fontSize: 13,
                outline: 'none',
                boxSizing: 'border-box',
                marginBottom: 12,
              }}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setSaveDialogOpen(false)}
                style={{
                  background: 'transparent',
                  border: `1px solid ${theme.colors.inputBorder}`,
                  borderRadius: 6,
                  color: theme.colors.textMuted,
                  padding: '6px 16px',
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={!workflowName.trim()}
                style={{
                  background: workflowName.trim() ? '#2d2d2d' : '#1a1a1a',
                  border: `1px solid ${
                    workflowName.trim()
                      ? theme.colors.nodeBorder
                      : theme.colors.inputBorder
                  }`,
                  borderRadius: 6,
                  color: workflowName.trim() ? theme.colors.textPrimary : theme.colors.textMuted,
                  padding: '6px 16px',
                  fontSize: 12,
                  cursor: workflowName.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 右键菜单 */}
      {contextMenu && (
        <div
          style={{
            position: 'fixed',
            left: contextMenu.x,
            top: contextMenu.y,
            background: '#0d0d0d',
            border: `1px solid ${theme.colors.inputBorder}`,
            borderRadius: 8,
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
            zIndex: 1300,
            overflow: 'hidden',
            minWidth: 160,
          }}
        >
          <div
            onClick={handleContextRename}
            style={{
              padding: '8px 16px',
              color: theme.colors.textPrimary,
              fontSize: 12,
              cursor: 'pointer',
              borderBottom: `1px solid rgba(255,255,255,0.05)`,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            重命名
          </div>
          <div
            onClick={handleContextDelete}
            style={{
              padding: '8px 16px',
              color: '#e06060',
              fontSize: 12,
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(224, 96, 96, 0.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            删除
          </div>
        </div>
      )}
    </>
  );
};

export default WorkflowPanel;
