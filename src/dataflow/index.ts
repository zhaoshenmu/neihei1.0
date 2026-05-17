/**
 * 数据流引擎统一导出
 * 为后续杨洋葱架构和三元图谱内核预留接口
 */
export type { DataPacket, Triple, DataFlowEdge } from './data-packet';
export { initDataflowEngine, propagateFromNode } from './engine';
