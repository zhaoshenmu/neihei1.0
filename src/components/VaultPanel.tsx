/**
 * VaultPanel.tsx
 * 
 * 左侧竖条面板 - 60px 宽，ComfyUI 风格
 * 固定在画布最左侧
 * 
 * 编号 #1 — 方便沟通时引用（"#1 的节点按钮"）
 * 
 * 点击切换展开/收起：
 * - 选中状态再次点击 → 收起（隐藏侧边栏）
 * - 点击不同项 → 切换到对应面板
 */
import { theme } from '@/theme/neihei-theme';
import type { VaultTab } from './vault-types';

interface VaultPanelProps {
  activeTab: VaultTab | null;
  onTabChange: (tab: VaultTab | null) => void;
}

// 按钮配置 — 不包含编号，编号只在面板顶部显示一次
const tabs: { id: VaultTab; label: string }[] = [
  { id: 'nodes', label: '节点' },
  { id: 'workflows', label: '工作流' },
];

export default function VaultPanel({ activeTab, onTabChange }: VaultPanelProps) {
  const handleClick = (tab: VaultTab) => {
    if (activeTab === tab) {
      onTabChange(null);
    } else {
      onTabChange(tab);
    }
  };

  return (
    <div
      style={{
        width: 60,
        height: '100%',
        background: '#0d0d0d',
        borderRight: '1px solid #1e1e1e',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        paddingTop: 0,
        gap: 0,
        flexShrink: 0,
        zIndex: 10,
      }}
    >
      {/* 面板编号 #1 — 方便沟通引用 */}
      <div
        style={{
          textAlign: 'center',
          fontSize: 9,
          color: '#666',
          padding: '4px 0 2px',
          borderBottom: '1px solid #2a2a2a',
          fontFamily: theme.fontFamily.sans,
          letterSpacing: 1,
          userSelect: 'none',
        }}
      >
        #1
      </div>

      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => handleClick(tab.id)}
            style={{
              width: '100%',
              padding: '12px 0',
              background: 'transparent',
              border: 'none',
              borderLeft: isActive ? '3px solid #6a9fb5' : '3px solid transparent',
              color: isActive ? '#e0e0e0' : '#808080',
              cursor: 'pointer',
              fontSize: 12,
              fontFamily: theme.fontFamily.sans,
              transition: 'all 150ms ease',
              textAlign: 'center',
              lineHeight: 1.2,
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.color = '#b0b0b0';
                e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.color = '#808080';
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};
