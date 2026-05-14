/**
 * 插件沙箱
 * 使用 Error Boundary 包裹每个插件节点，防止单个插件崩溃影响整个画布
 * 同时提供插件生命周期管理和资源清理
 * 
 * 性能优化：withPluginSandbox 使用 WeakMap 缓存，避免每次渲染创建新组件引用
 */
import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { theme } from '@/theme/dark-gold';

interface PluginSandboxProps {
  children: ReactNode;
  pluginType: string;
  pluginLabel: string;
  onError?: (type: string, error: Error) => void;
}

interface PluginSandboxState {
  hasError: boolean;
  error: Error | null;
}

/**
 * 插件错误边界组件
 * 捕获子组件（插件节点）的渲染错误，显示降级 UI
 */
class PluginSandbox extends Component<PluginSandboxProps, PluginSandboxState> {
  constructor(props: PluginSandboxProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): PluginSandboxState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error(
      `[插件沙箱] ❌ 插件 "${this.props.pluginLabel}" (${this.props.pluginType}) 发生错误:`,
      error,
      errorInfo
    );
    this.props.onError?.(this.props.pluginType, error);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: '16px 24px',
            background: '#2a1a1a',
            border: '1px solid #8a3a3a',
            borderRadius: '50px',
            color: '#d48a8a',
            fontSize: '12px',
            textAlign: 'center',
            minWidth: 160,
            fontFamily: theme.fontFamily.sans,
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 4 }}>
            ⚠️ {this.props.pluginLabel}
          </div>
          <div style={{ fontSize: 11, color: '#a06060', marginBottom: 8 }}>
            {this.state.error?.message || '渲染错误'}
          </div>
          <button
            onClick={this.handleRetry}
            style={{
              background: 'transparent',
              border: `1px solid ${theme.colors.buttonBorder}`,
              color: theme.colors.buttonText,
              borderRadius: '20px',
              padding: '4px 16px',
              fontSize: 11,
              cursor: 'pointer',
            }}
          >
            重试
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default PluginSandbox;

/**
 * 缓存已包装的沙箱组件
 * key: `${pluginType}::${pluginLabel}`
 * value: 沙箱组件引用
 * 
 * 使用 Map 而非 WeakMap，因为我们需要字符串 key
 */
const sandboxCache = new Map<string, React.FC<any>>();

/**
 * 高阶组件：将插件组件包裹上 Error Boundary
 * 
 * 性能关键：使用缓存确保相同的 pluginType 返回同一个组件引用
 * 避免 React 在拖动时卸载/重新挂载 DOM
 */
export function withPluginSandbox(
  WrappedComponent: React.ComponentType<any>,
  pluginType: string,
  pluginLabel: string
): React.FC<any> {
  const cacheKey = `${pluginType}::${pluginLabel}`;
  
  const cached = sandboxCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const Wrapped: React.FC<any> = (props) => (
    <PluginSandbox pluginType={pluginType} pluginLabel={pluginLabel}>
      <WrappedComponent {...props} />
    </PluginSandbox>
  );
  Wrapped.displayName = `PluginSandbox(${pluginType})`;
  
  sandboxCache.set(cacheKey, Wrapped);
  return Wrapped;
}

/**
 * 清空沙箱缓存（用于热更新/插件重载）
 */
export function clearSandboxCache(): void {
  sandboxCache.clear();
}
