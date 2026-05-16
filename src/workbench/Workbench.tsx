/**
 * Workbench.tsx
 * 
 * 工作台主组件 - 全屏网格面板视图
 * 用于集中管理和配置所有节点的面板
 * 去掉了顶栏标题行，节省空间
 */
import { WorkbenchGrid } from './WorkbenchGrid';
import { theme } from '@/theme/neihei-theme';

export function Workbench() {
  return (
    <div
      style={{
        height: '100%',
        background: theme.colors.canvasBg,
        overflow: 'hidden',
      }}
    >
      <WorkbenchGrid />
    </div>
  );
}
