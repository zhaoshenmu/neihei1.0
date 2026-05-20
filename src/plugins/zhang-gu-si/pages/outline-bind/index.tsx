/**
 * PageOutlineBind.tsx
 *
 * 大纲锚定绑定模块 - 页面容器
 * 掌故司节点 001 的第一个功能标签页面
 *
 * 当前为空壳，功能开发中
 * 后续将展示内核对大纲锚定的绑定数据（只读展示）
 *
 * 色调：世界编辑器风格 #0a0a0a / #c9a84c
 *
 * ✓ 已阅读 docs/standards/02-代码规范.md
 */
import React from 'react';

const PageOutlineBind: React.FC = () => {
  return (
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
      }}
    >
      🔧 大纲锚定绑定模块
      <br />
      <span style={{ fontSize: 11, color: '#444', marginTop: 4, display: 'block' }}>
        功能开发中，敬请期待
      </span>
    </div>
  );
};

export default PageOutlineBind;
