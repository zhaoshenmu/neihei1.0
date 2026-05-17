/**
 * SettingsSidebar.tsx
 * 
 * 设置面板左侧 - 卷帘（Accordion）形式
 * 每个卷帘项点击展开/收起，内部包含对应的API设置表单
 * 每个卷帘标题左侧有状态圆点（绿色=已连接，灰色=未连接）
 * 标题栏右侧有「已联通API」下拉菜单
 * 
 * 下拉菜单逻辑：
 * - 只显示 status === 'connected' 的 API
 * - 如果当前 selectedApi 掉线，自动切换到第一个联通的
 * - 一个都没联通 → 菜单显示「暂无已联通API」
 */
import React, { useState, useRef, useEffect } from 'react';
import { theme } from '@/theme/neihei-theme';
import { useApiConnectionStore, type ApiId } from '@/store/api-connection-store';
import ApiGeneralPanel from './ApiGeneralPanel';
import ApiLocalPanel from './ApiLocalPanel';
import ApiImagePanel from './ApiImagePanel';

export interface SidebarItem {
  id: string;
  label: string;
  icon?: string;
}

interface AccordionSectionProps {
  item: SidebarItem;
  isOpen: boolean;
  onToggle: () => void;
}

/** 单个卷帘项 */
const AccordionSection: React.FC<AccordionSectionProps> = ({ item, isOpen, onToggle }) => {
  const status = useApiConnectionStore((s) => s.statuses[item.id]);

  return (
    <div style={{ borderBottom: `1px solid ${theme.colors.inputBorder}` }}>
      {/* 卷帘标题 - 窄条，点击切换展开/收起 */}
      <div
        onClick={onToggle}
        style={{
          padding: '8px 14px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          userSelect: 'none',
          background: isOpen ? 'rgba(74, 158, 255, 0.06)' : 'transparent',
          transition: 'background 150ms ease',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = isOpen ? 'rgba(74, 158, 255, 0.08)' : 'rgba(255,255,255,0.03)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = isOpen ? 'rgba(74, 158, 255, 0.06)' : 'transparent'; }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* 状态圆点 */}
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: status === 'connected' ? '#4caf50' : status === 'testing' ? '#ff9800' : '#555',
              flexShrink: 0,
              transition: 'background 300ms ease',
            }}
          />
          {item.icon && <span style={{ fontSize: 14, flexShrink: 0 }}>{item.icon}</span>}
          <span style={{ color: theme.colors.textPrimary, fontSize: 12, fontWeight: 500 }}>
            {item.label}
          </span>
        </div>
        <span style={{
          color: theme.colors.textMuted,
          fontSize: 10,
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 200ms ease',
        }}>
          ▼
        </span>
      </div>

      {/* 卷帘内容 - 展开时显示对应的设置表单 */}
      <div
        style={{
          overflow: 'hidden',
          maxHeight: isOpen ? 600 : 0,
          transition: 'max-height 250ms ease',
        }}
      >
        <div style={{ padding: '0 4px 8px 4px' }}>
          {item.id === 'general-api' && <ApiGeneralPanel />}
          {item.id === 'local-api' && <ApiLocalPanel />}
          {item.id === 'image-api' && <ApiImagePanel />}
        </div>
      </div>
    </div>
  );
};

interface SettingsSidebarProps {
  items: SidebarItem[];
}

/** API下拉菜单选项配置 */
const API_OPTIONS: { id: ApiId; label: string }[] = [
  { id: 'general-api', label: '通用大模型 (DeepSeek)' },
  { id: 'local-api', label: '本地部署 (LM Studio)' },
  { id: 'image-api', label: '图片生成' },
];

const SettingsSidebar: React.FC<SettingsSidebarProps> = ({ items }) => {
  const [openId, setOpenId] = useState<string | null>('general-api');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedApi = useApiConnectionStore((s) => s.selectedApi);
  const statuses = useApiConnectionStore((s) => s.statuses);
  const setSelectedApi = useApiConnectionStore((s) => s.setSelectedApi);

  // 如果当前选中的 API 已掉线，自动切换到第一个联通的
  useEffect(() => {
    const connectedIds = API_OPTIONS.filter(o => statuses[o.id] === 'connected').map(o => o.id);
    if (statuses[selectedApi] !== 'connected' && connectedIds.length > 0) {
      setSelectedApi(connectedIds[0] as ApiId);
    }
  }, [statuses, selectedApi, setSelectedApi]);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropdownOpen]);

  // 下拉只展示已联通的 API
  const connectedOptions = API_OPTIONS.filter(o => statuses[o.id] === 'connected');

  const handleToggle = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* 顶部标题栏 - 左侧"API设置" + 右侧"已联通API"下拉 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          borderBottom: `1px solid ${theme.colors.inputBorder}`,
        }}
      >
        <span style={{ color: theme.colors.textPrimary, fontWeight: 600, fontSize: 13 }}>
          API设置
        </span>

        {/* 已联通API下拉菜单 */}
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button
            onClick={(e) => { e.stopPropagation(); setDropdownOpen(!dropdownOpen); }}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: `1px solid ${theme.colors.inputBorder}`,
              borderRadius: 4,
              color: theme.colors.textPrimary,
              fontSize: 11,
              padding: '3px 8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              whiteSpace: 'nowrap',
            }}
          >
            <span style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: statuses[selectedApi] === 'connected' ? '#4caf50' : '#555',
              flexShrink: 0,
            }} />
            <span>{connectedOptions.length > 0 ? '已联通API' : '未联通'}</span>
            <span style={{ fontSize: 8, opacity: 0.6 }}>▼</span>
          </button>

          {dropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: 4,
                background: '#1a1a1a',
                border: `1px solid ${theme.colors.inputBorder}`,
                borderRadius: 6,
                padding: '4px 0',
                minWidth: 200,
                zIndex: 1200,
                boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
              }}
            >
              {connectedOptions.length === 0 ? (
                <div style={{ padding: '6px 12px', color: theme.colors.textMuted, fontSize: 12, textAlign: 'center' }}>
                  暂无已联通API
                </div>
              ) : (
                connectedOptions.map((opt) => {
                  const isSelected = selectedApi === opt.id;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => {
                        setSelectedApi(opt.id);
                        setDropdownOpen(false);
                      }}
                      style={{
                        padding: '6px 12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontSize: 12,
                        color: isSelected ? '#4a9eff' : theme.colors.textPrimary,
                        background: isSelected ? 'rgba(74,158,255,0.08)' : 'transparent',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = isSelected ? 'rgba(74,158,255,0.08)' : 'transparent'; }}
                    >
                      <span style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: '#4caf50',
                        flexShrink: 0,
                      }} />
                      <span style={{ flex: 1 }}>{opt.label}</span>
                      {isSelected && <span style={{ color: '#4a9eff', fontSize: 11 }}>✓</span>}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* 卷帘列表 */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {items.map((item) => (
          <AccordionSection
            key={item.id}
            item={item}
            isOpen={openId === item.id}
            onToggle={() => handleToggle(item.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default SettingsSidebar;
