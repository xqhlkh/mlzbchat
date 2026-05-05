export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  files?: UploadedFile[];
}

export interface UploadedFile {
  name: string;
  size: number;
  mimeType: string;
  content: string;
  isImage: boolean;
  imageBase64?: string;
}

export interface Conversation {
  id: string;
  title: string;
  sessionId: string;
  createdAt: number;
  updatedAt: number;
}

export type Provider = 'openai' | 'anthropic';

export interface ProviderConfig {
  provider: Provider;
  apiKey: string;
  baseURL: string;
  model: string;
}

export interface AppSettings {
  provider: Provider;
  apiKey: string;
  baseURL: string;
  model: string;
  enableSearch: boolean;
  searchProvider: string;
  systemPrompt: string;
}

export interface StreamChunk {
  token?: string;
  done?: boolean;
  sessionId?: string;
  error?: string;
}
