/**
 * OutlinePanel.tsx
 *
 * Outline 悬浮面板
 * 双击大纲编辑器节点时弹出
 * 宽度固定 400px，高度默认 900px，可通过右下角手柄垂直调整
 * 顶部 5 个标签：作品设定、世界构建、人物核心、剧情大纲、一致性检查
 *
 * 核心功能：
 * - 标签栏右侧胶囊开关（自动/手动）
 * - 手动模式：第1页无按钮，第2-4页有「▶」运行小箭头，第5页无按钮
 * - 自动模式：所有页面无按钮
 * - 运行成功显示 ✅ 对号（1.5秒消失）
 * - 暴露 runFromOutside 供 App.tsx 触发流程
 *
 * ✓ 已阅读 docs/standards/02-代码规范.md
 */
import { useState, useCallback, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { theme } from '@/theme/neihei-theme';
import { TABS } from './types';
import type { TabId } from './types';
import PageSetting from './pages/PageSetting';
import PageWorld from './pages/PageWorld';
import PageCharacter from './pages/PageCharacter';
import PagePlot from './pages/PagePlot';
import PageConsistency from './pages/PageConsistency';
import { useWorldEditorFlowStore } from '@/store/world-editor-flow-store';
import { usePromptStore } from '@/store/prompt-store';
import { usePanelDataStore } from '@/store/panel-data-store';
import { renderPrompt } from '@/utils/prompt-template';
import { callAi } from '@/services/ai-service';
import { useExecutionStore } from '@/store/execution-store';
import { handleAIResponse } from '@/utils/process-ai-response';

interface Props {
  nodeId: string;
}

/** 下一步映射：当前tab完成后进入的下一个tab */
const NEXT_TAB: Record<TabId, TabId | null> = {
  setting: 'world',
  world: 'character',
  character: 'plot',
  plot: 'consistency',
  consistency: null,
};

const OutlinePanel = forwardRef<{ runFromOutside: (startTab?: TabId) => Promise<void> }, Props>(
  ({ nodeId }, ref) => {
    const [activeTab, setActiveTab] = useState<TabId>('setting');
    const [isGenerating, setIsGenerating] = useState(false);
    const [successToast, setSuccessToast] = useState<string | null>(null);

    const mode = useWorldEditorFlowStore((s) => s.mode);
    const setMode = useWorldEditorFlowStore((s) => s.setMode);
    const setRunning = useWorldEditorFlowStore((s) => s.setRunning);
    const nextStep = useWorldEditorFlowStore((s) => s.nextStep);
    const markStepRunning = useWorldEditorFlowStore((s) => s.markStepRunning);
    const markStepDone = useWorldEditorFlowStore((s) => s.markStepDone);
    const externalTrigger = useWorldEditorFlowStore((s) => s.externalTrigger);
    const acquireLock = useWorldEditorFlowStore((s) => s.acquireLock);
    const releaseLock = useWorldEditorFlowStore((s) => s.releaseLock);
    const getPrompt = usePromptStore((s) => s.getPrompt);
    const updateNodeData = usePanelDataStore((s) => s.updateNodeData);

    const isFirstTab = activeTab === 'setting';
    const canRun = !isFirstTab;

    const showSuccess = useCallback((tabLabel: string) => {
      setSuccessToast(`✅ ${tabLabel} 完成`);
      setTimeout(() => setSuccessToast(null), 1500);
    }, []);

    /** 构建完整的上下文对象 - 直接从 Zustand store 同步读取最新数据，避免闭包陷阱 */
    const buildContext = useCallback((): Record<string, unknown> => {
      const latestData = usePanelDataStore.getState().data[nodeId] || {};
      const context: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(latestData)) {
        context[key] = val;
      }
      return context;
    }, [nodeId]);

    /** 执行一次 AI 调用：读取 prompt → 约束 + 渲染 → 调用 AI → 解析响应 → 写入 store */
    const runSingleStep = useCallback(
      async (tab: TabId): Promise<TabId | null> => {
        const next = NEXT_TAB[tab];
        const promptEntry = getPrompt(tab as any);
        const context = buildContext();
        let fullPrompt = renderPrompt(promptEntry.content, context);

        // 1. 追加作品约束（全局约束，来自 setting 面板）
        const settingEntry = getPrompt('setting');
        if (settingEntry.constraint) {
          fullPrompt += `\n\n=== 作品约束 ===\n${settingEntry.constraint}`;
        }

        // 2. 追加世界规则约束（来自作品设定面板选中的世界规则）
        const worldRuleConstraint = context.worldRuleConstraint as string | undefined;
        if (worldRuleConstraint && worldRuleConstraint.trim()) {
          fullPrompt += `\n\n=== 世界规则约束 ===\n${worldRuleConstraint}`;
        }

        // 3. 追加当前面板的约束条件
        if (promptEntry.constraint) {
          fullPrompt += `\n\n=== 约束条件 ===\n${promptEntry.constraint}`;
        }

        console.log(`[WorldEditor] 调用AI: ${tab}${next ? ` → ${next}` : ' → 最终打包'}`);
        const response = await callAi([{ role: 'user', content: fullPrompt }]);

        if (!response.success) {
          throw new Error(response.error || 'AI 调用失败');
        }

        handleAIResponse(response.content, updateNodeData, nodeId);

        markStepDone(tab);

        const currentLabel = TABS.find((t) => t.id === tab)?.label || '';
        showSuccess(currentLabel);

        if (next) {
          setActiveTab(next);
          nextStep();
        } else {
          console.log('[WorldEditor] 一致性检查完成，最终JSON已保存');
        }

        return next;
      },
      [getPrompt, buildContext, updateNodeData, nodeId, nextStep, showSuccess, markStepDone],
    );

    /** AI 生成并填充下一个面板的数据 */
    const handleRunAI = useCallback(
      async () => {
        if (!acquireLock()) {
          console.warn('[WorldEditor] 另一个面板正在运行，本次跳过');
          return;
        }
        const execStore = useExecutionStore.getState();
        try {
          if (isGenerating) return;
          const nextTab = NEXT_TAB[activeTab];
          const isConsistencyPage = activeTab === 'consistency';
          if (!nextTab && !isConsistencyPage) return;

          markStepRunning(activeTab);
          setIsGenerating(true);
          setRunning(true);
          execStore.setRunning(nodeId);

          await runSingleStep(activeTab);

          execStore.setSuccess(nodeId, { activeTab, nextTab });
        } catch (err: unknown) {
          console.error('AI 生成失败:', err);
          const errorMsg = err instanceof Error ? err.message : String(err);
          execStore.setError(nodeId, errorMsg);
          setSuccessToast(`❌ 生成失败: ${errorMsg}`);
          setTimeout(() => setSuccessToast(null), 3000);
        } finally {
          setIsGenerating(false);
          setRunning(false);
          releaseLock();
        }
      },
      [activeTab, acquireLock, releaseLock, isGenerating, nodeId, runSingleStep, showSuccess, setRunning, markStepRunning],
    );

    /** 自动模式：从指定标签页开始全自动执行 */
    const runAutoSequence = useCallback(async (startTab?: TabId) => {
      const start = startTab ?? activeTab;
      setRunning(true);
      const allSteps = ['setting', 'world', 'character', 'plot', 'consistency'] as TabId[];
      const startIdx = allSteps.indexOf(start);
      if (startIdx === -1) {
        setRunning(false);
        return;
      }

      for (let i = startIdx; i < allSteps.length; i++) {
        const current = allSteps[i];
        markStepRunning(current);
        setIsGenerating(true);

        try {
          await runSingleStep(current);
        } catch (err) {
          console.error('自动运行失败:', err);
          useWorldEditorFlowStore.getState().markStepWaiting(current);
          setIsGenerating(false);
          setRunning(false);
          return;
        }

        setIsGenerating(false);
        await new Promise((r) => setTimeout(r, 300));
      }

      showSuccess('🎉 全部完成');
      setRunning(false);
    }, [activeTab, runSingleStep, showSuccess, setRunning]);

    /** 监听外部触发 */
    const hasMounted = useRef(false);
    useEffect(() => {
      if (!hasMounted.current) {
        hasMounted.current = true;
        return;
      }
      if (externalTrigger <= 0) return;
      const currentMode = useWorldEditorFlowStore.getState().mode;
      if (currentMode === 'auto') {
        setActiveTab('setting');
        // 🔴 修复：传入 'setting' 而非依赖 activeTab 闭包（setActiveTab 是异步，不会立即生效）
        runAutoSequence('setting').catch(console.error);
      } else {
        setActiveTab('setting');
        setTimeout(() => handleRunAI(), 50);
      }
    }, [externalTrigger]);

    /** 外部触发运行 */
    useImperativeHandle(ref, () => ({
      runFromOutside: async (startTab?: TabId) => {
        if (startTab) setActiveTab(startTab);
        const currentMode = useWorldEditorFlowStore.getState().mode;
        if (currentMode === 'auto') {
          setActiveTab('setting');
          // 🔴 修复：传入明确的 setting 参数
          await runAutoSequence('setting');
        } else {
          setActiveTab('setting');
          await handleRunAI();
        }
      },
    }));

    const handleToggleMode = () => {
      setMode(mode === 'auto' ? 'manual' : 'auto');
    };

    const handleTabChange = (tabId: TabId) => {
      setActiveTab(tabId);
    };

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* 标签栏 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            borderBottom: `1px solid ${theme.colors.inputBorder}`,
            background: '#0a0a0a',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', flex: 1 }}>
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                style={{
                  flex: 1,
                  padding: '10px 4px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: activeTab === tab.id ? '2px solid #c9a84c' : '2px solid transparent',
                  color: activeTab === tab.id ? '#c9a84c' : '#8a7a4a',
                  fontSize: 13,
                  fontWeight: activeTab === tab.id ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                  whiteSpace: 'nowrap',
                  fontFamily: "'Inter', 'Segoe UI', sans-serif",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 滑块开关 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            padding: '6px 16px 4px 16px',
            background: '#0a0a0a',
            flexShrink: 0,
          }}
        >
          <div
            onClick={handleToggleMode}
            title={mode === 'auto' ? '自动模式' : '手动模式'}
            style={{
              position: 'relative',
              width: 28,
              height: 14,
              borderRadius: 7,
              background: mode === 'auto' ? '#555' : '#333',
              cursor: 'pointer',
              transition: 'background 200ms ease',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 1,
                left: mode === 'auto' ? 14 : 1,
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: mode === 'auto' ? '#fff' : '#888',
                transition: 'left 200ms ease, background 200ms ease',
                boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
              }}
            />
          </div>
        </div>

        {/* 内容区域 */}
        <div
          style={{
            flex: 1,
            padding: '14px 16px',
            overflowY: 'auto',
            color: theme.colors.textPrimary,
          }}
        >
          {activeTab === 'setting' && <PageSetting nodeId={nodeId} />}
          {activeTab === 'world' && <PageWorld nodeId={nodeId} />}
          {activeTab === 'character' && <PageCharacter nodeId={nodeId} />}
          {activeTab === 'plot' && <PagePlot nodeId={nodeId} />}
          {activeTab === 'consistency' && <PageConsistency nodeId={nodeId} />}
        </div>

        {/* 底部操作栏 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            padding: '8px 16px',
            borderTop: `1px solid ${theme.colors.inputBorder}`,
            background: '#0a0a0a',
            flexShrink: 0,
            gap: 8,
          }}
        >
          {mode === 'auto' && (
            <span style={{ fontSize: 12, color: '#808080', marginRight: 'auto' }}>
              ⚡ 自动模式，点击右上角「▶ 运行」启动全流程
            </span>
          )}

          {mode === 'manual' && isFirstTab && (
            <span style={{ fontSize: 12, color: '#808080', marginRight: 'auto' }}>
              💡 填写作品设定后，点击画布顶部工具栏「▶ 运行」按钮
            </span>
          )}

          {mode === 'manual' && canRun && !isFirstTab && (
            <button
              onClick={() => handleRunAI()}
              disabled={isGenerating}
              title="AI 填充下一页"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: isGenerating
                  ? 'rgba(106, 159, 181, 0.1)'
                  : 'rgba(106, 159, 181, 0.2)',
                border: `1px solid ${isGenerating ? 'rgba(106, 159, 181, 0.3)' : theme.colors.nodeBorderSelected}`,
                borderRadius: 20,
                padding: '6px 16px',
                cursor: isGenerating ? 'not-allowed' : 'pointer',
                color: theme.colors.textPrimary,
                fontSize: 13,
                fontFamily: theme.fontFamily.sans,
                transition: 'all 200ms ease',
                opacity: isGenerating ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isGenerating) e.currentTarget.style.background = 'rgba(106, 159, 181, 0.35)';
              }}
              onMouseLeave={(e) => {
                if (!isGenerating) e.currentTarget.style.background = 'rgba(106, 159, 181, 0.2)';
              }}
            >
              {isGenerating ? (
                <>
                  <span style={{ fontSize: 14 }}>⏳</span>
                  <span>生成中...</span>
                </>
              ) : (
                <>
                  <span style={{ fontSize: 14, color: isGenerating ? '#666' : '#e0e0e0' }}>▶</span>
                  <span>运行</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Toast */}
        {successToast && (
          <div
            style={{
              position: 'absolute',
              bottom: 60,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(150, 150, 150, 0.12)',
              border: 'none',
              borderRadius: 20,
              padding: '8px 20px',
              color: '#999',
              fontSize: 14,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              pointerEvents: 'none',
              animation: 'fadeInOut 1.5s ease forwards',
              zIndex: 100,
            }}
          >
            {successToast}
          </div>
        )}

        <style>{`
          @keyframes fadeInOut {
            0% { opacity: 0; transform: translateX(-50%) translateY(10px); }
            20% { opacity: 1; transform: translateX(-50%) translateY(0); }
            80% { opacity: 1; transform: translateX(-50%) translateY(0); }
            100% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
          }
        `}</style>
      </div>
    );
  },
);

OutlinePanel.displayName = 'OutlinePanel';

export default OutlinePanel;
