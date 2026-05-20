/**
 * ShortcutEditor.tsx
 *
 * 快捷键编辑组件
 * 显示所有快捷键列表，点击可修改按键绑定
 * 点击快捷键区域 → 进入编辑模式 → 监听键盘输入 → 保存到 store
 */
import React, { useState, useEffect, useRef } from 'react';
import { useSettingsStore, type ShortcutEntry } from '@/store/settings-store';
import { theme } from '@/theme/neihei-theme';

export default function ShortcutEditor() {
  const shortcuts = useSettingsStore((s) => s.shortcuts);
  const updateShortcut = useSettingsStore((s) => s.updateShortcut);
  const [editingId, setEditingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 进入编辑模式后聚焦输入框
  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingId]);

  const handleKeyDown = (e: React.KeyboardEvent, entry: ShortcutEntry) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.key === 'Escape') {
      setEditingId(null);
      return;
    }
    if (e.key === 'Enter') {
      setEditingId(null);
      return;
    }

    // 收集按键组合
    const keys: string[] = [];
    if (e.ctrlKey || e.metaKey) keys.push('Ctrl');
    if (e.shiftKey) keys.push('Shift');
    if (e.altKey) keys.push('Alt');

    // 排除单独的修饰键
    const mainKey = e.key;
    const isModifier = ['Control', 'Shift', 'Alt', 'Meta'].includes(mainKey);
    if (!isModifier) {
      // 将 key 转换为人可读格式
      let displayKey = mainKey;
      if (mainKey === 'Delete') displayKey = 'Delete';
      else if (mainKey === 'Escape') displayKey = 'Escape';
      else if (mainKey === ' ') displayKey = 'Space';
      else if (mainKey.length === 1) displayKey = mainKey.toUpperCase();

      keys.push(displayKey);
    }

    if (keys.length > 0) {
      updateShortcut(entry.id, keys);
      setEditingId(null);
    }
  };

  /** 将 keys 数组显示为可读字符串 */
  const formatKeys = (keys: string[]) => {
    if (keys.length === 0) return '未设置';
    return keys.join(' + ');
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      {shortcuts.map((entry) => (
        <div
          key={entry.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '7px 14px',
            borderRadius: 6,
            transition: 'background 0.1s',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            if (editingId !== entry.id) {
              e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
            }
          }}
          onMouseLeave={(e) => {
            if (editingId !== entry.id) {
              e.currentTarget.style.background = 'transparent';
            }
          }}
        >
          {/* 操作名 */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              flex: 1,
              minWidth: 0,
            }}
          >
            <span
              style={{
                fontSize: 13,
                color: theme.colors.textPrimary,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {entry.label}
            </span>
            <span
              style={{
                fontSize: 11,
                color: theme.colors.textMuted,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {entry.description}
            </span>
          </div>

          {/* 快捷键（可点击编辑） */}
          <div
            onClick={() => {
              if (editingId === entry.id) {
                setEditingId(null);
              } else {
                setEditingId(entry.id);
              }
            }}
            style={{
              marginLeft: 12,
              padding: '3px 10px',
              borderRadius: 4,
              background: editingId === entry.id
                ? 'rgba(180,140,255,0.3)'
                : 'rgba(255,255,255,0.06)',
              border: editingId === entry.id
                ? '1px solid #b48cff'
                : '1px solid rgba(255,255,255,0.1)',
              fontSize: 12,
              fontWeight: 500,
              fontFamily: 'monospace',
              color: editingId === entry.id ? '#d4bfff' : theme.colors.textSecondary,
              whiteSpace: 'nowrap',
              minWidth: 60,
              textAlign: 'center',
              minHeight: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s',
              position: 'relative',
            }}
          >
            {editingId === entry.id ? (
              <input
                ref={inputRef}
                style={{
                  position: 'absolute',
                  inset: 0,
                  opacity: 0,
                  width: '100%',
                  height: '100%',
                  cursor: 'pointer',
                }}
                onKeyDown={(e) => handleKeyDown(e, entry)}
                onBlur={() => setEditingId(null)}
              />
            ) : null}
            {editingId === entry.id ? '按下按键...' : formatKeys(entry.keys)}
          </div>
        </div>
      ))}
    </div>
  );
};
