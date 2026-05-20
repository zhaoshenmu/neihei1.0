/**
 * smart-console/index.tsx
 *
 * 智能控制台插件入口
 * 这是一个浮动面板插件（hidden: true），不需要在画布上显示为节点
 * 面板组件在 Panel.tsx 中自包含管理，通过插件系统注册到 floating 插槽
 *
 * 注意：插件加载器要求 index.tsx 有默认导出（React 组件）
 * 即使对 hidden 插件，也必须存在此文件以满足 import.meta.glob 扫描
 */


/** 空占位组件 - 满足插件加载器的默认导出要求 */
export default function SmartConsolePlaceholder() {
  return null;
}
