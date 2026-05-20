/**
 * ApiImagePanel.tsx
 *
 * 文生图 API 设置面板（兼容 OpenAI 图片生成格式）
 * 支持 DALL-E、Stable Diffusion 等
 *
 * ✅ 持久化：配置存入 localStorage（Key 加密存储）
 * ✅ 安全：API Key AES-GCM 加密，git 不会上传
 */
import React, { useState, useEffect } from 'react';
import { theme } from '@/theme/neihei-theme';
import { useApiConnectionStore } from '@/store/api-connection-store';
import { useApiSettingsStore } from '@/store/api-settings-store';

export default function ApiImagePanel() {
  const [apiUrl, setApiUrl] = useState('');
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
      const cfg = settings.imageApi;
      setApiUrl(cfg.url);
      setModelName(cfg.model);
      const key = await getPlainKey('imageApi');
      if (key) setApiKey(key);
      setLoaded(true);
    })();
  }, []);

  // 输入变化时自动保存到持久化存储（防抖：500ms）
  useEffect(() => {
    if (!loaded) return;
    const timer = setTimeout(() => {
      updateApi('imageApi', { url: apiUrl, model: modelName, plainKey: apiKey });
    }, 500);
    return () => clearTimeout(timer);
  }, [apiUrl, apiKey, modelName, loaded]);

  const handleTest = async () => {
    setTestStatus('testing');
    setTestResult('');
    setConnectionStatus('image-api', 'testing');

    try {
      // 简单测试连接（请求根地址）
      const url = apiUrl.replace(/\/$/, '');
      const response = await fetch(url, { method: 'GET' });
      if (response.ok || response.status >= 200) {
        setTestResult('✅ 已连接！');
        setTestStatus('success');
        setConnectionStatus('image-api', 'connected');
      } else {
        setTestResult('❌ 连接失败：服务器未响应');
        setTestStatus('error');
        setConnectionStatus('image-api', 'disconnected');
      }
    } catch (err) {
      setTestResult('❌ 连接失败：无法访问服务器');
      setTestStatus('error');
      setConnectionStatus('image-api', 'disconnected');
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
      {/* API地址 */}
      <div style={{ marginBottom: 10 }}>
        <label style={labelStyle}>API 地址</label>
        <input
          type="text"
          value={apiUrl}
          onChange={(e) => setApiUrl(e.target.value)}
          style={inputStyle}
          placeholder="https://api.openai.com/v1/images/generations"
        />
      </div>

      {/* API Key */}
      <div style={{ marginBottom: 10 }}>
        <label style={labelStyle}>API Key</label>
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            type={showKey ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            style={{ ...inputStyle, flex: 1 }}
            placeholder="sk-..."
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
          placeholder="dall-e-3 / stable-diffusion"
        />
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
