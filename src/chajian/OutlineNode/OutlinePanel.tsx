/**
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
import { useWorldEditorFlowStore } from '@/store/useWorldEditorFlowStore';
import { usePromptStore } from '@/store/usePromptStore';
import { usePanelDataStore } from '@/store/usePanelDataStore';
import { renderPrompt } from '@/utils/prompt-template';
import { callAi } from '@/services/ai-service';

interface Props {
  nodeId: string;
}

/** 下一步映射：当前tab完成后进入的下一个tab */
const NEXT_TAB: Record<TabId, TabId | null> = {
  setting: 'world',
  world: 'character',
  character: 'plot',
  plot: 'consistency',
  consistency: null, // 最后一页，无下一个tab
};

/** 将任何值转为适合展示的字符串（对象转 JSON，其他直接转字符串） */
function safeString(val: any): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  try {
    return JSON.stringify(val, null, 2);
  } catch {
    return String(val);
  }
}

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
    const getPrompt = usePromptStore((s) => s.getPrompt);
    const panelData = usePanelDataStore((s) => s.data);
    const updateNodeData = usePanelDataStore((s) => s.updateNodeData);

    /** 检查是否是第一个面板 */
    const isFirstTab = activeTab === 'setting';

    /** 检查当前面板是否能运行（非第一个面板 — 第1页手动填，没有运行按钮，其他页都有） */
    const canRun = !isFirstTab;

    /** 显示成功对号 */
    const showSuccess = useCallback((tabLabel: string) => {
      setSuccessToast(`✅ ${tabLabel} 完成`);
      setTimeout(() => setSuccessToast(null), 1500);
    }, []);

    /** 构建完整的上下文对象（所有已填写的面板数据合并，包含深层对象） */
    const buildContext = useCallback((): Record<string, any> => {
      const nodeData = panelData[nodeId] || {};
      const context: Record<string, any> = {};

      // 直接把面板数据作为扁平上下文
      for (const [key, val] of Object.entries(nodeData)) {
        context[key] = val;
      }

      return context;
    }, [panelData, nodeId]);

    /** AI 生成并填充下一个面板的数据（或一致性检查完成后输出最终JSON） */
    const handleRunAI = useCallback(async (_fromExternal?: boolean) => {
      if (isGenerating) return;
      const nextTab = NEXT_TAB[activeTab];

      // 一致性检查页面：没有下一个tab，但需要运行AI生成检查报告并打包最终输出
      const isConsistencyPage = activeTab === 'consistency';
      if (!nextTab && !isConsistencyPage) return;

      // 标记当前标签为运行中（粉色）
      markStepRunning(activeTab);
      setIsGenerating(true);
      setRunning(true);
      try {
        const promptEntry = getPrompt(activeTab as any);
        const context = buildContext();
        const fullPrompt = renderPrompt(promptEntry.content, context);

        console.log(`[WorldEditor] 调用AI: ${activeTab}${nextTab ? ` → ${nextTab}` : ' → 最终打包'}`);
        const response = await callAi([{ role: 'user', content: fullPrompt }]);

        if (!response.success) {
          throw new Error(response.error || 'AI 调用失败');
        }
        const responseContent = response.content;
        let parsedData: Record<string, any>;
        try {
          parsedData = JSON.parse(responseContent);
        } catch {
          const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            parsedData = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('AI 返回格式异常，无法解析为JSON');
          }
        }

        // 「剧情大纲」面板需要特殊处理：确保 plot_structure 是对象，且包含 three acts
        if (nextTab === 'plot') {
          console.log('[WorldEditor] AI plot 原始返回:', JSON.stringify(parsedData));
          
          // 情况1: plot_structure 存在
          if (parsedData.plot_structure) {
            if (typeof parsedData.plot_structure === 'string') {
              try {
                parsedData.plot_structure = JSON.parse(parsedData.plot_structure);
              } catch {
                parsedData.plot_structure = {};
              }
            }
            // 确保 plot_structure 是一个对象
            if (typeof parsedData.plot_structure !== 'object') {
              parsedData.plot_structure = {};
            }
          } else {
            // 情况2: 顶层有 first_act/second_act/third_act，但没有 plot_structure
            if (parsedData.first_act || parsedData.second_act || parsedData.third_act) {
              parsedData.plot_structure = {};
              if (parsedData.first_act) parsedData.plot_structure.first_act = parsedData.first_act;
              if (parsedData.second_act) parsedData.plot_structure.second_act = parsedData.second_act;
              if (parsedData.third_act) parsedData.plot_structure.third_act = parsedData.third_act;
              // 清理顶层字段避免冲突
              delete parsedData.first_act;
              delete parsedData.second_act;
              delete parsedData.third_act;
            }
            // 情况3: 顶层有 act1/act2/act3
            else if (parsedData.act1 || parsedData.act2 || parsedData.act3) {
              parsedData.plot_structure = {};
              if (parsedData.act1) parsedData.plot_structure.first_act = parsedData.act1;
              if (parsedData.act2) parsedData.plot_structure.second_act = parsedData.act2;
              if (parsedData.act3) parsedData.plot_structure.third_act = parsedData.act3;
              delete parsedData.act1;
              delete parsedData.act2;
              delete parsedData.act3;
            }
            // 情况4: 完全没有 plot_structure - 创建空对象
            else {
              parsedData.plot_structure = {};
            }
          }
          console.log('[WorldEditor] AI plot 处理后:', JSON.stringify(parsedData));
        }

        // 「一致性检查」面板需要特殊处理：确保各字段是字符串
        if (nextTab === 'consistency') {
          for (const key of ['characterConsistency', 'worldConsistency', 'plotLogic', 'timeline', 'analysis']) {
            if (parsedData[key] !== undefined) {
              parsedData[key] = safeString(parsedData[key]);
            }
          }
        }

        // 将 AI 生成的数据存入 usePanelDataStore，关联到 nodeId
        // 重要：所有页面字段都应该是字符串，若有对象则 JSON.stringify 存储
        for (const [key, value] of Object.entries(parsedData)) {
          // characters 字段是数组，需要保持结构（PageCharacter 读取为对象数组）
          if (key === 'characters') {
            updateNodeData(nodeId, key, value);
          } else if (key === 'plot_structure') {
            // plot_structure 是嵌套对象（PagePlot 读取 first_act/second_act/third_act）
            updateNodeData(nodeId, key, value);
          } else {
            // 其他字段统一转为字符串存储
            updateNodeData(nodeId, key, safeString(value));
          }
        }

        // 标记当前标签为已完成（绿色）
        markStepDone(activeTab);

        // 显示成功对号
        const currentTabLabel = TABS.find(t => t.id === activeTab)?.label || '';
        showSuccess(currentTabLabel);

        // 切换到下一个面板（一致性检查是最后一页，不切换tab）
        if (nextTab) {
          setActiveTab(nextTab);
          nextStep();
        } else {
          // 一致性检查完成：通知用户数据已打包到画布
          console.log('[WorldEditor] 一致性检查完成，最终JSON已保存');
        }
      } catch (err) {
        console.error('AI 生成失败:', err);
        const errorMsg = err instanceof Error ? err.message : String(err);
        // 显示错误 toast
        setSuccessToast(`❌ 生成失败: ${errorMsg}`);
        setTimeout(() => setSuccessToast(null), 3000);
      } finally {
        setIsGenerating(false);
        setRunning(false);
      }
    }, [activeTab, isGenerating, getPrompt, buildContext, updateNodeData, nodeId, nextStep, showSuccess, setRunning]);

    /** 自动模式：从当前页开始全自动执行 */
    const runAutoSequence = useCallback(async () => {
      let current = activeTab;
      setRunning(true);
      // 处理所有5个页面，包括最后一页（consistency）
      const allSteps = ['setting', 'world', 'character', 'plot', 'consistency'] as TabId[];
      const startIdx = allSteps.indexOf(current);
      if (startIdx === -1) { setRunning(false); return; }

      for (let i = startIdx; i < allSteps.length; i++) {
        current = allSteps[i];
        const next = NEXT_TAB[current]; // consistency页 next=null

        // 标记当前标签为运行中（粉色）
        markStepRunning(current);
        setIsGenerating(true);
        const promptEntry = getPrompt(current as any);
        const context = buildContext();
        const fullPrompt = renderPrompt(promptEntry.content, context);

        try {
          const response = await callAi([{ role: 'user', content: fullPrompt }]);
          // 标记当前标签为已完成（绿色）
          markStepDone(current);
          if (response.success) {
            let parsedData: Record<string, any>;
            try {
              parsedData = JSON.parse(response.content);
            } catch {
              const jsonMatch = response.content.match(/\{[\s\S]*\}/);
              if (jsonMatch) parsedData = JSON.parse(jsonMatch[0]);
              else throw new Error('格式异常');
            }

            // 特殊字段处理 - plot 面板
            if (next === 'plot') {
              console.log('[WorldEditor Auto] AI plot 原始返回:', JSON.stringify(parsedData));
              
              if (parsedData.plot_structure) {
                if (typeof parsedData.plot_structure === 'string') {
                  try { parsedData.plot_structure = JSON.parse(parsedData.plot_structure); }
                  catch { parsedData.plot_structure = {}; }
                }
                if (typeof parsedData.plot_structure !== 'object') parsedData.plot_structure = {};
              } else if (parsedData.first_act || parsedData.second_act || parsedData.third_act) {
                parsedData.plot_structure = {};
                if (parsedData.first_act) parsedData.plot_structure.first_act = parsedData.first_act;
                if (parsedData.second_act) parsedData.plot_structure.second_act = parsedData.second_act;
                if (parsedData.third_act) parsedData.plot_structure.third_act = parsedData.third_act;
                delete parsedData.first_act;
                delete parsedData.second_act;
                delete parsedData.third_act;
              } else if (parsedData.act1 || parsedData.act2 || parsedData.act3) {
                parsedData.plot_structure = {};
                if (parsedData.act1) parsedData.plot_structure.first_act = parsedData.act1;
                if (parsedData.act2) parsedData.plot_structure.second_act = parsedData.act2;
                if (parsedData.act3) parsedData.plot_structure.third_act = parsedData.act3;
                delete parsedData.act1;
                delete parsedData.act2;
                delete parsedData.act3;
              } else {
                parsedData.plot_structure = {};
              }
              console.log('[WorldEditor Auto] AI plot 处理后:', JSON.stringify(parsedData));
            }
            if (next === 'consistency') {
              for (const key of ['characterConsistency', 'worldConsistency', 'plotLogic', 'timeline', 'analysis']) {
                if (parsedData[key] !== undefined) parsedData[key] = safeString(parsedData[key]);
              }
            }

            for (const [key, value] of Object.entries(parsedData)) {
              if (key === 'characters' || key === 'plot_structure') {
                updateNodeData(nodeId, key, value);
              } else {
                updateNodeData(nodeId, key, safeString(value));
              }
            }

            const currentLabel = TABS.find(t => t.id === current)?.label || '';
            showSuccess(currentLabel);
          }
        } catch (err) {
          console.error('自动运行失败:', err);
          // 失败时重置信号灯为 waiting，防止卡粉色
          useWorldEditorFlowStore.getState().markStepWaiting(current);
          setIsGenerating(false);
          setRunning(false);
          return;
        }

        if (next) {
          setActiveTab(next);
          nextStep();
          current = next;
        }
        setIsGenerating(false);

        await new Promise(r => setTimeout(r, 300));
      }

      // 全部完成
      showSuccess('🎉 全部完成');
      setRunning(false);
    }, [activeTab, getPrompt, buildContext, panelData, nodeId, updateNodeData, nextStep, showSuccess, setRunning]);

    /** 监听外部触发（App.tsx 通过 flowStore 触发） */
    const hasMounted = useRef(false);
    useEffect(() => {
      // ⚠️ 关键修复：跳过首次挂载，防止从 localStorage 恢复的旧 externalTrigger 值触发自动流程
      if (!hasMounted.current) {
        hasMounted.current = true;
        return;
      }
      if (externalTrigger <= 0) return;
      const currentMode = useWorldEditorFlowStore.getState().mode;
      if (currentMode === 'auto') {
        setActiveTab('setting');
        runAutoSequence().catch(console.error);
      } else {
        setActiveTab('setting');
        // 手动模式：从第一页开始
        // 第一页没有按钮，由外部触发，自动运行第一页→第二页
        setTimeout(() => handleRunAI(true), 50);
      }
    }, [externalTrigger]);

    /** 外部触发运行（从 App.tsx 调用） */
    useImperativeHandle(ref, () => ({
      runFromOutside: async (startTab?: TabId) => {
        if (startTab) {
          setActiveTab(startTab);
        }
        const currentMode = useWorldEditorFlowStore.getState().mode;
        if (currentMode === 'auto') {
          setActiveTab('setting');
          await runAutoSequence();
        } else {
          setActiveTab('setting');
          await handleRunAI(true);
        }
      },
    }));

    /** 切换滑块开关 */
    const handleToggleMode = () => {
      setMode(mode === 'auto' ? 'manual' : 'auto');
    };

    /** 处理标签切换 */
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
        {/* 标签栏（无胶囊开关） */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            borderBottom: `1px solid ${theme.colors.inputBorder}`,
            background: '#0a0a0a',
            flexShrink: 0,
          }}
        >
          {/* 标签按钮（暗金色） */}
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
                  borderBottom:
                    activeTab === tab.id
                      ? '2px solid #c9a84c'
                      : '2px solid transparent',
                  color:
                    activeTab === tab.id
                      ? '#c9a84c'
                      : '#8a7a4a',
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

        {/* 滑块开关（放在标签栏下方，右对齐，小巧） */}
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

        {/* 底部操作栏：运行按钮 */}
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
          {/* 自动模式下显示模式提示（灰色） */}
          {mode === 'auto' && (
            <span
              style={{
                fontSize: 12,
                color: '#808080',
                marginRight: 'auto',
              }}
            >
              ⚡ 自动模式，点击右上角「▶ 运行」启动全流程
            </span>
          )}

          {/* 手动模式：第2-5页（世界构建~一致性检查）显示运行小箭头，第1页（作品设定）不显示 */}
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
                border: `1px solid ${
                  isGenerating
                    ? 'rgba(106, 159, 181, 0.3)'
                    : theme.colors.nodeBorderSelected
                }`,
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
                if (!isGenerating)
                  e.currentTarget.style.background = 'rgba(106, 159, 181, 0.35)';
              }}
              onMouseLeave={(e) => {
                if (!isGenerating)
                  e.currentTarget.style.background = 'rgba(106, 159, 181, 0.2)';
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

        {/* 成功对号 Toast（灰色无边框） */}
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

        {/* 动画 keyframes */}
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
  }
);

OutlinePanel.displayName = 'OutlinePanel';

export default OutlinePanel;
