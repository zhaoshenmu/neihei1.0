/**
 * page-registry.tsx
 *
 * 掌故司标签页注册表
 *
 * 每一个标签（tabId）对应一个独立的页面组件，存放在各自文件夹下：
 *   src/plugins/zhang-gu-si/pages/<tabId>/index.tsx
 *
 * 使用 React.lazy 实现按需加载，双击标签打开面板时才会加载对应页面代码。
 * 后续新增标签只需：
 *   1. 在 types.ts 的 ZhangGuSiTabId 中添加枚举
 *   2. 在 TABS 中添加定义
 *   3. 在 pages/ 下创建 <new-tab-id>/index.tsx
 *   4. 在本文件中添加 lazy 导入 + registry 映射
 *
 * ✓ 已阅读 docs/standards/02-代码规范.md
 */
import { lazy, Suspense, type LazyExoticComponent, type FC } from 'react';
import type { ZhangGuSiTabId } from '../types';

/** 兜底占位组件（功能开发中） */
const PlaceholderPage: FC = () => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      minHeight: 120,
      color: '#555',
      fontSize: 12,
      border: '1px dashed #222',
      borderRadius: 6,
      padding: 24,
      flexDirection: 'column',
      gap: 4,
    }}
  >
    🔧 功能开发中
    <span style={{ fontSize: 11, color: '#444' }}>敬请期待</span>
  </div>
);

/**
 * 注册表：tabId → LazyExoticComponent
 *
 * 每个标签独立一个文件夹，用 React.lazy(() => import(...)) 延迟加载
 * 这样打包时每个页面独立 chunk，互不影响
 */
export const PAGE_REGISTRY: Record<ZhangGuSiTabId, LazyExoticComponent<FC>> = {
  'outline-bind': lazy(() => import('./outline-bind/index')),
  'tab-02': lazy(() => import('./tab-02/index')),
  'tab-03': lazy(() => import('./tab-03/index')),
  'tab-04': lazy(() => import('./tab-04/index')),
  'tab-05': lazy(() => import('./tab-05/index')),
  'tab-06': lazy(() => import('./tab-06/index')),
  'tab-07': lazy(() => import('./tab-07/index')),
  'tab-08': lazy(() => import('./tab-08/index')),
  'tab-09': lazy(() => import('./tab-09/index')),
  'tab-10': lazy(() => import('./tab-10/index')),
};

/**
 * 获取标签页组件
 * 如果 tabId 不在注册表中，返回 PlaceholderPage
 */
export function getPageComponent(tabId: string): LazyExoticComponent<FC> {
  return PAGE_REGISTRY[tabId as ZhangGuSiTabId] || (lazy(() => Promise.resolve({ default: PlaceholderPage })) as LazyExoticComponent<FC>);
}

/** 带 Suspense 的懒加载页面 wrapper，供 index.tsx 使用 */
export const LazyPage: FC<{ tabId: ZhangGuSiTabId }> = ({ tabId }) => {
  const PageComp = getPageComponent(tabId);
  return (
    <Suspense
      fallback={
        <div style={{ color: '#555', fontSize: 12, padding: 24, textAlign: 'center' }}>加载中...</div>
      }
    >
      <PageComp />
    </Suspense>
  );
};
