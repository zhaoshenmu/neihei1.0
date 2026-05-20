/**
 * FlowEdge.tsx
 *
 * 流动特效连线组件（光珠拖尾版）
 * - 发光实线管道（带轻微模糊发光滤镜）
 * - 光珠拖尾：从主光点向后排列的一串从大到小发光圆形，沿运动方向排列
 * - 每个光珠都带发光模糊效果，无锯齿
 * - 管道外围发光光晕
 * 数据从输入到输出单向流动的视觉效果
 */
import React from 'react';
import {
  BaseEdge,
  getBezierPath,
  type EdgeProps,
  type Edge,
} from '@xyflow/react';

export type FlowEdgeType = Edge<Record<string, unknown>, 'flow'>;

// 每个连线创建一个唯一的 filter ID，避免冲突
let filterIdCounter = 0;

// 光珠拖尾配置：从主光点向后排列（沿 -x 方向），半径从大到小，透明度递减
const TAIL_BEADS = [
  { x: -0,  r: 2.8, opacity: 0.7 },
  { x: -8,  r: 2.0, opacity: 0.45 },
  { x: -16, r: 1.4, opacity: 0.25 },
  { x: -24, r: 0.9, opacity: 0.13 },
  { x: -32, r: 0.5, opacity: 0.06 },
];

export default function FlowEdge({
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

  // 颜色 - 更亮的色调
  const baseColor = selected ? '#6a9fb5' : '#555555';
  const glowColor = selected ? '#a8d8ea' : '#7ab8d4';      // 发光色
  const flowColor = selected ? '#7ab8d4' : '#609ab5';      // 流动色
  const beadColor = selected ? '#8fc5e0' : '#6a9fb5';      // 光珠色
  const highlightColor = selected ? '#e0f0ff' : '#b8e0f0';  // 高亮色

  // 为每个连线实例生成唯一 ID
  const filterId = React.useMemo(() => `comet-glow-${++filterIdCounter}`, []);

  return (
    <>
      {/* BaseEdge 负责交互层（点击区域、选中高亮） */}
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: baseColor,
          strokeWidth: selected ? 2 : 1.5,
          ...style,
        }}
      />

      {/* 发光实线管道 */}
      <path
        d={edgePath}
        fill="none"
        stroke={flowColor}
        strokeWidth={selected ? 2.5 : 2}
        className="flow-edge-line"
        filter={`url(#${filterId}-line-glow)`}
        style={{ pointerEvents: 'none', ...style }}
      />

      {/* 实线管道外层发光光晕 */}
      <path
        d={edgePath}
        fill="none"
        stroke={glowColor}
        strokeWidth={selected ? 6 : 4}
        opacity={selected ? 0.25 : 0.15}
        className="flow-edge-line-glow"
        style={{ pointerEvents: 'none' }}
      />

      {/* 发光滤镜 */}
      <defs>
        <filter id={`${filterId}`} x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id={`${filterId}-glow`} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id={`${filterId}-bead-glow`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {/* 管道线轻微发光滤镜 */}
        <filter id={`${filterId}-line-glow`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="0.8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ===== 彗星1（主彗星 + 光珠拖尾）===== */}
      <g style={{ pointerEvents: 'none' }}>
        <animateMotion
          dur="3.2s"
          repeatCount="indefinite"
          path={edgePath}
          rotate="auto"
        />

        {/* 光珠拖尾：从大到小排列的发光圆形 */}
        {TAIL_BEADS.map((bead, i) => (
          <circle
            key={i}
            cx={bead.x}
            cy={0}
            r={bead.r}
            fill={i === 0 ? beadColor : glowColor}
            opacity={bead.opacity}
            filter={`url(#${filterId}-bead-glow)`}
          />
        ))}

        {/* 主光点发光光晕 */}
        <circle r={8} fill={glowColor} opacity={0.3} filter={`url(#${filterId})`} />
        {/* 主光点 */}
        <circle r={3.5} fill={highlightColor} opacity={1} filter={`url(#${filterId})`} />
      </g>

      {/* ===== 彗星2（延迟），增加数据流密度 ===== */}
      <g style={{ pointerEvents: 'none' }}>
        <animateMotion
          dur="3.2s"
          repeatCount="indefinite"
          path={edgePath}
          begin="1.4s"
          rotate="auto"
        />

        {/* 光珠拖尾（略小略暗，制造层次感） */}
        {TAIL_BEADS.map((bead, i) => (
          <circle
            key={i}
            cx={bead.x}
            cy={0}
            r={bead.r * 0.9}
            fill={i === 0 ? beadColor : glowColor}
            opacity={bead.opacity * 0.85}
            filter={`url(#${filterId}-bead-glow)`}
          />
        ))}

        <circle r={7} fill={glowColor} opacity={0.25} filter={`url(#${filterId})`} />
        <circle r={3} fill={highlightColor} opacity={0.85} filter={`url(#${filterId})`} />
      </g>

      {/* 选中状态外发光增强 */}
      {selected && (
        <path
          d={edgePath}
          fill="none"
          stroke={glowColor}
          strokeWidth={10}
          opacity="0.15"
          className="flow-edge-glow"
          style={{ pointerEvents: 'none' }}
        />
      )}

      <style>{`
        /* 覆盖 React Flow 的虚线动画 CSS */
        .flow-edge-line {
          stroke-dasharray: none !important;
          animation: none !important;
        }
        .flow-edge-line-glow {
          stroke-dasharray: none !important;
          animation: flowLinePulse 1.5s ease-in-out infinite alternate !important;
        }
        @keyframes flowLinePulse {
          from { opacity: 0.12; }
          to { opacity: 0.25; }
        }
      `}</style>
    </>
  );
};


