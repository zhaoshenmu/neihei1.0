/**
 * PromptSquare.tsx
 *
 * 提示词广场 - 可拖动的浮动面板
 * 尺寸：800x900
 * 状态提升：每个按钮独立维护内容和版本历史（持久化）
 * 点击外部逻辑：逐层递减（子面板→主面板）
 *
 * 功能一：新增「作品约束」按钮（第1个），点击显示纯约束文本框 → 存入 setting.constraint
 * 功能二：4个原有按钮，每个弹出面板中有各自的约束输入框
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { theme } from '@/theme/neihei-theme';
import WorldEditorPrompt, { VersionRecord } from './WorldEditorPrompt';
import { clampPositionWithinCanvas } from '@/utils/canvas-bounds';
import { usePromptStore, type PromptPanelId } from '@/store/prompt-store';

interface PromptSquareProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabId = string;

interface TabItem {
  id: TabId;
  label: string;
}

const PANEL_WIDTH = 800;
const PANEL_HEIGHT = 900;
const MAX_VERSIONS = 10;

const DEFAULT_TABS: TabItem[] = [
  { id: 'world_editor', label: '世界编辑器' },
];

/** 每个按钮的独立状态 */
interface EditorButtonState {
  content: string;
  versions: VersionRecord[];
  nextId: number;
}

/** 世界编辑器按钮配置 */
interface EditorButton {
  id: string;
  title: string;
  subtitle: string;
  header: string;
  subheader: string;
  defaultContent: string;
}

/** 按钮列表：作品约束（第1个）+ 4个原有按钮 */
const EDITOR_BUTTONS: EditorButton[] = [
  { id: 'worldConstraint', title: '作品约束', subtitle: '限制作品设定', header: '作品约束', subheader: '限制作品设定的约束条件', defaultContent: '' },
  { id: 'world', title: '世界构建', subtitle: '地理与世界观', header: '世界构建', subheader: '构筑世界的物理与魔法规则', defaultContent: '' },
  { id: 'character', title: '人物核心', subtitle: '角色与关系网', header: '人物核心', subheader: '设计主要角色与人物关系', defaultContent: '' },
  { id: 'plot', title: '剧情大纲', subtitle: '主线与支线', header: '剧情大纲', subheader: '规划故事主线与分支剧情', defaultContent: '' },
  { id: 'consistency', title: '一致性检查', subtitle: '逻辑校验', header: '一致性检查', subheader: '整理所有数据并输出到画布', defaultContent: '' },
];

/** 按钮ID 到 prompt-store 面板ID的映射 */
const BTN_TO_PANEL: Record<string, PromptPanelId> = {
  worldConstraint: 'setting',
  world: 'world',
  character: 'character',
  plot: 'plot',
  consistency: 'consistency',
};

/** 按钮 → 约束作用的提示说明 */
const BTN_CONSTRAINT_LABEL: Record<string, string> = {
  world: '人物核心',
  character: '剧情大纲',
  plot: '一致性检查',
  consistency: '输出内容',
};

