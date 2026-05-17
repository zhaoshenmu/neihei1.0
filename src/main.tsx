/**
 * NeiHei 应用入口
 * AI 节点画布 - 自动小说/剧本创作工具
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initDataflowEngine } from './dataflow';

// 初始化数据流引擎（在 React 渲染之前启动）
initDataflowEngine();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('找不到 #root 元素，请检查 index.html');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
