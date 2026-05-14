/**
 * NeiHei 应用主组件
 * 纯黑界面 + 暗金主题的节点编辑画布
 * 布局：左侧侧边栏 | 右侧画布（上） + 日志面板（下300px）
 */
import React, { useEffect, useState, useRef } from 'react';
import { Canvas } from '@/canvas';
import { Sidebar } from '@/sidebar';
import { loadAllPlugins } from '@/plugin-system';
import { theme } from '@/theme/neihei-theme';
import { setupConsoleCapture, useLogStore } from '@/store/log-store';
import LogPanel from '@/components/LogPanel';
import './App.css';

const App: React.FC = () => {
  const [pluginLoaded, setPluginLoaded] = useState(false);
  const consoleCaptureRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // 拦截 console 到日志系统（仅执行一次）
    if (!consoleCaptureRef.current) {
      consoleCaptureRef.current = setupConsoleCapture();
    }

    // 应用启动时自动加载所有插件
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
      // 清理 console 拦截
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
      {/* 主区域：侧边栏 + 画布 */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* 侧边栏 */}
        <Sidebar />

        {/* 画布区域 */}
        <div style={{ flex: 1, position: 'relative' }}>
          <Canvas pluginLoaded={pluginLoaded} />
        </div>
      </div>

      {/* 底部日志面板 - 高度 300px */}
      <LogPanel />
    </div>
  );
};

export default App;
