import { config } from '../config';

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export async function searchWeb(query: string, provider?: string): Promise<SearchResult[]> {
  const searchProvider = provider || config.search.searchProvider;

  switch (searchProvider) {
    case 'serpapi':
      return searchSerpApi(query);
    case 'google':
      return searchGoogle(query);
    case 'duckduckgo':
      return searchDuckDuckGo(query);
    default:
      return searchDuckDuckGo(query);
  }
}

async function searchSerpApi(query: string): Promise<SearchResult[]> {
  if (!config.search.serpApiKey) {
    throw new Error('SerpAPI key not configured. Set SERPAPI_KEY in .env or configure a different search provider.');
  }

  const params = new URLSearchParams({
    q: query,
    api_key: config.search.serpApiKey,
    engine: 'google',
    num: String(config.search.maxResults),
  });

  const response = await fetch(`https://serpapi.com/search?${params}`);
  const data = await response.json() as any;

  if (data.error) {
    throw new Error(`SerpAPI error: ${data.error}`);
  }

  return (data.organic_results || []).map((r: any) => ({
    title: r.title || '',
    url: r.link || '',
    snippet: r.snippet || '',
  }));
}

async function searchGoogle(query: string): Promise<SearchResult[]> {
  if (!config.search.googleApiKey || !config.search.googleCx) {
    throw new Error('Google Custom Search not configured. Set GOOGLE_API_KEY and GOOGLE_CX in .env.');
  }

  const params = new URLSearchParams({
    q: query,
    key: config.search.googleApiKey,
    cx: config.search.googleCx,
    num: String(config.search.maxResults),
  });

  const response = await fetch(`https://www.googleapis.com/customsearch/v1?${params}`);
  const data = await response.json() as any;

  if (data.error) {
    throw new Error(`Google Search error: ${data.error.message}`);
  }

  return (data.items || []).map((item: any) => ({
    title: item.title || '',
    url: item.link || '',
    snippet: item.snippet || '',
  }));
}

async function searchDuckDuckGo(query: string): Promise<SearchResult[]> {
  const params = new URLSearchParams({
    q: query,
    format: 'json',
    no_html: '1',
    skip_disambig: '1',
  });

  const response = await fetch(`https://api.duckduckgo.com/?${params}`);
  const data = await response.json() as any;

  const results: SearchResult[] = [];

  if (data.AbstractText) {
    results.push({
      title: data.Heading || query,
      url: data.AbstractURL || '',
      snippet: data.AbstractText,
    });
  }

  const topics = data.RelatedTopics || [];
  for (const topic of topics.slice(0, config.search.maxResults - 1)) {
    if (topic.Text && topic.FirstURL) {
      results.push({
        title: topic.Text.split(' - ')[0] || query,
        url: topic.FirstURL,
        snippet: topic.Text,
      });
    }
  }

  return results;
}

export function formatSearchResults(results: SearchResult[]): string {
  if (results.length === 0) {
    return '(未找到相关搜索结果)';
  }

  return results
    .map((r, i) => `[${i + 1}] ${r.title}\n    URL: ${r.url}\n    摘要: ${r.snippet}`)
    .join('\n\n');
}
