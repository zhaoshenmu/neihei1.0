/**
 * OutlineNode 工作台面板组件
 * 在大纲节点的工作台面板中展示大纲编辑器（与悬浮面板内容一致）
 * 风格：#0d0d0d / #111111 深度统一
 */
import OutlinePanel from './OutlinePanel';

interface Props {
  nodeId: string;
}

export default function Panel({ nodeId }: Props) {
  return <OutlinePanel nodeId={nodeId} />;
}
