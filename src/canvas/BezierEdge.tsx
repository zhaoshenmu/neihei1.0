/**
 * 自定义贝塞尔曲线边组件
 * 使用 SVG 的 cubic bezier 曲线绘制平滑连线
 */
import { BaseEdge, getBezierPath, type EdgeProps, type Edge } from '@xyflow/react';

export type BezierEdgeType = Edge<Record<string, unknown>, 'bezier'>;

export default function BezierEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
  style,
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      style={{
        stroke: selected ? '#6a9fb5' : '#555555',
        strokeWidth: selected ? 2 : 1.5,
        ...style,
      }}
    />
  );
};


