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
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Canvas } from '@/canvas';
import { Sidebar } from '@/sidebar';
import { loadAllPlugins } from '@/plugin-system';
import { theme } from '@/theme/neihei-theme';
import { setupConsoleCapture } from '@/store/log-store';
import { useSettingsStore } from '@/store/settings-store';
import LogPanel from '@/components/LogPanel';
import TopToolbar from '@/components/TopToolbar';
import VaultPanel from '@/components/VaultPanel';
import type { VaultTab } from '@/components/vault-types';
import WorkflowPanel from '@/components/WorkflowPanel';
import './App.css';
import { useLogStore } from '@/store/log-store';
import { useUndoStore } from '@/store/undo-store';
import { initDataflowEngine, destroyDataflowEngine } from '@/dataflow/engine';
import { useRunHandler } from '@/hooks/useRunHandler';
import { useWorldEditorFlowStore } from '@/store/world-editor-flow-store';

const App: React.FC = () => {
  const [pluginLoaded, setPluginLoaded] = useState(false);
  const consoleCaptureRef = useRef<(() => void) | null>(null);
  const [activeTab, setActiveTab] = useState<VaultTab | null>(null);

  // 抽离运行逻辑到独立 hook
  const { handleRun } = useRunHandler();

  // 直接从 Zustand store 读取运行状态，避免 setInterval 轮询
  const flowIsRunning = useWorldEditorFlowStore((s) => s.isRunning);
  const uiRunState: 'idle' | 'running' = flowIsRunning ? 'running' : 'idle';

  /** 点击「▶ 运行」按钮时触发 */
  const onRunClick = useCallback(() => {
    handleRun();
  }, [handleRun]);

  // 🔒 P1-1：注册键盘快捷键（Ctrl+Z 撤销 / Ctrl+Shift+Z 重做）
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 忽略输入框/文本域中的快捷键
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          // Ctrl+Shift+Z → 重做
          useUndoStore.getState().redo();
        } else {
          // Ctrl+Z → 撤销
          useUndoStore.getState().undo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    useSettingsStore.getState().loadSettings();

    if (!consoleCaptureRef.current) {
      consoleCaptureRef.current = setupConsoleCapture();
    }

    // 🔒 P0-2：初始化数据流引擎，订阅节点变化自动传播 AI 数据
    initDataflowEngine();

    const results = loadAllPlugins();
    const successCount = results.filter(r => r.success).length;
    const addLog = useLogStore.getState().addLog;
    
    results.forEach(r => {
      if (r.success) {
        console.log(`✅ [${r.type}] 加载成功`);
      } else {
        const errorMsg = `❌ [${r.type || '未知'}] ${r.error}`;
        console.error(errorMsg);
        // 🔒 P0-4：将插件加载失败写入日志面板，使用户可见
        addLog({
          type: 'error',
          message: `插件加载失败: ${r.type || '未知'}`,
          detail: r.error,
        });
      }
    });

    setPluginLoaded(true);
    addLog({
      type: 'info',
      message: `插件加载完成: ${successCount}/${results.length}`,
    });
    console.log(`[NeiHei] 插件加载完成: ${successCount}/${results.length}`);

    return () => {
      if (consoleCaptureRef.current) {
        consoleCaptureRef.current();
        consoleCaptureRef.current = null;
      }
      destroyDataflowEngine();
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
      <TopToolbar 
        onRun={onRunClick} 
        runState={uiRunState}
      />

      {/* ── 画布模式（唯一模式） ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* 左侧竖条面板（60px，始终固定） */}
        <VaultPanel activeTab={activeTab} onTabChange={setActiveTab} />

        {/* 右侧区域：画布铺满，面板绝对定位浮在画布上 */}
        <div data-canvas-container style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
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

      {/* 悬浮日志面板 */}
      <LogPanel />
    </div>
  );
};

export default App;
