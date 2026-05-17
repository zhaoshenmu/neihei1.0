/**
 * 节点渲染器
 * 根据节点类型动态加载对应的插件节点组件
 * 所有自定义节点都通过此组件统一渲染
 * 
 * 性能优化：使用 useMemo 缓存沙箱组件引用，避免拖动时 React 卸载/重新挂载
 */
import React, { useMemo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { pluginRegistry } from '@/plugin-system';
import { withPluginSandbox } from '@/plugin-system';
import { NodeWrapper } from './NodeWrapper';
import { useCanvasStore } from '@/store/canvas-store';

/**
 * 画布节点动态渲染组件
 * 通过 React Flow 的 nodeTypes 机制，将所有自定义节点映射到此组件
 */
export const NodeRenderer: React.FC<NodeProps> = (props) => {
  const { type, data, selected, id } = props;
  const collapsedNodes = useCanvasStore((s) => s.collapsedNodes);
  const isCollapsed = collapsedNodes.includes(id);

  // 从注册表中获取该节点类型对应的插件
  const manifest = pluginRegistry.getManifest(type);
  const PluginComponent = pluginRegistry.getComponent(type);

  // 缓存沙箱组件引用，避免每次渲染创建新组件
  // withPluginSandbox 内部也有缓存，但 useMemo 确保即使缓存失效也不会重复创建
  const SandboxedComponent = useMemo(() => {
    if (!PluginComponent) {return null;}
    return withPluginSandbox(
      PluginComponent,
      type,
      manifest?.label || type
    );
  }, [PluginComponent, type, manifest?.label]);

  if (!PluginComponent || !SandboxedComponent) {
    // 插件未找到：显示降级 UI
    return (
      <NodeWrapper
        label={type}
        selected={selected}
        style={{
          borderColor: '#6b5a2e',
          opacity: 0.6,
          cursor: 'not-allowed',
        }}
      >
        <div style={{ color: '#6b5a2e', fontSize: 11 }}>
          插件未加载: {type}
        </div>
      </NodeWrapper>
    );
  }

  // 渲染包裹了 NodeWrapper 的插件组件
  // 传递 nodeId 用于执行状态展示
  return (
    <NodeWrapper
      label={manifest?.label || type}
      selected={selected}
      data={data}
      inputs={manifest?.inputs}
      outputs={manifest?.outputs}
      nodeId={id}
      collapsed={isCollapsed}
      shortId={pluginRegistry.getFixedId(type) || id.slice(0, 4)}
    >
      <SandboxedComponent {...props} />
    </NodeWrapper>
  );
};

/**
 * 生成 React Flow 所需的 nodeTypes 映射表
 * 将所有已注册插件类型映射到 NodeRenderer
 * 使用 Proxy 实现懒加载：每次访问时从注册表动态获取最新类型
 */
export function buildNodeTypes(): Record<string, React.ComponentType<NodeProps>> {
  const types: Record<string, React.ComponentType<NodeProps>> = {};

  // 从注册表获取所有已注册类型
  const registeredTypes = pluginRegistry.getAllTypes();

  for (const type of registeredTypes) {
    types[type] = NodeRenderer;
  }

  // 添加默认的 fallback 类型
  types['default'] = NodeRenderer;

  return types;
}
