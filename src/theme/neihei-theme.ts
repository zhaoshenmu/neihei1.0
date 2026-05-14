/**
 * NeiHei 主题配置 - 黑灰色系（ComfyUI 风格）
 * 所有颜色和尺寸集中管理，方便全局统一调整
 */

export const theme = {
  /** 颜色系统 */
  colors: {
    /** 画布背景 - 深灰黑 */
    canvasBg: '#1a1a1a',
    /** 侧边栏背景 */
    sidebarBg: '#222222',
    /** 节点背景 */
    nodeBg: '#2d2d2d',
    /** 节点标题栏背景 */
    nodeHeaderBg: '#3a3a3a',
    /** 节点边框 */
    nodeBorder: '#4a4a4a',
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
    
    /** 按钮背景 */
    buttonBg: '#333333',
    /** 按钮悬停 */
    buttonHoverBg: '#404040',
    /** 输入框边框 */
    inputBorder: '#3a3a3a',
    
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

export default theme;
