/**
 * 情节结构 - 面板第三页
 * 填写故事梗概、三幕式结构
 * 连接到 usePanelDataStore，实现数据双向绑定
 */
import { usePanelDataStore } from '@/store/panel-data-store';
import { pageStyles } from '@/theme/page-styles';

interface Props {
  nodeId: string;
}

const textareaTall: React.CSSProperties = {
  ...pageStyles.textarea,
  height: 120,
};

const colLabel: React.CSSProperties = {
  fontSize: 12,
  color: '#808080',
  marginBottom: 4,
  userSelect: 'text',
};

export default function PagePlot({ nodeId }: Props) {
  const synopsis = usePanelDataStore((s) => (s.data[nodeId]?.synopsis as string) ?? '');
  const firstAct = usePanelDataStore((s) => (s.data[nodeId]?.firstAct as string) ?? '');
  const secondAct = usePanelDataStore((s) => (s.data[nodeId]?.secondAct as string) ?? '');
  const thirdAct = usePanelDataStore((s) => (s.data[nodeId]?.thirdAct as string) ?? '');
  const updateNodeData = usePanelDataStore((s) => s.updateNodeData);

  const setVal = (key: string, val: any) => updateNodeData(nodeId, key, val);

  return (
    <div>
      <div style={pageStyles.sectionTitle}>故事梗概</div>
      <textarea
        placeholder="输入故事梗概..."
        style={pageStyles.textarea}
        value={synopsis}
        onChange={(e) => setVal('synopsis', e.target.value)}
      />

      <div style={pageStyles.sectionTitle}>三幕式结构</div>

      <div style={colLabel}>第一幕</div>
      <textarea
        placeholder="输入第一幕内容..."
        style={textareaTall}
        value={firstAct}
        onChange={(e) => setVal('firstAct', e.target.value)}
      />

      <div style={colLabel}>第二幕</div>
      <textarea
        placeholder="输入第二幕内容..."
        style={textareaTall}
        value={secondAct}
        onChange={(e) => setVal('secondAct', e.target.value)}
      />

      <div style={colLabel}>第三幕</div>
      <textarea
        placeholder="输入第三幕内容..."
        style={textareaTall}
        value={thirdAct}
        onChange={(e) => setVal('thirdAct', e.target.value)}
      />
    </div>
  );
}
