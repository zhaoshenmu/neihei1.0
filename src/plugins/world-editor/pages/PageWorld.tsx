/**
 * 世界构建 - 面板第二页
 * 保持原始布局结构：核心法则与运行逻辑 + 社会架构与权力分配 两大区
 * 只缩小标签与输入框上下间距，所有标签保留完整
 * 连接到 usePanelDataStore，实现数据双向绑定
 *
 * ⚠️ 每个字段必须独立订阅，严禁使用 s.data[nodeId] ?? {}
 * 因为 ?? {} 每次创建新对象引用，导致 zustand 误判数据变化 → 无限循环渲染
 */
import { usePanelDataStore } from '@/store/panel-data-store';
import { pageStyles } from '@/theme/page-styles';

interface Props {
  nodeId: string;
}

export default function PageWorld({ nodeId }: Props) {
  // ⚠️ 重要：每个字段独立订阅，避免 ?? {} 创建新引用导致无限循环
  const powerSystem = usePanelDataStore((s) => (s.data[nodeId]?.powerSystem as string) ?? '');
  const physicsRules = usePanelDataStore((s) => (s.data[nodeId]?.physicsRules as string) ?? '');
  const magicTech = usePanelDataStore((s) => (s.data[nodeId]?.magicTech as string) ?? '');
  const politicalSystem = usePanelDataStore((s) => (s.data[nodeId]?.politicalSystem as string) ?? '');
  const economyMode = usePanelDataStore((s) => (s.data[nodeId]?.economyMode as string) ?? '');
  const classSystem = usePanelDataStore((s) => (s.data[nodeId]?.classSystem as string) ?? '');
  const conflict = usePanelDataStore((s) => (s.data[nodeId]?.conflict as string) ?? '');
  const updateNodeData = usePanelDataStore((s) => s.updateNodeData);

  const setVal = (key: string, val: any) => updateNodeData(nodeId, key, val);

  return (
    <div>
      {/* 核心法则与运行逻辑 */}
      <div style={{ ...pageStyles.sectionTitle, color: '#4a6ab8' }}>核心法则与运行逻辑</div>
      <div style={pageStyles.desc}>世界的基石 - 力量体系、物理规则、魔法/科技机制</div>

      <div style={areaLabel}>力量体系</div>
      <textarea placeholder="请输入内容..." style={pageStyles.textarea} value={powerSystem} onChange={(e) => setVal('powerSystem', e.target.value)} />
      <div style={areaLabel}>物理规则</div>
      <textarea placeholder="请输入内容..." style={pageStyles.textarea} value={physicsRules} onChange={(e) => setVal('physicsRules', e.target.value)} />
      <div style={areaLabel}>魔法/科技机制</div>
      <textarea placeholder="请输入内容..." style={pageStyles.textarea} value={magicTech} onChange={(e) => setVal('magicTech', e.target.value)} />

      <div style={divider} />

      {/* 社会架构与权力分配 */}
      <div style={{ ...pageStyles.sectionTitle, color: '#4a6ab8' }}>社会架构与权力分配</div>
      <div style={pageStyles.desc}>张力来源 - 政治、经济、阶级、冲突</div>

      <div style={areaLabel}>政治体制</div>
      <textarea placeholder="请输入内容..." style={pageStyles.textarea} value={politicalSystem} onChange={(e) => setVal('politicalSystem', e.target.value)} />
      <div style={areaLabel}>经济模式</div>
      <textarea placeholder="请输入内容..." style={pageStyles.textarea} value={economyMode} onChange={(e) => setVal('economyMode', e.target.value)} />
      <div style={areaLabel}>阶级系统</div>
      <textarea placeholder="请输入内容..." style={pageStyles.textarea} value={classSystem} onChange={(e) => setVal('classSystem', e.target.value)} />
      <div style={areaLabel}>冲突</div>
      <textarea placeholder="请输入内容..." style={pageStyles.textarea} value={conflict} onChange={(e) => setVal('conflict', e.target.value)} />
    </div>
  );
}

/** 页面独有：字段标签 */
const areaLabel: React.CSSProperties = {
  fontSize: 13,
  margin: '8px 0 3px',
  color: '#c8c8c8',
  userSelect: 'text',
};

/** 页面独有：分隔线 */
const divider: React.CSSProperties = {
  borderTop: '1px solid rgba(255,255,255,0.06)',
  margin: '16px 0',
};
