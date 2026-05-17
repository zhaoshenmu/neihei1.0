/**
 * ApiLocalPanel.tsx
 *
 * 本地LM Studio大模型软件API调用设置
 * 兼容 OpenAI 格式，用于连接本地运行的 LM Studio 服务
 *
 * ✅ 持久化：配置存入 localStorage（Key 加密存储）
 * ✅ 安全：API Key AES-GCM 加密，git 不会上传
 */
import React, { useState, useEffect } from 'react';
import { theme } from '@/theme/neihei-theme';
import { useApiConnectionStore } from '@/store/api-connection-store';
import { useApiSettingsStore } from '@/store/api-settings-store';

const ApiLocalPanel: React.FC = () => {
  const [localUrl, setLocalUrl] = useState('http://localhost:1234');
  const [apiKey, setApiKey] = useState('');
  const [modelName, setModelName] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testResult, setTestResult] = useState<string>('');
  const [loaded, setLoaded] = useState(false);
  const setConnectionStatus = useApiConnectionStore((s) => s.setStatus);
  const { settings, updateApi, getPlainKey } = useApiSettingsStore();

  // 初始化：从持久化存储读取配置
  useEffect(() => {
    (async () => {
      const cfg = settings.localApi;
      setLocalUrl(cfg.url);
      setModelName(cfg.model);
      const key = await getPlainKey('localApi');
      if (key) setApiKey(key);
      setLoaded(true);
    })();
  }, []);

  // 输入变化时自动保存到持久化存储（防抖：500ms）
  useEffect(() => {
    if (!loaded) return;
    const timer = setTimeout(() => {
      updateApi('localApi', { url: localUrl, model: modelName, plainKey: apiKey });
    }, 500);
    return () => clearTimeout(timer);
  }, [localUrl, apiKey, modelName, loaded]);

  const handleTest = async () => {
    setTestStatus('testing');
    setTestResult('');
    setConnectionStatus('local-api', 'testing');

    try {
      // 通过 Vite 代理请求 LM Studio（避免 CORS 问题）
      const response = await fetch('/api/lmstudio/v1/models', { method: 'GET' });

      if (response.ok) {
        const data = await response.json();
        const models = data?.data || [];
        const modelNames = models
          .map((m: any) => m.id || m.name || '')
          .filter(Boolean)
          .join(', ');
        setTestResult(modelNames ? `✅ 已连接！可用模型: ${modelNames}` : '✅ 已连接！');
        setTestStatus('success');
        setConnectionStatus('local-api', 'connected');
      } else {
        setTestResult('❌ 连接失败：服务器未响应');
        setTestStatus('error');
        setConnectionStatus('local-api', 'disconnected');
      }
    } catch (err) {
      console.warn('LM Studio 连接失败:', err);
      setTestResult('❌ 连接失败：无法访问服务器');
      setTestStatus('error');
      setConnectionStatus('local-api', 'disconnected');
    }

    setTimeout(() => {
      setTestStatus((current) => current === 'success' ? 'success' : 'idle');
    }, 3000);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '7px 10px',
    background: '#1a1a1a',
    border: `1px solid ${theme.colors.inputBorder}`,
    borderRadius: 5,
    color: theme.colors.textPrimary,
    fontSize: 12,
    outline: 'none',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    color: theme.colors.textSecondary,
    fontSize: 11,
    marginBottom: 4,
    fontWeight: 500,
  };

  return (
    <div style={{ padding: '10px 12px', overflow: 'auto' }}>
      {/* 本地服务地址 */}
      <div style={{ marginBottom: 10 }}>
        <label style={labelStyle}>本地服务地址</label>
        <input
          type="text"
          value={localUrl}
          onChange={(e) => setLocalUrl(e.target.value)}
          style={inputStyle}
          placeholder="http://localhost:1234"
        />
        <div style={{ color: theme.colors.textMuted, fontSize: 10, marginTop: 2 }}>
          LM Studio 默认端口 1234，兼容 OpenAI 格式
        </div>
      </div>

      {/* API Key（可选） */}
      <div style={{ marginBottom: 10 }}>
        <label style={labelStyle}>API Key（可选）</label>
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            type={showKey ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            style={{ ...inputStyle, flex: 1 }}
            placeholder="如有需要请填写"
          />
          <button
            onClick={() => setShowKey(!showKey)}
            style={{
              background: '#1a1a1a',
              border: `1px solid ${theme.colors.inputBorder}`,
              borderRadius: 5,
              color: theme.colors.textMuted,
              padding: '0 10px',
              cursor: 'pointer',
              fontSize: 11,
              whiteSpace: 'nowrap',
            }}
          >
            {showKey ? '隐藏' : '显示'}
          </button>
        </div>
      </div>

      {/* 模型名称 */}
      <div style={{ marginBottom: 10 }}>
        <label style={labelStyle}>模型名称</label>
        <input
          type="text"
          value={modelName}
          onChange={(e) => setModelName(e.target.value)}
          style={inputStyle}
          placeholder="例如: llama-3.2-3b-instruct"
        />
        <div style={{ color: theme.colors.textMuted, fontSize: 10, marginTop: 2 }}>
          请填写 LM Studio 中加载的模型名称
        </div>
      </div>

      {/* 测试连接 */}
      <button
        onClick={handleTest}
        disabled={testStatus === 'testing'}
        style={{
          width: '100%',
          padding: '8px 0',
          background: testStatus === 'success' ? '#1b3d1b' : testStatus === 'error' ? '#3d1b1b' : '#1a1a1a',
          border: `1px solid ${
            testStatus === 'success' ? theme.colors.success :
            testStatus === 'error' ? theme.colors.error :
            theme.colors.inputBorder
          }`,
          borderRadius: 5,
          color: testStatus === 'success' ? theme.colors.success :
                 testStatus === 'error' ? theme.colors.error :
                 theme.colors.textSecondary,
          fontSize: 12,
          cursor: testStatus === 'testing' ? 'wait' : 'pointer',
          transition: 'all 150ms ease',
        }}
      >
        {testStatus === 'testing' ? '⏳ 测试中...' :
         testStatus === 'success' ? '✅ 连接成功' :
         testStatus === 'error' ? '❌ 连接失败' :
         '🔗 测试连接'}
      </button>

      {/* 测试结果详情 */}
      {testResult && (
        <div
          style={{
            marginTop: 8,
            padding: '6px 10px',
            background: testStatus === 'success' ? 'rgba(76,175,80,0.08)' : 'rgba(224,96,96,0.08)',
            border: `1px solid ${testStatus === 'success' ? theme.colors.success : theme.colors.error}`,
            borderRadius: 5,
            color: testStatus === 'success' ? theme.colors.success : theme.colors.error,
            fontSize: 11,
            lineHeight: 1.5,
            wordBreak: 'break-all',
          }}
        >
          {testResult}
        </div>
      )}
    </div>
  );
};

export default ApiLocalPanel;
