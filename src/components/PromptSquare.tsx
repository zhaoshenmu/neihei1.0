/**
 * PromptSquare.tsx
 *
 * 提示词广场 - 可拖动的浮动面板
 * 尺寸：800x900
 * 状态提升：每个按钮独立维护内容和版本历史（持久化）
 * 点击外部逻辑：逐层递减（子面板→主面板）
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { theme } from '@/theme/neihei-theme';
import WorldEditorPrompt, { VersionRecord } from './WorldEditorPrompt';

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

const EDITOR_BUTTONS: EditorButton[] = [
  { id: 'setting', title: '作品设定', subtitle: '创意与视角设定', header: '作品设定', subheader: '填写作品核心创意与叙事视角', defaultContent: '请输入作品的核心理念、创意来源和叙事视角设定...' },
  { id: 'world', title: '世界构建', subtitle: '地理与世界观', header: '世界构建', subheader: '构筑世界的物理与魔法规则', defaultContent: '请输入世界的地理环境、物理规则、魔法体系、文明分布等设定...' },
  { id: 'character', title: '人物核心', subtitle: '角色与关系网', header: '人物核心', subheader: '设计主要角色与人物关系', defaultContent: '请输入主要角色设定：姓名、性格、背景、动机、人物关系...' },
  { id: 'plot', title: '剧情大纲', subtitle: '主线与支线', header: '剧情大纲', subheader: '规划故事主线与分支剧情', defaultContent: '请输入故事的主线剧情、重要转折点、分支选项和结局...' },
  { id: 'consistency', title: '一致性检查', subtitle: '逻辑校验', header: '一致性检查', subheader: '检查世界观、人设、剧情的一致性', defaultContent: '请输入需要检查一致性的事项，列出可能的矛盾点...' },
];

const PromptSquare: React.FC<PromptSquareProps> = ({ isOpen, onClose }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const initialized = useRef(false);
  const [activeTab, setActiveTab] = useState<TabId>('world_editor');

  // 子面板状态
  const [promptOpen, setPromptOpen] = useState(false);
  const [currentBtn, setCurrentBtn] = useState<EditorButton>(EDITOR_BUTTONS[0]);

// 状态提升：每个按钮独立维护内容 + 版本历史 + 编号
  const STORAGE_KEY = 'neihei-prompt-square-states';
  const [buttonStates, setButtonStates] = useState<Record<string, EditorButtonState>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
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

  // 获取当前按钮状态（如果不存在则初始化）
  const getCurrentState = useCallback((): EditorButtonState => {
    return buttonStates[currentBtn.id] || {
      content: currentBtn.defaultContent,
      versions: [],
      nextId: 1,
    };
  }, [buttonStates, currentBtn]);

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

  // 点击主面板外部关闭（无论子面板是否打开，子面板的 DOM 在 panelRef 内部，不触发此事件）
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
      setPosition({
        x: Math.max(0, Math.min(e.clientX - dragOffset.x, window.innerWidth - PANEL_WIDTH)),
        y: Math.max(0, Math.min(e.clientY - dragOffset.y, window.innerHeight - PANEL_HEIGHT)),
      });
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

  /** 内容变更 */
  const handleContentChange = (val: string) => {
    setButtonStates((prev) => ({
      ...prev,
      [currentBtn.id]: {
        ...(prev[currentBtn.id] || {
          content: currentBtn.defaultContent,
          versions: [],
          nextId: 1,
        }),
        content: val,
      },
    }));
  };

  /** 保存版本 */
  const handleSaveVersion = (newVersion: VersionRecord) => {
    setButtonStates((prev) => {
      const prevState = prev[currentBtn.id] || {
        content: currentBtn.defaultContent,
        versions: [],
        nextId: 1,
      };
      // 旧版本全部 isActive=false
      const updatedVersions = prevState.versions.map((v) => ({ ...v, isActive: false }));
      const result = [newVersion, ...updatedVersions].slice(0, MAX_VERSIONS);
      return {
        ...prev,
        [currentBtn.id]: {
          content: prevState.content,
          versions: result,
          nextId: prevState.nextId + 1,
        },
      };
    });
  };

  /** 删除版本 */
  const handleDeleteVersion = (versionId: number) => {
    setButtonStates((prev) => {
      const prevState = prev[currentBtn.id];
      if (!prevState) return prev;
      const filtered = prevState.versions.filter((v) => v.id !== versionId);
      return {
        ...prev,
        [currentBtn.id]: {
          ...prevState,
          versions: filtered,
        },
      };
    });
  };

  /** 切换版本（函数式更新，无闭包陷阱） */
  const handleSwitchVersion = (versionId: number) => {
    setButtonStates((prev) => {
      const prevState = prev[currentBtn.id];
      if (!prevState) return prev;
      const updatedVersions = prevState.versions.map((v) => ({
        ...v,
        isActive: v.id === versionId,
      }));
      const target = updatedVersions.find((v) => v.id === versionId);
      return {
        ...prev,
        [currentBtn.id]: {
          ...prevState,
          versions: updatedVersions,
          content: target ? target.content : prevState.content,
        },
      };
    });
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
      {/* 标题栏 - 可拖拽区域 */}
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
            background: 'transparent',
            border: 'none',
            color: theme.colors.textMuted,
            fontSize: 16,
            cursor: 'pointer',
            padding: '0 4px',
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
          display: 'flex',
          gap: 0,
          borderBottom: `1px solid ${theme.colors.inputBorder}`,
          padding: '0 12px',
          flexShrink: 0,
        }}
      >
        {DEFAULT_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: isActive ? '2px solid #b48cff' : '2px solid transparent',
                color: isActive ? '#d4bfff' : theme.colors.textMuted,
                padding: '8px 14px',
                fontSize: 12,
                fontWeight: isActive ? 600 : 400,
                cursor: 'pointer',
                transition: 'color 150ms, border-color 150ms',
                fontFamily: theme.fontFamily.sans,
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.color = theme.colors.textSecondary;
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.color = theme.colors.textMuted;
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 内容区域 */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '20px 16px',
          color: theme.colors.textMuted,
          fontSize: 13,
        }}
      >
        {activeTab === 'world_editor' && (
          <div
            style={{
              display: 'flex',
              gap: 12,
              justifyContent: 'center',
              flexWrap: 'nowrap',
              height: '100%',
              alignItems: 'flex-start',
            }}
          >
            {EDITOR_BUTTONS.map((btn) => (
              <button
                key={btn.id}
                onClick={() => {
                  setCurrentBtn(btn);
                  setPromptOpen(true);
                }}
                style={{
                  flex: 1,
                  maxWidth: 160,
                  aspectRatio: '1 / 1',
                  background: 'rgba(255,255,255,0.03)',
                  border: 'none',
                  borderRadius: 10,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '8px 6px',
                  transition: 'background 150ms ease',
                  position: 'relative',
                  overflow: 'hidden',
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                }}
              >
                {/* 左侧蓝色竖边 */}
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: '10%',
                    width: 4,
                    height: '80%',
                    background: '#6a9fb5',
                    borderRadius: '0 2px 2px 0',
                  }}
                />
                <span
                  style={{
                    color: '#ffffff',
                    fontSize: 16,
                    fontWeight: 600,
                    lineHeight: 1.3,
                    textAlign: 'center',
                    wordBreak: 'keep-all',
                  }}
                >
                  {btn.title}
                </span>
                <span
                  style={{
                    color: '#808080',
                    fontSize: 12,
                    lineHeight: 1.3,
                    textAlign: 'center',
                    wordBreak: 'keep-all',
                  }}
                >
                  {btn.subtitle}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 弹出提示词面板（受控模式） */}
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
      />
    </div>
  );
};

export default PromptSquare;
