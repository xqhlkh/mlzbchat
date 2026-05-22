import OpenAI from 'openai';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function* streamOpenAI(
  messages: ChatMessage[],
  options: { apiKey: string; baseURL: string; model: string; temperature?: number; maxTokens?: number }
): AsyncGenerator<string> {
  const client = new OpenAI({ apiKey: options.apiKey, baseURL: options.baseURL });
  const stream = await client.chat.completions.create({
    model: options.model, messages,
    temperature: options.temperature ?? 0.7, max_tokens: options.maxTokens ?? 4096, stream: true,
  });
  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) yield content;
  }
}

export async function chatOpenAI(
  messages: ChatMessage[],
  options: { apiKey: string; baseURL: string; model: string; temperature?: number; maxTokens?: number }
): Promise<string> {
  const client = new OpenAI({ apiKey: options.apiKey, baseURL: options.baseURL });
  const response = await client.chat.completions.create({
    model: options.model, messages,
    temperature: options.temperature ?? 0.7, max_tokens: options.maxTokens ?? 4096,
  });
  return response.choices[0]?.message?.content || '';
}
