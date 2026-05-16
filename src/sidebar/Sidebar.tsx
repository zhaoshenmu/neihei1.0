/**
 * 侧边栏组件
 * 展示所有已注册的插件节点，支持拖拽到画布
 */
import React from 'react';
import { pluginRegistry } from '@/plugin-system';
import SidebarItem from './SidebarItem';
import { theme } from '@/theme/neihei-theme';

const Sidebar: React.FC = () => {
  const manifests = pluginRegistry.getAllManifests();

  // 按分类分组
  const grouped = manifests.reduce<Record<string, typeof manifests>>(
    (acc, m) => {
      const cat = m.category || '通用';
      if (!acc[cat]) {acc[cat] = [];}
      acc[cat].push(m);
      return acc;
    },
    {}
  );

  const categories = Object.keys(grouped);

  return (
    <div
      style={{
        width: theme.spacing.sidebarWidth,
        height: '100%',
        background: '#0d0d0d',
        borderRight: '1px solid #1e1e1e',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* 标题 */}
      <div
        style={{
          padding: '20px 20px 12px',
          borderBottom: `1px solid ${theme.colors.inputBorder}`,
        }}
      >
        <h2
          style={{
            color: theme.colors.textPrimary,
            fontSize: theme.fontSize.large,
            fontWeight: 700,
            margin: 0,
            fontFamily: theme.fontFamily.sans,
            letterSpacing: '1px',
          }}
        >
          节点库
        </h2>
        <p
          style={{
            color: theme.colors.textMuted,
            fontSize: theme.fontSize.small,
            margin: '4px 0 0',
            fontFamily: theme.fontFamily.sans,
          }}
        >
          拖拽节点到画布使用 · 共 {manifests.length} 个
        </p>
      </div>

      {/* 插件列表 */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px 16px',
        }}
        className="sidebar-scroll"
      >
        {manifests.length === 0 ? (
          <div
            style={{
              color: theme.colors.textMuted,
              fontSize: theme.fontSize.small,
              textAlign: 'center',
              padding: 40,
              fontFamily: theme.fontFamily.sans,
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.5 }}>
              ⬡
            </div>
            <div>暂无可用节点</div>
            <div style={{ marginTop: 8, opacity: 0.6 }}>
              将节点插件放入 chajian/ 文件夹
            </div>
          </div>
        ) : (
          categories.map((cat) => (
            <div key={cat} style={{ marginBottom: 16 }}>
              <div
                style={{
                  color: theme.colors.textMuted,
                  fontSize: theme.fontSize.small,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  marginBottom: 8,
                  paddingLeft: 4,
                  fontFamily: theme.fontFamily.sans,
                }}
              >
                {cat}
              </div>
              {grouped[cat].map((manifest) => (
                <SidebarItem key={manifest.type} manifest={manifest} />
              ))}
            </div>
          ))
        )}
      </div>

      {/* 底部信息 */}
      <div
        style={{
          padding: '12px 20px',
          borderTop: `1px solid ${theme.colors.inputBorder}`,
          color: theme.colors.textMuted,
          fontSize: 10,
          textAlign: 'center',
          fontFamily: theme.fontFamily.sans,
        }}
      >
        NeiHei v1.0 · 暗金主题
      </div>
    </div>
  );
};

export default Sidebar;
