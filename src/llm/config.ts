import { config } from 'dotenv';

config();

/** LLM（DeepSeek 等）相关环境变量；与机器人其余配置解耦。 */
export const LLM_CONFIG = {
  /** 配置 LLM_API_KEY 后，私聊中的非指令文本可走模型（见 message handler） */
  enabled: Boolean((process.env.LLM_API_KEY ?? '').trim()),
  apiKey: process.env.LLM_API_KEY ?? '',
  baseUrl: process.env.LLM_BASE_URL ?? 'https://api.deepseek.com',
  model: process.env.LLM_MODEL ?? 'deepseek-v4-flash',
  systemPrompt:
    process.env.LLM_SYSTEM_PROMPT ??
    '你是一个简洁、友好的中文助手，通过 QQ 私聊与用户对话。',
};
