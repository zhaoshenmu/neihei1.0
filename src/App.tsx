/**
 * NeiHei 应用主组件
 * 纯黑界面 + 暗金主题的节点编辑画布 - ComfyUI 风格
 * 
 * 布局：
 * ┌──────────────────────────────────────────────┐
 * │   [历史记录] [管理器] [▶ 运行]     ← 40px 标题栏│
 * ├──────┬───────────────────────────────────────┤
 * │ #1   │             画布区域                  │
 * │ 60px │  ┌─────────┐ ← Sidebar/Workflow浮在画布上 │
 * │ 节点  │  │ 260px   │                        │
 * │ 工作流│  └─────────┘                        │
 * └──────┴───────────────────────────────────────┘
 *                └── 右下角 LogPanel ──┘
 * 
 * 关键：Sidebar/WorkflowPanel 绝对定位浮在画布上
 *       画布始终固定，不随面板展开收起而左右移动
 */
import React, { useEffect, useState, useRef } from 'react';
import { Canvas } from '@/canvas';
import { Sidebar } from '@/sidebar';
import { loadAllPlugins } from '@/plugin-system';
import { theme } from '@/theme/neihei-theme';
import { setupConsoleCapture } from '@/store/log-store';
import { useSettingsStore } from '@/store/settings-store';
import { useAppStore } from '@/store/useAppStore';
import LogPanel from '@/components/LogPanel';
import TopToolbar from '@/components/TopToolbar';
import VaultPanel from '@/components/VaultPanel';
import type { VaultTab } from '@/components/vault-types';
import WorkflowPanel from '@/components/WorkflowPanel';
import OutlinePanel from '@/chajian/OutlineNode/OutlinePanel';
import { Workbench } from '@/workbench/Workbench';
import './App.css';

const App: React.FC = () => {
  const [pluginLoaded, setPluginLoaded] = useState(false);
  const consoleCaptureRef = useRef<(() => void) | null>(null);
  const [activeTab, setActiveTab] = useState<VaultTab | null>(null);
  const mode = useAppStore((s) => s.mode);

  useEffect(() => {
    useSettingsStore.getState().loadSettings();

    if (!consoleCaptureRef.current) {
      consoleCaptureRef.current = setupConsoleCapture();
    }

    const results = loadAllPlugins();
    const successCount = results.filter(r => r.success).length;
    
    results.forEach(r => {
      if (r.success) {
        console.log(`✅ [${r.type}] 加载成功`);
      } else {
        console.error(`❌ [${r.type || '未知'}] ${r.error}`);
      }
    });

    setPluginLoaded(true);
    console.log(`[NeiHei] 插件加载完成: ${successCount}/${results.length}`);

    return () => {
      if (consoleCaptureRef.current) {
        consoleCaptureRef.current();
        consoleCaptureRef.current = null;
      }
    };
  }, []);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: theme.colors.canvasBg,
        overflow: 'hidden',
      }}
    >
      {/* 顶部标题栏（全宽横条，固定高度，带底部分隔线） */}
      <TopToolbar />

      {mode === 'canvas' ? (
        /* ── 画布模式 ── */
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* 左侧竖条面板（60px，始终固定） */}
          <VaultPanel activeTab={activeTab} onTabChange={setActiveTab} />

          {/* 右侧区域：画布铺满，面板绝对定位浮在画布上 */}
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            {/* 节点侧边栏 — 绝对定位，不占布局，不推动画布 */}
            {activeTab === 'nodes' && (
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  zIndex: 5,
                }}
              >
                <Sidebar />
              </div>
            )}

            {/* 工作流面板 — 同上的绝对定位方式 */}
            {activeTab === 'workflows' && (
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  zIndex: 5,
                }}
              >
                <WorkflowPanel />
              </div>
            )}

            {/* 画布 — 始终铺满，不受面板展开收起影响 */}
            <Canvas pluginLoaded={pluginLoaded} />
          </div>
        </div>
      ) : (
        /* ── 工作台模式 ── */
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <Workbench />
        </div>
      )}

      {/* 悬浮日志面板 */}
      <LogPanel />
      <OutlinePanel />
    </div>
  );
};

export default App;
