/**
 * 暗金主题 - NeiHei 默认主题
 * 纯黑背景 + 暗金色点缀
 */

export const theme = {
  name: 'dark-gold',
  
  colors: {
    // 背景色
    canvasBg: '#0a0a0a',
    sidebarBg: '#111111',
    nodeBg: '#1a1a1a',
    
    // 边框
    nodeBorder: '#c9a94e',
    nodeBorderSelected: '#e6c860',
    nodeBorderHover: '#d4b85a',
    
    // 文字
    textPrimary: '#d4b85a',
    textSecondary: '#a0883c',
    textMuted: '#6b5a2e',
    
    // 端口/连接点
    portColor: '#c9a94e',
    portHoverColor: '#e6c860',
    edgeColor: '#8a7a3a',
    edgeActiveColor: '#c9a94e',
    
    // 交互
    selectionRect: 'rgba(201, 169, 78, 0.15)',
    dragOverlay: 'rgba(201, 169, 78, 0.1)',
    shadowColor: 'rgba(201, 169, 78, 0.2)',
    
    // 文字颜色 (CSS)
    fontColor: '#d4b85a',
    fontColorSecondary: '#a0883c',
    
    // 按钮/交互元素
    buttonBg: '#2a2a2a',
    buttonHoverBg: '#3a3a3a',
    buttonBorder: '#c9a94e',
    buttonText: '#d4b85a',
    
    // 输入框
    inputBg: '#111111',
    inputBorder: '#3a3a3a',
    inputText: '#d4b85a',
    inputPlaceholder: '#6b5a2e',
  },
  
  spacing: {
    nodePadding: '16px 24px',
    nodeGap: 24,
    sidebarWidth: 280,
  },
  
  borderRadius: {
    node: '50px',
    sidebar: '12px',
    button: '8px',
    input: '8px',
  },
  
  fontFamily: {
    sans: "'Inter', 'Segoe UI', sans-serif",
    mono: "'Fira Code', 'Cascadia Code', monospace",
  },
  
  fontSize: {
    small: '12px',
    normal: '14px',
    medium: '16px',
    large: '18px',
    xlarge: '24px',
  },
  
  transition: {
    fast: '150ms ease-in-out',
    normal: '250ms ease-in-out',
    slow: '400ms ease-in-out',
  },
} as const;

export type Theme = typeof theme;
