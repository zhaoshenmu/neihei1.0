/**
 * 画布主组件
 * 基于 React Flow 的节点编辑画布
 * 纯黑色背景，支持节点拖拽、连接、选择等交互
 * 
 * 性能优化：
 * - 移除 selectionOnDrag（与节点拖拽互斥，导致每帧选区计算）
 * - 移除 snapToGrid（拖动时每帧网格对齐计算）
 * - 移除 MiniMap（拖动时持续重绘，小场景不需要）
 * - 移除 box-shadow（拖动时触发重绘）
 * - 使用节点选中时仅改变边框颜色，不加阴影
 */
import React, { useCallback, useRef, useMemo, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  BackgroundVariant,
  type Node,
  type XYPosition,
  SelectionMode,
  type Viewport,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useCanvasStore } from '@/store';
import { buildNodeTypes } from '@/nodes';
import { theme } from '@/theme/neihei-theme';
import { CANVAS_CONFIG } from './Canvas.config';
import BezierEdge from './BezierEdge';
import { handleDropEvent, handleKeyDelete } from './Canvas.handlers';

interface CanvasProps {
  onAddNode?: (type: string, position: XYPosition) => void;
  pluginLoaded?: boolean;
}

const Canvas: React.FC<CanvasProps> = ({ onAddNode, pluginLoaded = false }) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<{
    getViewport: () => Viewport;
    screenToFlowPosition: (pos: { x: number; y: number }) => XYPosition;
  } | null>(null);

  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    removeNodes,
    selectedNodeIds,
    setSelectedNodes,
  } = useCanvasStore();

  const nodeTypes = useMemo(() => buildNodeTypes(), [pluginLoaded]);
  const edgeTypes = useMemo(() => ({ bezier: BezierEdge }), []);

  const onInit = useCallback((instance: any) => {
    setReactFlowInstance(instance);
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      if (!reactFlowWrapper.current || !reactFlowInstance) {return;}
      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      handleDropEvent(
        event as unknown as DragEvent,
        bounds,
        () => reactFlowInstance.getViewport(),
        (type: string, pos: XYPosition) => {
          addNode(type, pos);
          if (onAddNode) {onAddNode(type, pos);}
        }
      );
    },
    [reactFlowInstance, addNode, onAddNode]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Delete' || event.key === 'Backspace') {
        handleKeyDelete(selectedNodeIds, removeNodes);
      }
      if (event.key === 'Escape') {
        setSelectedNodes([]);
      }
    },
    [selectedNodeIds, removeNodes, setSelectedNodes]
  );

  const onSelectionChange = useCallback(
    ({ nodes: selectedNodes }: { nodes: Node[] }) => {
      setSelectedNodes(selectedNodes.map((n) => n.id));
    },
    [setSelectedNodes]
  );

  const defaultEdgeOptions = useMemo(
    () => ({
      style: CANVAS_CONFIG.edgeStyle,
      activeStyle: CANVAS_CONFIG.edgeSelectedStyle,
      selectedStyle: CANVAS_CONFIG.edgeSelectedStyle,
      type: 'bezier' as const,
      animated: false,
    }),
    []
  );

  return (
    <div
      ref={reactFlowWrapper}
      style={{
        width: '100%',
        height: '100%',
        background: theme.colors.canvasBg,
      }}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onKeyDown={onKeyDown}
      tabIndex={0}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={onInit}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        onSelectionChange={onSelectionChange}
        selectionMode={SelectionMode.Partial}
        panOnDrag={[1, 2]}
        deleteKeyCode={['Delete', 'Backspace']}
        multiSelectionKeyCode="Shift"
        snapToGrid={false}
        minZoom={CANVAS_CONFIG.minZoom}
        maxZoom={CANVAS_CONFIG.maxZoom}
        defaultViewport={CANVAS_CONFIG.defaultViewport}
        fitView={false}
        style={{ background: theme.colors.canvasBg }}
        colorMode="dark"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={CANVAS_CONFIG.backgroundPattern.size}
          size={CANVAS_CONFIG.backgroundPattern.thickness}
          color={CANVAS_CONFIG.backgroundPattern.color}
        />

        <Controls
          style={{
            background: theme.colors.sidebarBg,
            border: `1px solid ${theme.colors.nodeBorder}`,
            borderRadius: theme.borderRadius.button,
          }}
          showInteractive={false}
        />
      </ReactFlow>
    </div>
  );
};

export default Canvas;
