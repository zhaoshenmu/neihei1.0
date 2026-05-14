# NeiHei 🧅 — AI 节点画布

> 基于洋葱三元组引擎的 AI 小说/剧本创作工具。
>
> **核心铁律：内核只做三件事 —— 查记忆、验幻觉、写回**

## 快速开始

```bash
npm install
npm run dev
```

## 项目架构

```
neihei1.0/
├── src/
│   ├── kernel/         # ⚙️ 内核引擎（未实现）
│   ├── canvas/         # 🎨 React Flow 画布
│   ├── plugin-system/  # 🔌 插件系统（自动加载）
│   ├── chajian/        # 📦 插件节点集合
│   ├── store/          # 📋 Zustand 状态管理
│   ├── components/     # 🧩 通用 UI 组件
│   ├── theme/          # 🎭 暗金主题
│   ├── dataflow/       # 📊 数据流 & 三元组定义
│   └── nodes/          # 📦 节点渲染组件
├── docs/               # 📚 架构文档
│   ├── 01-架构总览.md
│   ├── 02-内核架构.md
│   ├── 03-节点系统设计.md
│   └── 04-实施路线图.md
└── eslint.config.js    # ESLint + Prettier 配置
```

## 技术栈

| 层 | 选型 |
|---|------|
| 框架 | React 19 + TypeScript 5.8 |
| 画布 | @xyflow/react (React Flow) |
| 状态管理 | Zustand 5 |
| 构建 | Vite 6 |
| 代码规范 | ESLint + Prettier + typescript-eslint |

## 可用脚本

```bash
npm run dev        # 启动开发服务器
npm run build      # 构建生产版本
npm run lint       # 代码检查
npm run lint:fix   # 自动修复 lint 问题
npm run format     # 格式化代码
```

## 插件开发

将插件放入 `src/chajian/` 目录，每个插件包含：

```
src/chajian/YourPlugin/
├── manifest.json   # 插件元数据（type, label, inputs, outputs）
└── index.tsx       # React 组件
```

系统使用 `import.meta.glob` 自动扫描并注册插件。

## 安全说明

- API 密钥应通过环境变量注入，详见 `src/services/` 层设计
- 插件 manifest 加载时会进行 schema 校验
- 每个插件节点由 Error Boundary (PluginSandbox) 隔离

## 许可证

ISC
