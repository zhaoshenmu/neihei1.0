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
import React, { useEffect, useRef, useState } from 'react';
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
import { useCanvasStore } from '@/store/canvas-store';
import { callAi } from '@/services/ai-service';
import { useLogStore } from '@/store/log-store';
import { useApiConnectionStore } from '@/store/api-connection-store';
import { useExecutionStore } from '@/store/execution-store';
import { useWorldEditorFlowStore } from '@/store/useWorldEditorFlowStore';

const App: React.FC = () => {
  const [pluginLoaded, setPluginLoaded] = useState(false);
  const consoleCaptureRef = useRef<(() => void) | null>(null);
  const [activeTab, setActiveTab] = useState<VaultTab | null>(null);
  const [runState, setRunState] = useState<'idle' | 'running'>('idle');

  /** 点击「▶ 运行」按钮时触发 */
  const handleRun = async () => {
    const { nodes } = useCanvasStore.getState();
    const addLog = useLogStore.getState().addLog;

    // 检测画布上是否有 OutlineNode（世界编辑器）
    const outlineNode = nodes.find((n) => n.type === 'outline' || n.type?.includes('Outline'));
    
    if (outlineNode) {
      // 触发世界编辑器流程
      addLog({ type: 'info', message: '[运行] 检测到世界编辑器节点，启动流程...' });
      useWorldEditorFlowStore.getState().triggerExternalRun();
      return;
    }

    // 原有逻辑：遍历所有边，提取源节点text → 调AI → 写入目标节点aiOutput
    const { edges } = useCanvasStore.getState();
    const execStore = useExecutionStore.getState();

    if (edges.length === 0) {
      addLog({ type: 'info', message: '[运行] 没有连线，跳过' });
      setRunState('idle');
      return;
    }

    addLog({ type: 'info', message: `[运行] 开始处理 ${edges.length} 条连线...` });

    for (const edge of edges) {
      const sourceNode = nodes.find((n) => n.id === edge.source);
      const targetNode = nodes.find((n) => n.id === edge.target);

      if (!sourceNode || !targetNode) continue;

      const text = sourceNode.data?.text as string;
      if (!text || text.trim().length === 0) {
        addLog({ type: 'warning', message: `[运行] ${sourceNode.id} 没有输入内容，跳过` });
        continue;
      }

      addLog({ type: 'info', message: `[运行] ${sourceNode.id} → ${targetNode.id} : "${text.substring(0, 30)}..."` });

      // 运行前清空上次的错误/输出，避免旧信息残留
      useCanvasStore.getState().updateNodeData(targetNode.id, {
        aiOutput: '',
        _aiLoading: true,
      });

      // 标记源节点为运行中（边框变蓝）
      execStore.setRunning(sourceNode.id);
      // 也标记目标节点为运行中
      execStore.setRunning(targetNode.id);

      try {
        const result = await callAi([{ role: 'user', content: text }]);

        if (result.success) {
          useCanvasStore.getState().updateNodeData(targetNode.id, {
            aiOutput: result.content,
            _aiLoading: false,
          });
          // 标记源节点和目标节点为成功（边框变绿）
          execStore.setSuccess(sourceNode.id, { text });
          execStore.setSuccess(targetNode.id, result.content);
          addLog({ type: 'success', message: `[运行] AI回复已写入 ${targetNode.id}` });
        } else {
          useCanvasStore.getState().updateNodeData(targetNode.id, {
            aiOutput: `❌ ${result.error}`,
            _aiLoading: false,
          });
          // 目标节点标记为错误（边框变红）
          execStore.setError(targetNode.id, result.error || '未知错误');
          execStore.setSuccess(sourceNode.id, { text });
          // 运行失败 → 该 API 绿灯灭
          if (result.apiId) {
            useApiConnectionStore.getState().setStatus(result.apiId, 'disconnected');
          }
          addLog({ type: 'error', message: `[运行] AI调用失败: ${result.error || '未知错误'}` });
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        useCanvasStore.getState().updateNodeData(targetNode.id, {
          aiOutput: `❌ ${errorMsg}`,
          _aiLoading: false,
        });
        // 目标节点标记为错误（边框变红）
        execStore.setError(targetNode.id, errorMsg);
        execStore.setSuccess(sourceNode.id, { text });
        addLog({ type: 'error', message: `[运行] 异常: ${errorMsg}` });
      }
    }

    addLog({ type: 'success', message: '[运行] 全部处理完成' });
    setRunState('idle');
  };

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

  // 监听世界编辑器流程的 isRunning 状态，同步到 runState
  const flowIsRunning = useWorldEditorFlowStore((s) => s.isRunning);
  useEffect(() => {
    // 当编辑器流程在运行时，按钮置为 running；空闲时恢复 idle
    // 但只有当 we are in editor mode (有outline节点) 时才同步
    const { nodes } = useCanvasStore.getState();
    const hasOutlineNode = nodes.some((n) => n.type === 'outline' || n.type?.includes('Outline'));
    if (hasOutlineNode) {
      setRunState(flowIsRunning ? 'running' : 'idle');
    }
  }, [flowIsRunning]);

  // 监听非编辑器流程的完成（原始节点流程在 handleRun 末尾自行 setState）
  // 这个 useEffect 只负责编辑器模式下的同步

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
        onRun={handleRun} 
        runState={runState}
        onRunStateChange={(state) => setRunState(state)}
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
