/**
 * execution-store.ts
 *
 * 节点执行状态管理
 * 存储每个节点的执行结果、错误信息和当前状态
 * 持久化到 localStorage：刷新/关闭网页后执行状态保留，可恢复执行
 *
 * 职责：
 * - 记录每个节点的执行状态（idle/running/success/error）
 * - 存储执行结果和错误信息
 * - 提供 API 供 NodeWrapper 读取来改变节点颜色
 * - 提供 API 供 LogPanel 读取来显示错误日志
 *
 * 设计原则：
 * - 轻量：只存状态，不存数据
 * - 解耦：不依赖任何运行时组件
 * - 可观察：所有状态变化都能被 React 组件订阅
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** 节点执行状态枚举 */
export type NodeExecStatus = 'idle' | 'running' | 'success' | 'error';

/** 单个节点的执行状态 */
export interface NodeExecState {
  nodeId: string;
  status: NodeExecStatus;
  error?: string;
  /** 执行结果，消费者应自行类型断言 */
  result?: unknown;
  startedAt?: number;
  endedAt?: number;
}

/** 执行状态存储 */
export interface ExecutionState {
  /** 所有节点的执行状态 keyed by nodeId */
  states: Record<string, NodeExecState>;

  /** 设置节点为运行中 */
  setRunning: (nodeId: string) => void;

  /** 设置节点为成功 */
  setSuccess: (nodeId: string, result: unknown) => void;

  /** 设置节点为失败（带错误信息） */
  setError: (nodeId: string, error: string) => void;

  /** 重置单个节点到 idle */
  resetNode: (nodeId: string) => void;

  /** 重置所有节点到 idle */
  resetAll: () => void;
}

export const useExecutionStore = create<ExecutionState>()(
  persist(
    (set, get) => ({
      states: {},

      setRunning: (nodeId: string) => {
        set((state) => ({
          states: {
            ...state.states,
            [nodeId]: {
              nodeId,
              status: 'running',
              startedAt: Date.now(),
            },
          },
        }));
      },

      setSuccess: (nodeId: string, result: unknown) => {
        set((state) => ({
          states: {
            ...state.states,
            [nodeId]: {
              nodeId,
              status: 'success',
              result,
              startedAt: state.states[nodeId]?.startedAt,
              endedAt: Date.now(),
            },
          },
        }));
      },

      setError: (nodeId: string, error: string) => {
        set((state) => ({
          states: {
            ...state.states,
            [nodeId]: {
              nodeId,
              status: 'error',
              error,
              startedAt: state.states[nodeId]?.startedAt,
              endedAt: Date.now(),
            },
          },
        }));
      },

      resetNode: (nodeId: string) => {
        set((state) => {
          const next = { ...state.states };
          delete next[nodeId];
          return { states: next };
        });
      },

      resetAll: () => {
        set({ states: {} });
      },

      getNodeState: (nodeId: string) => {
        return get().states[nodeId];
      },
    }),
    {
      name: 'neihei-execution',
    }
  )
);
