import Anthropic from '@anthropic-ai/sdk';
import type { ChatMessage } from './openai';

export async function* streamAnthropic(
  messages: ChatMessage[],
  options: {
    apiKey: string;
    baseURL: string;
    model: string;
    temperature?: number;
    maxTokens?: number;
  }
): AsyncGenerator<string> {
  const client = new Anthropic({
    apiKey: options.apiKey,
    baseURL: options.baseURL,
  });

  const systemMessages = messages.filter(m => m.role === 'system').map(m => ({
    type: 'text' as const,
    text: m.content,
  }));
  const systemPrompt = systemMessages.length > 0 ? systemMessages : undefined;

  const conversationMessages = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? 'assistant' as const : 'user' as const,
      content: m.content,
    }));

  const stream = client.messages.stream({
    model: options.model,
    max_tokens: options.maxTokens ?? 4096,
    temperature: options.temperature ?? 0.7,
    system: systemPrompt,
    messages: conversationMessages,
  });

  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      yield event.delta.text;
    }
  }
}

export async function chatAnthropic(
  messages: ChatMessage[],
  options: {
    apiKey: string;
    baseURL: string;
    model: string;
    temperature?: number;
    maxTokens?: number;
  }
): Promise<string> {
  const client = new Anthropic({
    apiKey: options.apiKey,
    baseURL: options.baseURL,
  });

  const systemMessages = messages.filter(m => m.role === 'system').map(m => ({
    type: 'text' as const,
    text: m.content,
  }));
  const systemPrompt = systemMessages.length > 0 ? systemMessages : undefined;

  const conversationMessages = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? 'assistant' as const : 'user' as const,
      content: m.content,
    }));

  const response = await client.messages.create({
    model: options.model,
    max_tokens: options.maxTokens ?? 4096,
    temperature: options.temperature ?? 0.7,
    system: systemPrompt,
    messages: conversationMessages,
  });

  const textBlock = response.content.find(block => block.type === 'text');
  return textBlock?.text || '';
}