const PromptSquare: React.FC<PromptSquareProps> = ({ isOpen, onClose }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const initialized = useRef(false);
  const [activeTab, setActiveTab] = useState<TabId>('world_editor');

  // 子面板状态
  const [promptOpen, setPromptOpen] = useState(false);
  const [currentBtn, setCurrentBtn] = useState<EditorButton>(EDITOR_BUTTONS[1]); // 默认选中"世界构建"

  // ========== 作品约束（功能一）独立状态 ==========
  const [showWorldConstraint, setShowWorldConstraint] = useState(false);
  const [worldConstraintText, setWorldConstraintText] = useState('');

  // 从 usePromptStore 读取/写入
  const getPromptFromStore = usePromptStore((s) => s.getPrompt);
  const setPromptInStore = usePromptStore((s) => s.setPrompt);
  const setConstraintInStore = usePromptStore((s) => s.setConstraint);

  // 初始化/同步 作品约束文本
  useEffect(() => {
    if (isOpen) {
      setWorldConstraintText(usePromptStore.getState().getPrompt('setting').constraint);
    }
  }, [isOpen]);

  // 状态提升：每个按钮独立维护内容 + 版本历史 + 编号
  const STORAGE_KEY = 'neihei-prompt-square-states';
  const [buttonStates, setButtonStates] = useState<Record<string, EditorButtonState>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // 版本升级检测：如果 character 按钮（→剧情大纲面板）的缓存不包含章节规划关键词，
        // 则判定为旧版本缓存，直接删除整个 localStorage，让新默认提示词完全生效
        if (parsed.character && parsed.character.content && !/第.*章/.test(parsed.character.content)) {
          localStorage.removeItem(STORAGE_KEY);
          return {};
        }
        // 恢复 Date 对象（JSON.parse 会把 Date 变为字符串）
        for (const key of Object.keys(parsed)) {
          if (parsed[key].versions) {
            parsed[key].versions = parsed[key].versions.map((v: any) => ({
              ...v,
              date: new Date(v.date),
            }));
          }
        }
        return parsed;
      }
    } catch {}
    return {};
  });

  // 持久化到 localStorage（每次状态变更自动保存）
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(buttonStates));
    } catch {}
  }, [buttonStates]);

  // 获取当前按钮状态（如果不存在或内容为空，则从 usePromptStore 加载默认提示词）
  const getCurrentState = useCallback((): EditorButtonState => {
    const existing = buttonStates[currentBtn.id];
    const panelId = BTN_TO_PANEL[currentBtn.id];
    const promptEntry = getPromptFromStore(panelId);
    const defaultContent = promptEntry.content || currentBtn.defaultContent;

    if (existing && existing.content && existing.content.trim()) {
      // 对 character 按钮：检测缓存是否包含章节规划关键词
      if (currentBtn.id === 'character') {
        const hasChapterPlan = /第.*章/.test(existing.content);
        if (!hasChapterPlan) {
          return {
            content: defaultContent,
            versions: existing.versions || [],
            nextId: existing.nextId || 1,
          };
        }
      }
      return existing;
    }

    return {
      content: defaultContent,
      versions: existing?.versions || [],
      nextId: existing?.nextId || 1,
    };
  }, [buttonStates, currentBtn, getPromptFromStore]);

  // 初始化位置（居中）
  useEffect(() => {
    if (isOpen && !initialized.current) {
      setPosition({
        x: Math.max(0, (window.innerWidth - PANEL_WIDTH) / 2),
        y: Math.max(0, (window.innerHeight - PANEL_HEIGHT) / 2 - 20),
      });
      initialized.current = true;
    }
    if (!isOpen) {
      initialized.current = false;
    }
  }, [isOpen]);

  // 开始拖拽
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.prompt-square-header')) {
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  // 主面板 ref - 用于点击外部关闭
  const panelRef = useRef<HTMLDivElement>(null);

  // 点击主面板外部关闭
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // 拖拽移动
  useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      const clamped = clampPositionWithinCanvas(
        e.clientX - dragOffset.x,
        e.clientY - dragOffset.y,
        PANEL_WIDTH,
        PANEL_HEIGHT,
      );
      setPosition({ x: clamped.x, y: clamped.y });
    };
    const handleMouseUp = () => setIsDragging(false);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  // 当前按钮状态
  const currentState = getCurrentState();
  // 当前按钮的约束值
  const currentPanelId = BTN_TO_PANEL[currentBtn.id];
  const currentConstraint = usePromptStore((s) => s.getPrompt(currentPanelId).constraint);

  /** 内容变更 - 同步到 usePromptStore */
  const handleContentChange = (val: string) => {
    setButtonStates((prev) => ({
      ...prev,
      [currentBtn.id]: {
        ...(prev[currentBtn.id] || { content: '', versions: [], nextId: 1 }),
        content: val,
      },
    }));
    setPromptInStore(currentPanelId, val);
  };

  /** 约束变更 */
  const handleConstraintChange = (constraint: string) => {
    setConstraintInStore(currentPanelId, constraint);
  };

  /** 保存版本 */
  const handleSaveVersion = (newVersion: VersionRecord) => {
    setPromptInStore(currentPanelId, newVersion.content);
    setButtonStates((prev) => {
      const prevState = prev[currentBtn.id] || { content: currentBtn.defaultContent, versions: [], nextId: 1 };
      const updatedVersions = prevState.versions.map((v) => ({ ...v, isActive: false }));
      const result = [newVersion, ...updatedVersions].slice(0, MAX_VERSIONS);
      return {
        ...prev,
        [currentBtn.id]: { content: prevState.content, versions: result, nextId: prevState.nextId + 1 },
      };
    });
  };

  /** 删除版本 */
  const handleDeleteVersion = (versionId: number) => {
    setButtonStates((prev) => {
      const prevState = prev[currentBtn.id];
      if (!prevState) return prev;
      return { ...prev, [currentBtn.id]: { ...prevState, versions: prevState.versions.filter((v) => v.id !== versionId) } };
    });
  };

  /** 切换版本 */
  const handleSwitchVersion = (versionId: number) => {
    setButtonStates((prev) => {
      const prevState = prev[currentBtn.id];
      if (!prevState) return prev;
      const updatedVersions = prevState.versions.map((v) => ({ ...v, isActive: v.id === versionId }));
      const target = updatedVersions.find((v) => v.id === versionId);
      return { ...prev, [currentBtn.id]: { ...prevState, versions: updatedVersions, content: target ? target.content : prevState.content } };
    });
  };

  /** 处理按钮点击 - 作品约束特殊处理 */
  const handleButtonClick = (btn: EditorButton) => {
    if (btn.id === 'worldConstraint') {
      // 功能一：作品约束 → 显示纯文本框
      setWorldConstraintText(usePromptStore.getState().getPrompt('setting').constraint);
      setShowWorldConstraint(true);
      setPromptOpen(false);
    } else {
      // 功能二：4个原有按钮 → 打开 WorldEditorPrompt
      setCurrentBtn(btn);
      setShowWorldConstraint(false);
      setPromptOpen(true);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      onMouseDown={handleMouseDown}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        width: PANEL_WIDTH,
        height: PANEL_HEIGHT,
        background: '#0d0d0d',
        border: `1px solid ${theme.colors.inputBorder}`,
        borderRadius: 12,
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        zIndex: 1200,
        fontFamily: theme.fontFamily.sans,
        fontSize: 13,
        cursor: isDragging ? 'grabbing' : 'default',
        userSelect: isDragging ? 'none' : 'auto',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* 标题栏 */}
      <div
        className="prompt-square-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          borderBottom: `1px solid ${theme.colors.inputBorder}`,
          cursor: 'grab',
          flexShrink: 0,
        }}
      >
        <span style={{ color: theme.colors.textPrimary, fontWeight: 600, fontSize: 14 }}>
          提示词广场
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          style={{
            background: 'transparent', border: 'none', color: theme.colors.textMuted,
            fontSize: 16, cursor: 'pointer', padding: '0 4px',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#e06060'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = theme.colors.textMuted; }}
        >
          ✕
        </button>
      </div>

      {/* 紧凑标签栏 */}
      <div
        style={{
          display: 'flex', gap: 0, borderBottom: `1px solid ${theme.colors.inputBorder}`,
          padding: '0 12px', flexShrink: 0,
        }}
      >
        {DEFAULT_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: 'transparent', border: 'none',
                borderBottom: isActive ? '2px solid #b48cff' : '2px solid transparent',
                color: isActive ? '#d4bfff' : theme.colors.textMuted,
                padding: '8px 14px', fontSize: 12, fontWeight: isActive ? 600 : 400,
                cursor: 'pointer', transition: 'color 150ms, border-color 150ms',
                fontFamily: theme.fontFamily.sans, whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.color = theme.colors.textSecondary; }}
              onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.color = theme.colors.textMuted; }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 内容区域 */}
      <div
        style={{
          flex: 1, overflow: 'auto', padding: '20px 16px',
          color: theme.colors.textMuted, fontSize: 13,
        }}
      >
        {activeTab === 'world_editor' && !showWorldConstraint && (
          <div
            style={{
              display: 'flex', gap: 8, justifyContent: 'flex-start',
              flexWrap: 'nowrap', height: '100%', alignItems: 'flex-start',
            }}
          >
            {EDITOR_BUTTONS.map((btn) => (
              <button
                key={btn.id}
                onClick={() => handleButtonClick(btn)}
                style={{
                  width: 'calc(20% - 7px)', maxWidth: 'none', aspectRatio: '1 / 1',
                  background: 'rgba(255,255,255,0.03)', border: 'none', borderRadius: 10,
                  cursor: 'pointer', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '8px 6px', transition: 'background 150ms ease',
                  position: 'relative', overflow: 'hidden', flexShrink: 0,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
              >
                {/* 左侧竖边：作品约束用金色，其他用蓝色 */}
                <div
                  style={{
                    position: 'absolute', left: 0, top: '10%', width: 4, height: '80%',
                    background: btn.id === 'worldConstraint' ? '#c9a84c' : '#6a9fb5',
                    borderRadius: '0 2px 2px 0',
                  }}
                />
                <span
                  style={{
                    color: '#ffffff', fontSize: 16, fontWeight: 600,
                    lineHeight: 1.3, textAlign: 'center', wordBreak: 'keep-all',
                  }}
                >
                  {btn.title}
                </span>
                <span
                  style={{
                    color: '#808080', fontSize: 12, lineHeight: 1.3,
                    textAlign: 'center', wordBreak: 'keep-all',
                  }}
                >
                  {btn.subtitle}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* 功能一：作品约束文本框 */}
        {activeTab === 'world_editor' && showWorldConstraint && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 12 }}>
            {/* 顶部提示 + 返回按钮 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <span style={{ color: '#c9a84c', fontSize: 13, fontWeight: 600 }}>
                ▸ 作品约束（将自动附加到作品设定面板的AI调用中）
              </span>
              <button
                onClick={() => {
                  // 保存约束到 setting
                  setConstraintInStore('setting', worldConstraintText);
                  setShowWorldConstraint(false);
                }}
                style={{
                  background: 'transparent', border: '1px solid #333',
                  borderRadius: 6, color: '#808080', fontSize: 12,
                  padding: '4px 12px', cursor: 'pointer',
                  fontFamily: theme.fontFamily.sans,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#e0e0e0'; e.currentTarget.style.borderColor = '#555'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#808080'; e.currentTarget.style.borderColor = '#333'; }}
              >
                ← 返回
              </button>
            </div>
            <textarea
              value={worldConstraintText}
              onChange={(e) => setWorldConstraintText(e.target.value)}
              placeholder="输入作品约束条件，例如：作品为现代都市题材，不能出现超自然力量、魔法、科幻等元素。主角必须是普通人背景。"
              style={{
                flex: 1, width: '100%',
                borderRadius: 10, background: 'rgba(201, 168, 76, 0.04)',
                border: '1px solid rgba(201, 168, 76, 0.2)',
                padding: 14, color: '#d4c080', resize: 'none',
                outline: 'none', fontSize: 13,
                fontFamily: "'Inter', 'Segoe UI', sans-serif",
                lineHeight: 1.6, boxSizing: 'border-box',
              }}
            />
            {/* 底部保存按钮 */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
              <button
                onClick={() => {
                  setConstraintInStore('setting', worldConstraintText);
                  setShowWorldConstraint(false);
                }}
                style={{
                  background: 'rgba(201, 168, 76, 0.15)',
                  border: '1px solid rgba(201, 168, 76, 0.3)',
                  borderRadius: 8, color: '#c9a84c', fontSize: 13,
                  padding: '8px 24px', cursor: 'pointer',
                  fontWeight: 500, fontFamily: theme.fontFamily.sans,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(201, 168, 76, 0.25)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(201, 168, 76, 0.15)'; }}
              >
                保存约束
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 功能二：4个原有按钮的 WorldEditorPrompt，传入约束 */}
      <WorldEditorPrompt
        isOpen={promptOpen}
        onClose={() => setPromptOpen(false)}
        header={currentBtn.header}
        subheader={currentBtn.subheader}
        content={currentState.content}
        versions={currentState.versions}
        nextId={currentState.nextId}
        onContentChange={handleContentChange}
        onSaveVersion={handleSaveVersion}
        onSwitchVersion={handleSwitchVersion}
        onDeleteVersion={handleDeleteVersion}
        targetPanelLabel={
          currentBtn.id === 'world' ? '人物核心面板' :
          currentBtn.id === 'character' ? '剧情大纲面板' :
          currentBtn.id === 'plot' ? '一致性检查面板' :
          '画布节点'
        }
        constraintValue={currentConstraint}
        onConstraintChange={handleConstraintChange}
        constraintLabel={BTN_CONSTRAINT_LABEL[currentBtn.id] || ''}
      />
    </div>
  );
};

export default PromptSquare;
