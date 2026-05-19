/**
 * 作品设定 - 面板第一页
 * 填写创意、叙事视角、主角性别/名字、风格选择（下拉菜单+自定义）、风格展开描述、世界规则、规划字数
 * 风格：#0d0d0d / #1e1e1e 暗色统一，紧凑排版
 * 连接到 usePanelDataStore，实现数据双向绑定
 *
 * 新增：
 *  - 风格选择改为点击弹出下拉：番茄爽文 / 起点风格 / 刺猬猫风格 + 自定义输入框
 *  - 风格选择下方显示「风格展开」文本框，根据风格预填典型描述，可编辑
 *  - 新增「世界规则」：现代世界 / 末日世界 / 未来世界 / 仙侠世界 + 自定义
 *  - 每章规划字数去掉下拉箭头
 */
import React, { useState, useRef, useEffect } from 'react';
import { usePanelDataStore } from '@/store/panel-data-store';
import { pageStyles } from '@/theme/page-styles';

interface Props {
  nodeId: string;
}

/** 风格预设 */
const STYLE_PRESETS = ['番茄爽文', '起点风格', '刺猬猫风格'];

/** 风格对应的默认展开描述 */
const STYLE_DETAILS_DEFAULT: Record<string, string> = {
  '番茄爽文': '快节奏爽文、爽点密集、金手指设定、打脸情节、每章末尾有爽点收尾、节奏明快不拖沓',
  '起点风格': '世界观宏大、设定严谨、慢热型成长、主角升级线清晰、配角塑造立体、伏笔回收完整',
  '刺猬猫风格': '轻松搞笑、玩梗频繁、二次元感强、系统流常见、吐槽风格、节奏轻松明快',
};

/** 世界规则预设 */
const WORLD_RULE_PRESETS = ['现代世界', '末日世界', '未来世界', '仙侠世界'];

