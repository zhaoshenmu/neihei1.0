/**
 * ai-service.ts
 *
 * AI 大模型调用服务
 * 兼容 OpenAI / DeepSeek / LM Studio API 格式
 * 从 api-settings-store 读取选中的 API 配置
 */
import { useApiSettingsStore } from '@/store/api-settings-store';
import { useApiConnectionStore, type ApiId } from '@/store/api-connection-store';

/** AI 调用响应 */
export interface AiResponse {
  success: boolean;
  content: string;
  error?: string;
  apiId?: string; // 实际使用的 API ID
}

/** AI 流式回调 */
export interface AiStreamCallbacks {
  onChunk: (text: string) => void;     // 每收到一段文本就调用
  onDone: (fullText: string) => void;  // 流结束
  onError: (err: string) => void;      // 出错
}

/** ApiId 到 api-settings-store key 的映射 */
const API_ID_TO_KEY: Record<ApiId, keyof import('@/store/api-settings-store').ApiSettings> = {
  'general-api': 'generalApi',
  'local-api': 'localApi',
  'image-api': 'imageApi',
};

/**
 * 获取可用的 API 配置（自动检测第一个有效的配置）
 * 优先使用 selectedApi，如果没用则按 local → general → image 顺序查找
 * 有效性判定：
 *   - URL 为必须
 *   - 对 local-api 不要求 Key（本地 LM Studio 无需认证）
 *   - 其他 API 要求有 Key
 */
async function getActiveApiConfig() {
  const selectedId: ApiId = useApiConnectionStore.getState().selectedApi;
  const allApiIds: ApiId[] = ['local-api', 'general-api', 'image-api'];
  const settings = useApiSettingsStore.getState().settings;

  // 优先尝试 selectedApi
  const tryIds = [selectedId, ...allApiIds.filter(id => id !== selectedId)];

  for (const apiId of tryIds) {
    const storeKey = API_ID_TO_KEY[apiId];
    const targetCfg = settings[storeKey];
    if (!targetCfg.url) continue;

    // 本地 API 不需要 Key，其他需要 Key
    const key = await useApiSettingsStore.getState().getPlainKey(storeKey);
    if (apiId === 'local-api') {
      // 本地 API 只要有 URL 就算有效
      return { apiId, url: targetCfg.url, key, model: targetCfg.model };
    }
    if (key) {
      return { apiId, url: targetCfg.url, key, model: targetCfg.model };
    }
  }

  // 全都没有 → 返回 selectedApi 的配置（让外层知道什么缺失）
  const fallbackKey = API_ID_TO_KEY[selectedId];
  const fallbackCfg = settings[fallbackKey];
  const fallbackDecrypted = await useApiSettingsStore.getState().getPlainKey(fallbackKey);
  return { apiId: selectedId, url: fallbackCfg.url, key: fallbackDecrypted, model: fallbackCfg.model };
}

/**
 * 调用 AI 大模型（非流式）
 * @param messages 消息列表，如 [{ role: 'user', content: '你好' }]
 * @returns AI 回复内容
 */
export async function callAi(
  messages: { role: string; content: string }[]
): Promise<AiResponse> {
  try {
    const config = await getActiveApiConfig();

    if (!config.url) {
      return { success: false, content: '', error: 'API URL 未配置', apiId: config.apiId };
    }
    if (!config.key && config.apiId !== 'local-api') {
      return { success: false, content: '', error: 'API Key 未配置', apiId: config.apiId };
    }

    // 构建 OpenAI 兼容请求体
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (config.key) {
      headers['Authorization'] = `Bearer ${config.key}`;
    }

    // 模型参数：本地 API 可能用默认模型（不传 model）
    const body: Record<string, unknown> = {
      messages,
      temperature: 0.7,
      max_tokens: 8192,
      stream: false,
    };
    if (config.model) {
      body.model = config.model;
    }

    // 本地 API 走 Vite 代理（解决 CORS 问题）
    const apiUrl = config.apiId === 'local-api'
      ? `/api/lmstudio/v1/chat/completions`
      : `${config.url}/v1/chat/completions`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '未知错误');
      return {
        success: false,
        content: '',
        error: `API 请求失败 (${response.status}): ${errorText}`,
        apiId: config.apiId,
      };
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content || '';

    return { success: true, content, apiId: config.apiId };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { success: false, content: '', error: `AI 调用异常: ${errorMsg}`, apiId: 'unknown' };
  }
}

/**
 * 调用 AI 大模型（流式）
 * 逐块接收文本，通过 callbacks 实时回调
 *
 * @param messages 消息列表
 * @param callbacks 回调对象：onChunk(增量文本) / onDone(完整文本) / onError(错误信息)
 */
export async function callAiStream(
  messages: { role: string; content: string }[],
  callbacks: AiStreamCallbacks
): Promise<void> {
  const config = await getActiveApiConfig();

  if (!config.url) {
    callbacks.onError('API URL 未配置');
    return;
  }
  if (!config.key && config.apiId !== 'local-api') {
    callbacks.onError('API Key 未配置');
    return;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (config.key) {
    headers['Authorization'] = `Bearer ${config.key}`;
  }

  const body: Record<string, unknown> = {
    messages,
    temperature: 0.7,
    max_tokens: 8192,
    stream: true,
  };
  if (config.model) {
    body.model = config.model;
  }

  const apiUrl = config.apiId === 'local-api'
    ? `/api/lmstudio/v1/chat/completions`
    : `${config.url}/v1/chat/completions`;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '未知错误');
      callbacks.onError(`API 请求失败 (${response.status}): ${errorText}`);
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      callbacks.onError('响应体不可读（无 ReadableStream）');
      return;
    }

    const decoder = new TextDecoder();
    let fullText = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      // 解码收到的字节块
      buffer += decoder.decode(value, { stream: true });

      // 按行分割（SSE 格式：data: {...}\n\n）
      const lines = buffer.split('\n');
      // 最后一行可能不完整，保留到下次
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data:')) continue;

        const data = trimmed.slice(5).trim();
        if (data === '[DONE]') continue;

        try {
          const parsed = JSON.parse(data);
          const delta = parsed?.choices?.[0]?.delta?.content;
          if (delta) {
            fullText += delta;
            callbacks.onChunk(delta);
          }
        } catch {
          // 忽略解析异常行（可能是非 JSON 标记）
        }
      }
    }

    callbacks.onDone(fullText);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    callbacks.onError(`AI 流式调用异常: ${errorMsg}`);
  }
}
