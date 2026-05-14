/**
 * 服务层 - 接口定义
 *
 * 所有外部服务（LLM API、后端代理等）的接口定义集中在此处。
 * 具体实现在子目录中按服务划分。
 *
 * ⚠️ 安全原则：API 密钥永远不应在前端代码中硬编码。
 * 所有 LLM 调用应通过后端代理转发，或至少通过环境变量注入。
 * 当前阶段仅定义接口契约，具体实现方案后续决定。
 */

/** LLM 提供商枚举 */
export type LLMProvider = 'openai' | 'claude' | 'lm-studio' | 'custom';

/** LLM 请求配置 */
export interface LLMRequestConfig {
  /** 模型名称，如 'gpt-4o', 'claude-3-opus' */
  model: string;
  /** 温度，0-2，默认 0.7 */
  temperature?: number;
  /** 最大输出 token 数 */
  maxTokens?: number;
  /** 系统提示词 */
  systemPrompt?: string;
}

/** LLM 请求消息 */
export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/** LLM 请求 */
export interface LLMRequest {
  messages: LLMMessage[];
  config: LLMRequestConfig;
}

/** LLM 响应 */
export interface LLMResponse {
  content: string;
  /** 原始响应元数据（tokens 消耗等） */
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  /** 模型名称 */
  model: string;
}

/** LLM 适配器接口 */
export interface LLMAdapter {
  readonly provider: LLMProvider;
  /** 流式生成 */
  stream?(request: LLMRequest): AsyncIterable<string>;
  /** 非流式生成 */
  generate(request: LLMRequest): Promise<LLMResponse>;
  /** 检查服务是否可用 */
  healthCheck(): Promise<boolean>;
}

/** 服务层错误 */
export class ServiceError extends Error {
  constructor(
    message: string,
    public readonly provider: LLMProvider,
    public readonly statusCode?: number,
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

/**
 * 创建默认 LLM 请求配置
 */
export function createDefaultConfig(provider: LLMProvider): LLMRequestConfig {
  switch (provider) {
    case 'openai':
      return { model: 'gpt-4o', temperature: 0.7, maxTokens: 4096 };
    case 'claude':
      return { model: 'claude-3-opus', temperature: 0.7, maxTokens: 4096 };
    case 'lm-studio':
      return { model: 'local-model', temperature: 0.7, maxTokens: 2048 };
    case 'custom':
      return { model: 'custom-model', temperature: 0.7, maxTokens: 4096 };
  }
}
