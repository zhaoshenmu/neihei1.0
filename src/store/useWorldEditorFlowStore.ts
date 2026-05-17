/**
 * useWorldEditorFlowStore.ts
 *
 * 世界编辑器流程状态管理
 * 控制自动/手动模式、当前步骤、运行状态
 *
 * stepStatus: 记录每个标签页的运行状态，供画布节点信号灯使用
 * - 'waiting' : 灰色（未运行）
 * - 'running' : 粉色（运行中）
 * - 'done'    : 绿色（已完成）
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TabId = 'setting' | 'world' | 'character' | 'plot' | 'consistency';

export type SignalStatus = 'waiting' | 'running' | 'done';

export type EditorMode = 'auto' | 'manual';

interface WorldEditorFlowState {
  /** 当前模式 */
  mode: EditorMode;
  /** 当前步骤索引 */
  currentStep: number;
  /** 所有步骤 */
  steps: TabId[];
  /** 是否正在运行 */
  isRunning: boolean;
  /** 外部触发计数器（OutlinePanel 监听此值变化） */
  externalTrigger: number;
  /** 标签页运行状态记录 (key=TabId) */
  stepStatus: Record<TabId, SignalStatus>;
  /** 设置模式 */
  setMode: (mode: EditorMode) => void;
  /** 跳转到指定步骤 */
  goToStep: (index: number) => void;
  /** 下一步 */
  nextStep: () => TabId | null;
  /** 上一步 */
  prevStep: () => TabId | null;
  /** 设置运行状态 */
  setRunning: (running: boolean) => void;
  /** 标记某个步骤为运行中 */
  markStepRunning: (tabId: TabId) => void;
  /** 标记某个步骤为已完成 */
  markStepDone: (tabId: TabId) => void;
  /** 标记某个步骤为等待（重置） */
  markStepWaiting: (tabId: TabId) => void;
  /** 重置所有步骤为等待 */
  resetStepStatus: () => void;
  /** 重置到第一步 */
  reset: () => void;
  /** 触发外部运行 */
  triggerExternalRun: () => void;
}

const defaultStepStatus = (): Record<TabId, SignalStatus> => ({
  setting: 'waiting',
  world: 'waiting',
  character: 'waiting',
  plot: 'waiting',
  consistency: 'waiting',
});

export const useWorldEditorFlowStore = create<WorldEditorFlowState>()(
  persist(
    (set, get) => ({
      mode: 'manual',
      currentStep: 0,
      steps: ['setting', 'world', 'character', 'plot', 'consistency'],
      isRunning: false,
      stepStatus: defaultStepStatus(),

      setMode: (mode) => set({ mode }),

      goToStep: (index) => {
        const { steps } = get();
        if (index >= 0 && index < steps.length) {
          set({ currentStep: index });
        }
      },

      nextStep: () => {
        const { currentStep, steps } = get();
        const next = currentStep + 1;
        if (next < steps.length) {
          set({ currentStep: next });
          return steps[next];
        }
        return null;
      },

      prevStep: () => {
        const { currentStep, steps } = get();
        const prev = currentStep - 1;
        if (prev >= 0) {
          set({ currentStep: prev });
          return steps[prev];
        }
        return null;
      },

      setRunning: (running) => set({ isRunning: running }),

      markStepRunning: (tabId) => {
        set((state) => ({
          stepStatus: { ...state.stepStatus, [tabId]: 'running' },
        }));
      },

      markStepDone: (tabId) => {
        set((state) => ({
          stepStatus: { ...state.stepStatus, [tabId]: 'done' },
        }));
      },

      markStepWaiting: (tabId) => {
        set((state) => ({
          stepStatus: { ...state.stepStatus, [tabId]: 'waiting' },
        }));
      },

      resetStepStatus: () => {
        set({ stepStatus: defaultStepStatus() });
      },

      reset: () => set({
        currentStep: 0,
        isRunning: false,
        mode: 'manual',
        externalTrigger: 0,
        stepStatus: defaultStepStatus(),
      }),

      /** 外部触发运行计数器（OutlinePanel 监听此值变化来触发流程） */
      externalTrigger: 0,
      /** 触发外部运行（App.tsx 调用） */
      triggerExternalRun: () => set((s) => ({ externalTrigger: s.externalTrigger + 1 })),
    }),
    {
      name: 'neihei-world-editor-flow',
      version: 2,
      migrate: (persistedState: any, _version: number) => ({
        ...persistedState,
        externalTrigger: 0,
        isRunning: false,
        stepStatus: defaultStepStatus(),
      }),
      partialize: (state) => ({
        mode: state.mode,
        currentStep: state.currentStep,
        steps: state.steps,
      }),
    }
  )
);
