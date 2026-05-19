/**
 * NeiHei 主题配置 - 深度暗色统一两色调
 *
 * 颜色体系：
 * - `面板色 #0d0d0d`：所有面板（#1面板、节点面板、弹出面板、侧边栏、工作台面板、顶栏）
 * - `背景色 #141414`：画布背景、工作台背景（比面板色稍浅一点）
 * - 边框/分割线 `#1e1e1e`：微弱的边界区分
 */
export const theme = {
  /** 颜色系统 */
  colors: {
    /** 画布背景 - 比面板色稍浅 */
    canvasBg: '#141414',
    /** 侧边栏背景 - 统一面板色 */
    sidebarBg: '#0d0d0d',
    /** 节点背景 - 统一面板色 */
    nodeBg: '#0d0d0d',
    /** 节点标题栏背景 - 比面板稍亮一点 */
    nodeHeaderBg: '#111111',
    /** 节点边框 - 微弱边界 */
    nodeBorder: '#1e1e1e',
    /** 节点选中边框 - 淡蓝灰 */
    nodeBorderSelected: '#6a9fb5',
    /** 节点阴影 */
    shadowColor: 'rgba(0,0,0,0.4)',

    /** 端口颜色 - 淡蓝灰 */
    portColor: '#6a9fb5',
    /** 端口悬停颜色 */
    portHoverColor: '#8ac4d8',

    /** 主要文字 */
    textPrimary: '#e0e0e0',
    /** 次要文字 */
    textSecondary: '#b0b0b0',
    /** 弱化文字 */
    textMuted: '#808080',

    /** 按钮背景 - 统一面板色 */
    buttonBg: '#0d0d0d',
    /** 按钮悬停 */
    buttonHoverBg: '#111111',
    /** 输入框边框 */
    inputBorder: '#1e1e1e',

    /** 成功 */
    success: '#4caf50',
    /** 警告 */
    warning: '#ff9800',
    /** 错误 */
    error: '#e06060',
    /** 信息 */
    info: '#6a9fb5',
  },

  /** 字体系统 */
  fontSize: {
    small: '11px',
    normal: '13px',
    large: '16px',
    xlarge: '20px',
  },

  fontFamily: {
    sans: "'Inter', 'Segoe UI', 'Roboto', sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
  },

  /** 间距系统 */
  spacing: {
    sidebarWidth: '260px',
    nodePadding: '12px',
    headerPadding: '8px 12px',
    contentPadding: '10px 12px',
  },

  /** 圆角 */
  borderRadius: {
    node: '8px',
    button: '6px',
    sidebar: '10px',
    port: '50%',
  },

  /** 过渡动画 */
  transition: {
    fast: '100ms ease',
    normal: '200ms ease',
    slow: '300ms ease',
  },
} as const;
