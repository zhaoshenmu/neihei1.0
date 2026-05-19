# 固定ID（fixedId）管理

> 最后更新: 2026-05-19

## 已分配 ID

| fixedId | 插件类型 | 标签 | 类型 |
|---------|---------|------|------|
| 001 | world-editor | 世界编辑器 | 节点 |
| 002 | character-node | 角色节点 | 节点 |
| 003 | plot-node | 剧情节点 | 节点 |
| 004 | smart-console | 智能控制台 | **面板(floating)** |
| 005 | zhang-gu-si | 张古斯 | 节点 |

## 注册规则

1. **每个插件必须在 manifest.json 中定义 fixedId**
2. **fixedId 必须唯一**，不能与其他插件重复
3. **类型前缀**：节点插件用 001-099，面板插件用 100-199（当前面板使用 004-099 短期兼容）
4. **已删除插件的 ID 不可复用**（防止数据冲突）
5. 如需添加新插件，请联系 maintainer 分配新 ID

## 面板插件规范

面板插件（`hidden: true`）需要满足以下文件结构：

```
plugins/your-panel/
├── manifest.json    # 必须：hidden: true + panelSlot: "floating"
├── index.tsx        # 必须：空占位组件（默认导出 React.FC）
└── Panel.tsx        # 必须：面板实际组件，默认导出 React.FC
```

**manifest.json 示例**：
```json
{
  "type": "my-panel",
  "label": "我的面板",
  "hidden": true,
  "panelSlot": "floating",
  "fixedId": "0XX",
  "inputs": [],
  "outputs": [],
  "defaultData": {}
}
```

**特点**：
- 面板组件完全自包含，自己管理开关状态和 UI
- 通过 `Panel.tsx` 自动注册到 `pluginRegistry` 的 floating 插槽
- 从 `App.tsx` 移除后硬编码引用不会导致编译错误
- 删除插件目录后，系统自动跳过，不会报错
