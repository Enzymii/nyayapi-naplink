import OpenAI from 'openai';

import { CONFIG } from '../utils/config.js';

const openai = new OpenAI({
  baseURL: CONFIG.llm.baseUrl,
  apiKey: CONFIG.llm.apiKey,
});

/**
 * 使用 DeepSeek OpenAI 兼容接口做一次对话（示例：单轮 user 消息）。
 * 调用方式与 connect-test 一致：`post('/chat/completions', { body })`。
 * 文档：https://api-docs.deepseek.com/zh-cn/
 */
export async function chatDeepSeek(userMessage: string): Promise<string> {
  const { model, systemPrompt } = CONFIG.llm;

  const completion = (await openai.post('/chat/completions', {
    body: {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      model,
      stream: false,
      thinking: { type: 'disabled' },
    },
    timeout: 30_000,
  })) as OpenAI.Chat.Completions.ChatCompletion;

  const raw = completion.choices[0]?.message?.content;
  const text = typeof raw === 'string' ? raw.trim() : '';
  return text || '（模型未返回文本）';
}
