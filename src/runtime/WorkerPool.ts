/**
 * WorkerPool.ts
 * 
 * Worker 沙箱池
 * 负责创建和管理 WebWorker 实例
 * 
 * 设计原则：
 * - 每次执行创建新 Worker，执行完立即销毁
 * - 用完即销毁策略保证不会积累僵尸 Worker
 * - 超时自动 terminate，防止节点死循环卡死
 * - 所有错误都被捕获返回，不会抛到主线程
 */

export class WorkerPool {
  private defaultTimeout: number;

  constructor(timeout = 10000) {
    this.defaultTimeout = timeout;
  }

  /**
   * 在 Worker 沙箱中执行节点代码
   * 
   * @param nodeCode - 要执行的代码字符串
   * @param input - 输入数据（必须是纯对象，会被 JSON clone）
   * @param timeout - 超时时间（毫秒）
   * @returns 执行结果（纯 JSON 对象）
   * @throws 执行错误或超时
   */
  run(
    nodeCode: string, 
    input: any, 
    timeout?: number
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      // 每个执行都创建一个全新的 Worker
      // 确保节点之间没有任何运行时共享
      const worker = new Worker(
        new URL('./NodeWorker.ts', import.meta.url),
        { type: 'module' }
      );

      const timer = setTimeout(() => {
        // 超时：强制终止 Worker
        worker.terminate();
        reject(new Error('节点执行超时'));
      }, timeout ?? this.defaultTimeout);

      worker.onmessage = (e: MessageEvent) => {
        clearTimeout(timer);
        worker.terminate();

        if (e.data.success) {
          resolve(e.data.result);
        } else {
          reject(new Error(e.data.error || '节点执行失败'));
        }
      };

      // Worker 初始化失败（如加载错误）
      worker.onerror = (err: ErrorEvent) => {
        clearTimeout(timer);
        worker.terminate();
        // 使用 ErrorEvent.message 而不是 ErrorEvent.error
        // 因为 ErrorEvent.error 在某些浏览器中可能为 null
        reject(new Error(err.message || 'Worker 加载失败'));
      };

      // 发送数据到 Worker
      // postMessage 自动进行结构化克隆（JSON clone）
      worker.postMessage({ 
        nodeCode, 
        input,
        nodeId: `worker_${Date.now()}` 
      });
    });
  }
}
