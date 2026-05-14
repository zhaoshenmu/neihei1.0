/**
 * 日志状态管理
 * 使用 zustand 管理应用运行日志
 * 优化：限制日志数量 + 节流 + 只拦截关键日志
 */
import { create } from 'zustand';

export interface LogEntry {
  id: string;
  timestamp: string;
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  detail?: string;
}

interface LogState {
  logs: LogEntry[];
  addLog: (entry: Omit<LogEntry, 'id' | 'timestamp'>) => void;
  clearLogs: () => void;
}

// 限制最大日志条数
const MAX_LOGS = 200;

// 节流：相同消息 500ms 内不重复记录
const messageThrottle = new Map<string, number>();

function shouldThrottle(message: string): boolean {
  const now = Date.now();
  const last = messageThrottle.get(message);
  if (last && now - last < 500) {
    return true;
  }
  messageThrottle.set(message, now);
  // 清理过期的节流记录
  if (messageThrottle.size > 100) {
    const expired = Date.now() - 2000;
    for (const [key, time] of messageThrottle) {
      if (time < expired) {messageThrottle.delete(key);}
    }
  }
  return false;
}

function formatTimestamp(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
}

export const useLogStore = create<LogState>((set) => ({
  logs: [],
  
  addLog: (entry) => {
    // 节流：相同消息不重复记录
    if (shouldThrottle(entry.message)) {return;}
    
    const newEntry: LogEntry = {
      ...entry,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: formatTimestamp(),
    };
    
    set((state) => ({
      logs: [...state.logs.slice(-(MAX_LOGS - 1)), newEntry],
    }));
  },
  
  clearLogs: () => set({ logs: [] }),
}));

/**
 * 设置 console 拦截
 * 只拦截 console.error，其他日志采样记录
 * 返回清理函数
 */
export function setupConsoleCapture(): () => void {
  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;
  const originalInfo = console.info;

  const { addLog } = useLogStore.getState();

  // 只拦截 error（重要）
  console.error = (...args: unknown[]) => {
    const message = args.map(String).join(' ');
    // 过滤 React Flow 内部错误
    if (message.includes('React Flow') || message.includes('reactflow')) {
      // 采样记录，不全部记录
      if (Math.random() < 0.1) {
        addLog({ type: 'warning', message: message.slice(0, 200) });
      }
    } else {
      addLog({ type: 'error', message: message.slice(0, 200) });
    }
    originalError.apply(console, args);
  };

  // warn 采样记录（10%）
  console.warn = (...args: unknown[]) => {
    const message = args.map(String).join(' ');
    // 过滤 React Flow 的 "node type not found" 警告
    if (message.includes('Node type') && message.includes('not found')) {
      // 不记录这些警告
    } else if (Math.random() < 0.1) {
      addLog({ type: 'warning', message: message.slice(0, 200) });
    }
    originalWarn.apply(console, args);
  };

  // log 和 info 只记录关键信息
  console.log = (...args: unknown[]) => {
    const message = args.map(String).join(' ');
    if (message.includes('✅') || message.includes('[NeiHei]')) {
      addLog({ type: 'info', message: message.slice(0, 200) });
    }
    originalLog.apply(console, args);
  };

  console.info = (...args: unknown[]) => {
    const message = args.map(String).join(' ');
    if (message.includes('[NeiHei]')) {
      addLog({ type: 'info', message: message.slice(0, 200) });
    }
    originalInfo.apply(console, args);
  };

  // 返回清理函数
  return () => {
    console.log = originalLog;
    console.warn = originalWarn;
    console.error = originalError;
    console.info = originalInfo;
  };
}
