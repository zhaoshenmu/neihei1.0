/**
 * ApiGeneralPanel.tsx
 *
 * 大模型API设置面板（兼容 OpenAI 格式）
 * 支持 DeepSeek、OpenAI 等兼容 OpenAI API 格式的大模型
 * 
 * ✅ 持久化：配置存入 localStorage（Key 加密存储）
 * ✅ 安全：API Key AES-GCM 加密，git 不会上传
 */
import React, { useState, useEffect } from 'react';
import { theme } from '@/theme/neihei-theme';
import { useApiConnectionStore } from '@/store/api-connection-store';
import { useApiSettingsStore } from '@/store/api-settings-store';

const ApiGeneralPanel: React.FC = () => {
  const [apiUrl, setApiUrl] = useState('https://api.deepseek.com');
  const [apiKey, setApiKey] = useState('');
  const [modelName, setModelName] = useState('deepseek-chat');
  const [showKey, setShowKey] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testResult, setTestResult] = useState<string>('');
  const [loaded, setLoaded] = useState(false);
  const setConnectionStatus = useApiConnectionStore((s) => s.setStatus);
  const { settings, updateApi, getPlainKey } = useApiSettingsStore();

  // 初始化：从持久化存储读取配置
  useEffect(() => {
    (async () => {
      const cfg = settings.generalApi;
      setApiUrl(cfg.url);
      setModelName(cfg.model);
      const key = await getPlainKey('generalApi');
      if (key) setApiKey(key);
      setLoaded(true);
    })();
  }, []);

  // 输入变化时自动保存到持久化存储
  // Key 被清空时立即保存（跳过防抖）并灭灯，防止旧 Key 残留
  useEffect(() => {
    if (!loaded) return;

    if (apiKey === '') {
      // Key 被清空 → 立即持久化 + 灭灯
      updateApi('generalApi', { url: apiUrl, model: modelName, plainKey: '' });
      setConnectionStatus('general-api', 'disconnected');
      return;
    }

    const timer = setTimeout(() => {
      updateApi('generalApi', { url: apiUrl, model: modelName, plainKey: apiKey });
    }, 500);
    return () => clearTimeout(timer);
  }, [apiUrl, apiKey, modelName, loaded]);

  const handleTest = async () => {
    if (!apiKey) {
      setTestResult('❌ 请先填写 API Key');
      setTestStatus('error');
      setConnectionStatus('general-api', 'disconnected');
      setTimeout(() => { setTestStatus((c) => c === 'error' ? 'idle' : c); }, 3000);
      return;
    }
    setTestStatus('testing');
    setTestResult('');
    setConnectionStatus('general-api', 'testing');

    try {
      const response = await fetch(`${apiUrl.replace(/\/$/, '')}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelName || 'deepseek-chat',
          messages: [{ role: 'user', content: 'Hi' }],
          max_tokens: 1,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const reply = data?.choices?.[0]?.message?.content || data?.choices?.[0]?.text || '';
        setTestResult(reply ? `✅ 已连接！返回: "${reply.slice(0, 30)}"` : '✅ 已连接！');
        setTestStatus('success');
        setConnectionStatus('general-api', 'connected');
      } else {
        const errData = await response.json().catch(() => null);
        setTestResult(`❌ 连接失败：${errData?.error?.message || response.status}`);
        setTestStatus('error');
        setConnectionStatus('general-api', 'disconnected');
      }
    } catch (err) {
      setTestResult('❌ 连接失败：无法访问服务器');
      setTestStatus('error');
      setConnectionStatus('general-api', 'disconnected');
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
          placeholder="https://api.deepseek.com"
        />
        <div style={{ color: theme.colors.textMuted, fontSize: 10, marginTop: 2 }}>
          兼容 OpenAI 格式，如 https://api.deepseek.com/v1
        </div>
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
          placeholder="deepseek-chat / gemma-2-2b-it"
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

export default ApiGeneralPanel;
