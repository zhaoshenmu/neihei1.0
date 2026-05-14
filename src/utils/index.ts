/**
 * 工具函数集合
 *
 * 通用、无副作用的工具函数放在此处。
 * 原则：每个函数必须是纯函数（相同输入 = 相同输出），便于测试。
 */

/**
 * 为节点生成唯一 ID
 * 格式: prefix_timestamp_counter
 */
let idCounter = 0;
export function generateId(prefix = 'id'): string {
  idCounter += 1;
  return `${prefix}_${Date.now()}_${idCounter}`;
}

/**
 * 安全地解析 JSON，失败时返回 fallback
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/**
 * 深度冻结对象（防止运行时意外修改配置）
 */
export function deepFreeze<T extends Record<string, unknown>>(obj: T): Readonly<T> {
  Object.keys(obj).forEach((key) => {
    const value = obj[key];
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
      deepFreeze(value as Record<string, unknown>);
    }
  });
  return Object.freeze(obj);
}

/**
 * 节流函数（用于拖拽等高频事件）
 */
export function throttle<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      fn(...args);
    }
  };
}

/**
 * 断言非空（开发时类型收窄用）
 */
export function assertNonNull<T>(value: T, message?: string): asserts value is NonNullable<T> {
  if (value === null || value === undefined) {
    throw new Error(message ?? '值不应为空');
  }
}
