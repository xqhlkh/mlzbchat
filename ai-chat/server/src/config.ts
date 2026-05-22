import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || '0.0.0.0',
  providers: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY || '',
      baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
      defaultModel: process.env.OPENAI_MODEL || 'gpt-4o',
    },
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY || '',
      baseURL: process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com',
      defaultModel: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
    },
  },
  search: {
    serpApiKey: process.env.SERPAPI_KEY || '',
    googleApiKey: process.env.GOOGLE_API_KEY || '',
    googleCx: process.env.GOOGLE_CX || '',
    bingApiKey: process.env.BING_API_KEY || '',
    searchProvider: (process.env.SEARCH_PROVIDER || 'duckduckgo') as 'serpapi' | 'google' | 'bing' | 'duckduckgo',
    maxResults: 5,
  },
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10),
    allowedTypes: [
      'text/plain', 'text/markdown', 'text/csv', 'application/pdf', 'application/json',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/png', 'image/jpeg', 'image/gif', 'image/webp',
    ],
  },
};
