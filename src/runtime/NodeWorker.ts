/**
 * NodeWorker.ts
 * 
 * WebWorker 沙箱 - 节点代码执行环境
 * 运行在完全隔离的 Worker 线程中
 * 
 * 安全特性：
 * - 无 window/document/localStorage 访问权限
 * - 无法操作主线程 DOM
 * - 无法修改主线程全局变量
 * - 只能通过 postMessage 返回纯 JSON
 * 
 * 执行流程：
 * 1. 主线程 postMessage({ nodeCode, input })
 * 2. Worker 用 new Function 执行代码
 * 3. 结果通过 postMessage 返回
 * 4. 任何错误都被 try-catch 捕获，不会逃逸到主线程
 */

self.onmessage = async (e: MessageEvent) => {
  const { nodeCode, input, nodeId } = e.data;

  try {
    // new Function 在 Worker 内动态执行
    // Worker 没有 window/document，天然沙箱
    const fn = new Function('input', nodeCode);
    const result = await fn(input);

    self.postMessage({ 
      nodeId, 
      success: true, 
      result 
    });
  } catch (err) {
    // 所有错误都被捕获，不会逃逸到主线程
    self.postMessage({ 
      nodeId, 
      success: false, 
      error: err instanceof Error ? err.message : String(err) 
    });
  }
};
