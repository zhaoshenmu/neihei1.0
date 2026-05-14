/**
 * 数据包定义
 * 节点间传输的数据格式
 * 为后续杨洋葱架构和三元图谱内核预留
 */

/** 三元组 (实体-关系-实体) */
export interface Triple {
  subject: string;      // 主体（实体）
  predicate: string;    // 谓词（关系）
  object: string;       // 客体（实体/属性）
  confidence?: number;  // 置信度 0-1
}

/** 数据包 */
export interface DataPacket {
  id: string;
  timestamp: number;
  sourceNodeId: string;
  /** 三元组列表 */
  triples: Triple[];
  /** 附加元数据 */
  metadata?: Record<string, unknown>;
}

/** 数据流连接节点间的数据传输 */
export interface DataFlowEdge {
  sourceId: string;
  targetId: string;
  data: DataPacket[];
}
