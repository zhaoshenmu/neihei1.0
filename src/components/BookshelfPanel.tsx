/**
 * BookshelfPanel.tsx
 *
 * 书架面板 - 900x440 模态框
 * 点击顶部工具栏「书架」→「打开书架」时弹出
 *
 * 布局说明：
 * ┌─────────────────────────────────────┐
 * │  📚 书架                   ✕       │  ← 标题栏 40px
 * ├─────────────────────────────────────┤
 * │                                     │
 * │  书架区域（每排7本书）              │  ← 300px 高度
 * │  ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐
 * │  │  │ │  │ │  │ │  │ │  │ │  │ │  │
 * │  └──┘ └──┘ └──┘ └──┘ └──┘ └──┘ └──┘
 * ├─────────────────────────────────────┤
 * │  选中书本详情（100px）              │  ← 100px 高度
 * │  书名 | 节点数 | 连线数 | 保存时间  │
 * └─────────────────────────────────────┘
 *
 * 交互逻辑：
 * - 左键点击书本 → 选中（显示详情），不会恢复快照
 * - 右键点击书本 → 弹出上下文菜单（删除此书 / 重命名）
 * - 只有点击右下角的「恢复此快照」按钮才会恢复快照到画布
 */
import { useState, useMemo, useCallback } from 'react';
import { theme } from '@/theme/neihei-theme';
import { useBookshelfStore } from '@/store/bookshelf-store';
import type { BookSnapshot } from '@/store/bookshelf-store';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0,0,0,0.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 2000,
};

const panelStyle: React.CSSProperties = {
  width: 900,
  height: 440,
  background: '#0d0d0d',
  border: '1px solid #1e1e1e',
  borderRadius: 12,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
};

const headerStyle: React.CSSProperties = {
  height: 40,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 16px',
  borderBottom: '1px solid #1e1e1e',
  flexShrink: 0,
};

const titleStyle: React.CSSProperties = {
  color: '#e0e0e0',
  fontSize: 14,
  fontWeight: 600,
  fontFamily: theme.fontFamily.sans,
};

const closeBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: '#808080',
  fontSize: 16,
  cursor: 'pointer',
  padding: '4px 8px',
  borderRadius: 4,
  transition: 'color 150ms ease',
};

/** 右键菜单项样式 */
const contextMenuItemStyle: React.CSSProperties = {
  padding: '8px 16px',
  fontSize: 13,
  color: '#e0e0e0',
  cursor: 'pointer',
  fontFamily: theme.fontFamily.sans,
  whiteSpace: 'nowrap',
  transition: 'background 100ms ease',
};

/** 书本组件 */
function BookItem({
  book,
  isSelected,
  onClick,
  onContextMenu,
}: {
  book: BookSnapshot;
  isSelected: boolean;
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent, book: BookSnapshot) => void;
}) {
  const shortName = book.name.length > 2 ? book.name.slice(0, 2) : book.name;

  return (
    <div
      onClick={onClick}
      onContextMenu={(e) => onContextMenu(e, book)}
      title={`${book.name}\n${book.canvas.nodes.length} 个节点 | ${book.canvas.edges.length} 条连线\n${new Date(book.timestamp).toLocaleString()}`}
      style={{
        width: 70,
        height: 110,
        background: isSelected
          ? 'linear-gradient(180deg, #3a4a5a 0%, #2a3a4a 100%)'
          : 'linear-gradient(180deg, #2a2a2a 0%, #1a1a1a 100%)',
        border: isSelected ? '2px solid #6a9fb5' : '2px solid #2a2a2a',
        borderRadius: 4,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 200ms ease',
        position: 'relative',
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.borderColor = '#4a6a7a';
          e.currentTarget.style.background = 'linear-gradient(180deg, #333 0%, #222 100%)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.borderColor = '#2a2a2a';
          e.currentTarget.style.background = 'linear-gradient(180deg, #2a2a2a 0%, #1a1a1a 100%)';
        }
      }}
    >
      {/* 书脊装饰线 */}
      <div
        style={{
          position: 'absolute',
          top: 4,
          bottom: 4,
          left: 6,
          width: 2,
          background: isSelected ? 'rgba(106, 159, 181, 0.3)' : 'rgba(255,255,255,0.05)',
          borderRadius: 1,
        }}
      />
      {/* 书名 */}
      <span
        style={{
          color: isSelected ? '#c0d8e0' : '#808080',
          fontSize: 16,
          fontWeight: 700,
          writingMode: 'vertical-rl',
          textOrientation: 'mixed',
          letterSpacing: 2,
          fontFamily: theme.fontFamily.sans,
          userSelect: 'none',
        }}
      >
        {shortName}
      </span>
    </div>
  );
}