export default function PageSetting({ nodeId }: Props) {
  const creativeIdea = usePanelDataStore((s) => (s.data[nodeId]?.creativeIdea as string) ?? '');
  const perspective = usePanelDataStore((s) => (s.data[nodeId]?.perspective as string) ?? '第一人称');
  const protagonistGender = usePanelDataStore((s) => (s.data[nodeId]?.protagonistGender as string) ?? '男');
  const protagonistName = usePanelDataStore((s) => (s.data[nodeId]?.protagonistName as string) ?? '');
  const style = usePanelDataStore((s) => (s.data[nodeId]?.style as string) ?? '');
  const styleDetails = usePanelDataStore((s) => (s.data[nodeId]?.styleDetails as string) ?? '');
  const worldRule = usePanelDataStore((s) => (s.data[nodeId]?.worldRule as string) ?? '');
  const chapterWordCount = usePanelDataStore((s) => (s.data[nodeId]?.chapterWordCount as string) ?? '');
  const totalWordCount = usePanelDataStore((s) => (s.data[nodeId]?.totalWordCount as string) ?? '');
  const updateNodeData = usePanelDataStore((s) => s.updateNodeData);

  const setVal = (key: string, val: unknown) => updateNodeData(nodeId, key, val);

  // ========== 风格下拉状态 ==========
  const [styleDropdownOpen, setStyleDropdownOpen] = useState(false);
  const [styleCustomMode, setStyleCustomMode] = useState(false);
  const [styleCustomValue, setStyleCustomValue] = useState('');
  const styleRef = useRef<HTMLDivElement>(null);

  // ========== 世界规则自定义 ==========
  const [worldRuleCustomMode, setWorldRuleCustomMode] = useState(false);
  const [worldRuleCustomValue, setWorldRuleCustomValue] = useState('');

  // 点击外部关闭风格下拉
  useEffect(() => {
    if (!styleDropdownOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (styleRef.current && !styleRef.current.contains(e.target as Node)) {
        setStyleDropdownOpen(false);
        setStyleCustomMode(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [styleDropdownOpen]);

  /** 选中风格 */
  const handleStyleSelect = (s: string) => {
    setVal('style', s);
    // 如果该风格有默认展开描述且当前 styleDetails 为空，自动填充
    const defaultDetail = STYLE_DETAILS_DEFAULT[s];
    if (defaultDetail && !styleDetails) {
      setVal('styleDetails', defaultDetail);
    } else if (defaultDetail) {
      // 保持已存在的内容不变，但如果是旧的自定义内容，建议用户使用预设？这里不做覆盖
    }
    setStyleDropdownOpen(false);
    setStyleCustomMode(false);
  };

  /** 自定义风格确认 */
  const handleStyleCustomConfirm = () => {
    if (styleCustomValue.trim()) {
      setVal('style', styleCustomValue.trim());
      setStyleDropdownOpen(false);
      setStyleCustomMode(false);
      setStyleCustomValue('');
    }
  };

  /** 选中世界规则 */
  const handleWorldRuleSelect = (r: string) => {
    setVal('worldRule', r);
    setWorldRuleCustomMode(false);
  };

  /** 自定义世界规则确认 */
  const handleWorldRuleCustomConfirm = () => {
    if (worldRuleCustomValue.trim()) {
      setVal('worldRule', worldRuleCustomValue.trim());
      setWorldRuleCustomMode(false);
      setWorldRuleCustomValue('');
    }
  };

  /** 当 styleDetails 改变时同步到 store */
  const handleStyleDetailsChange = (val: string) => {
    setVal('styleDetails', val);
  };

  return (
    <div>
      {/* 填写创意 */}
      <SectionTitle title="填写创意" />
      <textarea
        placeholder="输入您的创意..."
        style={pageStyles.textarea}
        value={creativeIdea}
        onChange={(e) => setVal('creativeIdea', e.target.value)}
      />

      {/* 叙事视角 */}
      <SectionTitle title="叙事视角" />
      <div style={pageStyles.row}>
        {['第一人称', '第三人称'].map((opt) => (
          <div
            key={opt}
            style={{
              ...pageStyles.radioBtn,
              ...(perspective === opt ? pageStyles.radioBtnActive : {}),
            }}
            onClick={() => setVal('perspective', opt)}
          >
            <div
              style={{
                ...pageStyles.radioCircle,
                ...(perspective === opt ? pageStyles.radioCircleActive : {}),
              }}
            />
            {opt}
          </div>
        ))}
      </div>

      {/* 主角性别 */}
      <SectionTitle title="主角性别" />
      <div style={pageStyles.row}>
        {['男', '女'].map((opt) => (
          <div
            key={opt}
            style={{
              ...pageStyles.radioBtn,
              ...(protagonistGender === opt ? pageStyles.radioBtnActive : {}),
            }}
            onClick={() => setVal('protagonistGender', opt)}
          >
            <div
              style={{
                ...pageStyles.radioCircle,
                ...(protagonistGender === opt ? pageStyles.radioCircleActive : {}),
              }}
            />
            {opt}
          </div>
        ))}
      </div>

      {/* 主角名字 */}
      <SectionTitle title="主角名字" />
      <input
        placeholder="请输入主角名字..."
        style={pageStyles.input}
        value={protagonistName}
        onChange={(e) => setVal('protagonistName', e.target.value)}
      />

      {/* ===== 风格选择（下拉菜单 + 自定义） ===== */}
      <SectionTitle title="风格选择" />
      <div ref={styleRef} style={{ position: 'relative' }}>
        <div
          style={{
            ...pageStyles.selectBox,
            cursor: 'pointer',
          }}
          onClick={() => setStyleDropdownOpen(!styleDropdownOpen)}
        >
          <span style={{ color: style ? '#e0e0e0' : '#606060' }}>
            {style || '点击选择风格...'}
          </span>
          <span style={{ color: '#808080', fontSize: 10 }}>▼</span>
        </div>

        {styleDropdownOpen && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              zIndex: 100,
              background: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: 8,
              boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
              overflow: 'hidden',
              marginTop: 4,
            }}
          >
            {STYLE_PRESETS.map((s) => (
              <div
                key={s}
                onClick={() => handleStyleSelect(s)}
                style={{
                  padding: '7px 12px',
                  cursor: 'pointer',
                  color: style === s ? '#c9a84c' : '#e0e0e0',
                  background: style === s ? 'rgba(201,168,76,0.08)' : 'transparent',
                  fontSize: 12,
                  borderBottom: '1px solid #2a2a2a',
                  transition: 'background 100ms',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = style === s ? 'rgba(201,168,76,0.08)' : 'transparent'; }}
              >
                {s}
              </div>
            ))}
            <div style={{ padding: '6px 8px', borderTop: '1px solid #333' }}>
              {!styleCustomMode ? (
                <div
                  onClick={() => setStyleCustomMode(true)}
                  style={{
                    color: '#808080', fontSize: 11, cursor: 'pointer', padding: '2px 0',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#b0b0b0'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#808080'; }}
                >
                  + 自定义风格
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    autoFocus
                    placeholder="输入自定义风格..."
                    value={styleCustomValue}
                    onChange={(e) => setStyleCustomValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleStyleCustomConfirm(); }}
                    style={{
                      flex: 1,
                      background: '#111',
                      border: '1px solid #444',
                      borderRadius: 4,
                      padding: '6px 8px',
                      color: '#e0e0e0',
                      fontSize: 12,
                      outline: 'none',
                      fontFamily: "'Inter', 'Segoe UI', sans-serif",
                    }}
                  />
                  <button
                    onClick={handleStyleCustomConfirm}
                    style={{
                      background: 'rgba(201,168,76,0.2)',
                      border: '1px solid rgba(201,168,76,0.3)',
                      borderRadius: 4,
                      color: '#c9a84c',
                      fontSize: 11,
                      padding: '4px 10px',
                      cursor: 'pointer',
                      fontFamily: "'Inter', 'Segoe UI', sans-serif",
                      whiteSpace: 'nowrap',
                    }}
                  >
                    确定
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ===== 风格展开描述 ===== */}
      {style && (
        <>
          <SectionTitle
            title="风格展开"
            extra={<span style={{ color: '#606060', fontSize: 10, marginLeft: 8 }}>（可根据需要修改）</span>}
          />
          <textarea
            placeholder="描述所选风格的具体特征..."
            style={{ ...pageStyles.input, minHeight: 64, resize: 'vertical', lineHeight: 1.5, padding: 10 }}
            value={styleDetails}
            onChange={(e) => handleStyleDetailsChange(e.target.value)}
          />
        </>
      )}

      {/* ===== 世界规则 ===== */}
      <SectionTitle title="世界规则" />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
        {WORLD_RULE_PRESETS.map((r) => {
          const isActive = worldRule === r;
          return (
            <div
              key={r}
              onClick={() => handleWorldRuleSelect(r)}
              style={{
                padding: '6px 14px',
                borderRadius: 16,
                background: isActive ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.04)',
                border: isActive ? '1px solid rgba(201,168,76,0.4)' : '1px solid #2a2a2a',
                color: isActive ? '#c9a84c' : '#b0b0b0',
                fontSize: 12,
                cursor: 'pointer',
                transition: 'all 100ms',
                userSelect: 'none',
              }}
              onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.borderColor = '#444'; }}
              onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.borderColor = '#2a2a2a'; }}
            >
              {r}
            </div>
          );
        })}
        {/* 自定义标签：如果 worldRule 不在预设中且不为空，显示自定义标签 */}
        {worldRule && !WORLD_RULE_PRESETS.includes(worldRule) && (
          <div
            style={{
              padding: '6px 14px',
              borderRadius: 16,
              background: 'rgba(201,168,76,0.15)',
              border: '1px solid rgba(201,168,76,0.4)',
              color: '#c9a84c',
              fontSize: 12,
              userSelect: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {worldRule}
            <span
              onClick={() => setVal('worldRule', '')}
              style={{ cursor: 'pointer', color: '#888', fontSize: 14, lineHeight: '12px' }}
              title="移除"
            >
              ×
            </span>
          </div>
        )}
        {!worldRuleCustomMode ? (
          <div
            onClick={() => setWorldRuleCustomMode(true)}
            style={{
              padding: '6px 14px',
              borderRadius: 16,
              border: '1px dashed #444',
              color: '#808080',
              fontSize: 12,
              cursor: 'pointer',
              userSelect: 'none',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#b0b0b0'; e.currentTarget.style.borderColor = '#666'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#808080'; e.currentTarget.style.borderColor = '#444'; }}
          >
            + 自定义
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input
              autoFocus
              placeholder="输入世界规则..."
              value={worldRuleCustomValue}
              onChange={(e) => setWorldRuleCustomValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleWorldRuleCustomConfirm(); }}
              style={{
                width: 140,
                background: '#111',
                border: '1px solid #444',
                borderRadius: 4,
                padding: '5px 8px',
                color: '#e0e0e0',
                fontSize: 12,
                outline: 'none',
                fontFamily: "'Inter', 'Segoe UI', sans-serif",
              }}
            />
            <button
              onClick={handleWorldRuleCustomConfirm}
              style={{
                background: 'rgba(201,168,76,0.2)',
                border: '1px solid rgba(201,168,76,0.3)',
                borderRadius: 4,
                color: '#c9a84c',
                fontSize: 11,
                padding: '4px 10px',
                cursor: 'pointer',
                fontFamily: "'Inter', 'Segoe UI', sans-serif",
              }}
            >
              确定
            </button>
          </div>
        )}
      </div>

      {/* ===== 规划字数（去掉下拉箭头） ===== */}
      <SectionTitle title="规划字数" />
      <div style={pageStyles.smallLabel}>每章规划字数区间</div>
      <input
        placeholder="例如：3000-5000字"
        style={pageStyles.input}
        value={chapterWordCount}
        onChange={(e) => setVal('chapterWordCount', e.target.value)}
      />

      <div style={{ height: 8 }} />

      <div style={pageStyles.smallLabel}>总字数</div>
      <div style={pageStyles.selectBox}>
        <input
          placeholder="请输入总字数..."
          style={{
            ...pageStyles.input,
            border: 'none',
            background: 'transparent',
            padding: 0,
            height: 'auto',
          }}
          value={totalWordCount}
          onChange={(e) => setVal('totalWordCount', e.target.value)}
        />
        <span style={pageStyles.unit}>字</span>
      </div>
    </div>
  );
}

function SectionTitle({
  title,
  extra,
}: {
  title: string;
  extra?: React.ReactNode;
}) {
  return (
    <div style={pageStyles.sectionTitle}>
      <span>{title}</span>
      {extra}
    </div>
  );
}
