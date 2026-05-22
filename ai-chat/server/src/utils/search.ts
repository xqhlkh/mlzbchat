import { config } from '../config';

export interface SearchResult { title: string; url: string; snippet: string; }

export async function searchWeb(query: string, provider?: string): Promise<SearchResult[]> {
  const p = provider || config.search.searchProvider;
  switch (p) {
    case 'serpapi': return searchSerpApi(query);
    case 'google': return searchGoogle(query);
    default: return searchDuckDuckGo(query);
  }
}

async function searchSerpApi(query: string): Promise<SearchResult[]> {
  if (!config.search.serpApiKey) throw new Error('SerpAPI key not configured');
  const params = new URLSearchParams({ q: query, api_key: config.search.serpApiKey, engine: 'google', num: String(config.search.maxResults) });
  const data = await (await fetch(`https://serpapi.com/search?${params}`)).json() as any;
  if (data.error) throw new Error(`SerpAPI error: ${data.error}`);
  return (data.organic_results || []).map((r: any) => ({ title: r.title || '', url: r.link || '', snippet: r.snippet || '' }));
}

async function searchGoogle(query: string): Promise<SearchResult[]> {
  if (!config.search.googleApiKey || !config.search.googleCx) throw new Error('Google Search not configured');
  const params = new URLSearchParams({ q: query, key: config.search.googleApiKey, cx: config.search.googleCx, num: String(config.search.maxResults) });
  const data = await (await fetch(`https://www.googleapis.com/customsearch/v1?${params}`)).json() as any;
  if (data.error) throw new Error(`Google error: ${data.error.message}`);
  return (data.items || []).map((i: any) => ({ title: i.title || '', url: i.link || '', snippet: i.snippet || '' }));
}

async function searchDuckDuckGo(query: string): Promise<SearchResult[]> {
  const params = new URLSearchParams({ q: query, format: 'json', no_html: '1', skip_disambig: '1' });
  const data = await (await fetch(`https://api.duckduckgo.com/?${params}`)).json() as any;
  const results: SearchResult[] = [];
  if (data.AbstractText) results.push({ title: data.Heading || query, url: data.AbstractURL || '', snippet: data.AbstractText });
  for (const t of (data.RelatedTopics || []).slice(0, config.search.maxResults - 1)) {
    if (t.Text && t.FirstURL) results.push({ title: t.Text.split(' - ')[0] || query, url: t.FirstURL, snippet: t.Text });
  }
  return results;
}

export function formatSearchResults(results: SearchResult[]): string {
  if (results.length === 0) return '(未找到相关搜索结果)';
  return results.map((r, i) => `[${i + 1}] ${r.title}\n    URL: ${r.url}\n    摘要: ${r.snippet}`).join('\n\n');
}