/** 格式化时间 */
function formatTime(timestamp: number): string {
  const d = new Date(timestamp);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function BookshelfPanel({ isOpen, onClose }: Props) {
  const books = useBookshelfStore((s) => s.books);
  const selectedBookId = useBookshelfStore((s) => s.selectedBookId);
  const selectBook = useBookshelfStore((s) => s.selectBook);
  const loadBook = useBookshelfStore((s) => s.loadBook);
  const deleteBook = useBookshelfStore((s) => s.deleteBook);
  const renameBook = useBookshelfStore((s) => s.renameBook);

  // 右键菜单状态
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    book: BookSnapshot;
  } | null>(null);

  // 重命名对话框状态
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameBookId, setRenameBookId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // 按时间倒序排列
  const sortedBooks = useMemo(() => {
    return [...books].sort((a, b) => b.timestamp - a.timestamp);
  }, [books]);

  // 每排7本
  const rows: BookSnapshot[][] = useMemo(() => {
    const result: BookSnapshot[][] = [];
    for (let i = 0; i < sortedBooks.length; i += 7) {
      result.push(sortedBooks.slice(i, i + 7));
    }
    return result;
  }, [sortedBooks]);

  // 选中书的详情
  const selectedBook = useMemo(() => {
    if (!selectedBookId) return null;
    return books.find((b) => b.id === selectedBookId) || null;
  }, [books, selectedBookId]);

  // 左键点击 → 仅选中，不恢复
  const handleBookClick = useCallback((book: BookSnapshot) => {
    selectBook(book.id);
  }, [selectBook]);

  // 右键点击 → 弹出上下文菜单
  const handleContextMenu = useCallback((e: React.MouseEvent, book: BookSnapshot) => {
    e.preventDefault();
    e.stopPropagation();
    // 先选中该书
    selectBook(book.id);
    setContextMenu({ x: e.clientX, y: e.clientY, book });
  }, [selectBook]);

  // 关闭右键菜单
  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  // 右键菜单：删除
  const handleContextDelete = useCallback(() => {
    if (!contextMenu) return;
    deleteBook(contextMenu.book.id);
    setContextMenu(null);
  }, [contextMenu, deleteBook]);

  // 右键菜单：重命名
  const handleContextRename = useCallback(() => {
    if (!contextMenu) return;
    setRenameBookId(contextMenu.book.id);
    setRenameValue(contextMenu.book.name);
    setRenameDialogOpen(true);
    setContextMenu(null);
  }, [contextMenu]);

  // 确认重命名
  const handleRenameConfirm = useCallback(() => {
    if (renameBookId && renameValue.trim()) {
      renameBook(renameBookId, renameValue.trim());
    }
    setRenameDialogOpen(false);
    setRenameBookId(null);
    setRenameValue('');
  }, [renameBookId, renameValue, renameBook]);

  // 恢复快照（仅右下角按钮触发）
  const handleRestore = useCallback(() => {
    if (!selectedBookId) return;
    loadBook(selectedBookId);
    onClose();
  }, [selectedBookId, loadBook, onClose]);

  if (!isOpen) return null;

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={panelStyle} onClick={(e) => e.stopPropagation()}>
        {/* 标题栏 */}
        <div style={headerStyle}>
          <span style={titleStyle}>📚 书架</span>
          <button
            onClick={onClose}
            style={closeBtnStyle}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#e0e0e0'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#808080'; }}
          >
            ✕
          </button>
        </div>

        {/* 上层 - 书架区域 300px */}
        <div
          style={{
            height: 300,
            padding: '16px 20px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {rows.length === 0 ? (
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#555',
                fontSize: 14,
                fontStyle: 'italic',
                fontFamily: theme.fontFamily.sans,
              }}
            >
              暂无保存的作品，点击「保存此书」创建快照
            </div>
          ) : (
            rows.map((row, rowIndex) => (
              <div
                key={rowIndex}
                style={{
                  display: 'flex',
                  gap: 16,
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                }}
              >
                {row.map((book) => (
                  <BookItem
                    key={book.id}
                    book={book}
                    isSelected={selectedBookId === book.id}
                    onClick={() => handleBookClick(book)}
                    onContextMenu={handleContextMenu}
                  />
                ))}
              </div>
            ))
          )}
        </div>

        {/* 下层 - 选中书本详情 100px */}
        <div
          style={{
            height: 100,
            borderTop: '1px solid #1e1e1e',
            padding: '12px 20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {selectedBook ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ flex: 1 }}>
                <div style={{ color: '#e0e0e0', fontSize: 15, fontWeight: 600, marginBottom: 6, fontFamily: theme.fontFamily.sans }}>
                  📖 {selectedBook.name}
                </div>
                <div style={{ display: 'flex', gap: 20, color: '#808080', fontSize: 12, fontFamily: theme.fontFamily.sans }}>
                  <span>🕐 {formatTime(selectedBook.timestamp)}</span>
                  <span>📦 {selectedBook.canvas.nodes.length} 个节点</span>
                  <span>🔗 {selectedBook.canvas.edges.length} 条连线</span>
                  <span>📊 进度: {
                    (() => {
                      const status = selectedBook.flowState.stepStatus;
                      const doneCount = Object.values(status).filter(s => s === 'done').length;
                      const total = Object.keys(status).length;
                      return `${doneCount}/${total}`;
                    })()
                  }</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={handleRestore}
                  style={{
                    background: 'rgba(106, 159, 181, 0.2)',
                    border: '1px solid #6a9fb5',
                    borderRadius: 6,
                    color: '#e0e0e0',
                    padding: '6px 16px',
                    fontSize: 12,
                    cursor: 'pointer',
                    fontFamily: theme.fontFamily.sans,
                    transition: 'background 150ms ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(106, 159, 181, 0.35)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(106, 159, 181, 0.2)'; }}
                >
                  恢复此快照
                </button>
              </div>
            </div>
          ) : (
            <div style={{ color: '#555', fontSize: 13, fontStyle: 'italic', fontFamily: theme.fontFamily.sans }}>
              点击上方的书本查看详情，右键可删除或重命名
            </div>
          )}
        </div>
      </div>

      {/* 右键上下文菜单 */}
      {contextMenu && (
        <>
          {/* 透明遮罩层 - 点击关闭右键菜单 */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 2099,
            }}
            onClick={(e) => {
              e.stopPropagation();
              closeContextMenu();
            }}
          />
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              left: contextMenu.x,
              top: contextMenu.y,
              background: '#0d0d0d',
              border: '1px solid #1e1e1e',
              borderRadius: 8,
              boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
              zIndex: 2100,
              minWidth: 120,
              overflow: 'hidden',
            }}
          >
            <div
              onClick={handleContextDelete}
              style={contextMenuItemStyle}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#1a1a1a'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              🗑 删除此书
            </div>
            <div
              onClick={handleContextRename}
              style={contextMenuItemStyle}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#1a1a1a'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              ✏️ 重命名
            </div>
          </div>
        </>
      )}

      {/* 重命名对话框 */}
      {renameDialogOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2200,
          }}
          onClick={(e) => {
            e.stopPropagation();
            setRenameDialogOpen(false);
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#0d0d0d',
              border: '1px solid #1e1e1e',
              borderRadius: 12,
              padding: 24,
              width: 340,
            }}
          >
            <div style={{ color: '#e0e0e0', fontSize: 16, fontWeight: 600, marginBottom: 16, fontFamily: theme.fontFamily.sans }}>
              ✏️ 重命名
            </div>
            <input
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              placeholder="输入新书名..."
              style={{
                width: '100%',
                padding: '8px 12px',
                background: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: 6,
                color: '#e0e0e0',
                fontSize: 14,
                outline: 'none',
                fontFamily: theme.fontFamily.sans,
                boxSizing: 'border-box',
                marginBottom: 20,
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#6a9fb5'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#333'; }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && renameValue.trim()) {
                  handleRenameConfirm();
                }
              }}
              autoFocus
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setRenameDialogOpen(false)}
                style={{
                  background: 'transparent',
                  border: '1px solid #1e1e1e',
                  borderRadius: 6,
                  color: '#808080',
                  padding: '6px 16px',
                  fontSize: 12,
                  cursor: 'pointer',
                  fontFamily: theme.fontFamily.sans,
                }}
              >
                取消
              </button>
              <button
                onClick={handleRenameConfirm}
                style={{
                  background: renameValue.trim() ? '#1e1e1e' : '#111',
                  border: renameValue.trim() ? '1px solid #4a4a4a' : '1px solid #222',
                  borderRadius: 6,
                  color: renameValue.trim() ? '#e0e0e0' : '#555',
                  padding: '6px 16px',
                  fontSize: 12,
                  cursor: renameValue.trim() ? 'pointer' : 'not-allowed',
                  fontFamily: theme.fontFamily.sans,
                }}
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
