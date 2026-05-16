/**
 * runtime/index.ts
 * 
 * 运行时沙箱系统导出
 * 提供节点代码隔离执行能力
 * 
 * 使用方式：
 * ```typescript
 * import { WorkerPool } from '@/runtime';
 * 
 * const pool = new WorkerPool();
 * try {
 *   const result = await pool.run('return input.a + input.b', { a: 1, b: 2 });
 *   console.log(result); // 3
 * } catch (err) {
 *   console.error('节点执行失败:', err.message);
 * }
 * ```
 */

export { WorkerPool } from './WorkerPool';
