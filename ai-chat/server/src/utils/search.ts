import { config } from '../config';

export interface SearchResult { title: string; url: string; snippet: string; }

export async function searchWeb(query: string, provider?: string): Promise<SearchResult[]> {
  const p = provider || config.search.searchProvider;
  switch (p) {
    case 'serpapi': return searchSerpApi(query);
    case 'google': return searchGoogle(query);
    case 'bing': return searchBing(query);
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

async function searchBing(query: string): Promise<SearchResult[]> {
  if (!config.search.bingApiKey) throw new Error('Bing API key not configured. Set BING_API_KEY in .env');
  const params = new URLSearchParams({ q: query, count: String(config.search.maxResults), mkt: 'zh-CN' });
  const response = await fetch(`https://api.bing.microsoft.com/v7.0/search?${params}`, {
    headers: { 'Ocp-Apim-Subscription-Key': config.search.bingApiKey },
  });
  const data = await response.json() as any;
  if (data.error) throw new Error(`Bing error: ${data.error.message}`);
  return (data.webPages?.value || []).map((r: any) => ({ title: r.name || '', url: r.url || '', snippet: r.snippet || '' }));
}

async function searchDuckDuckGo(query: string): Promise<SearchResult[]> {
  // 使用 DuckDuckGo HTML 搜索（比 Instant Answer API 更可靠）
  const params = new URLSearchParams({ q: query, kl: 'cn-zh' });
  const response = await fetch(`https://html.duckduckgo.com/html/?${params}`, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
  });
  const html = await response.text();
  const results: SearchResult[] = [];

  // 解析搜索结果
  const resultRegex = /<a[^>]+class="result__a"[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>[\s\S]*?<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
  let match;
  while ((match = resultRegex.exec(html)) !== null && results.length < config.search.maxResults) {
    const url = match[1];
    const title = match[2].replace(/<[^>]+>/g, '').trim();
    const snippet = match[3].replace(/<[^>]+>/g, '').trim();
    if (title && url) {
      results.push({ title, url: url.startsWith('//') ? 'https:' + url : url, snippet });
    }
  }

  // 如果 HTML 解析失败，回退到 Instant Answer API
  if (results.length === 0) {
    try {
      const fallbackParams = new URLSearchParams({ q: query, format: 'json', no_html: '1', skip_disambig: '1' });
      const data = await (await fetch(`https://api.duckduckgo.com/?${fallbackParams}`)).json() as any;
      if (data.AbstractText) results.push({ title: data.Heading || query, url: data.AbstractURL || '', snippet: data.AbstractText });
      for (const t of (data.RelatedTopics || []).slice(0, config.search.maxResults - 1)) {
        if (t.Text && t.FirstURL) results.push({ title: t.Text.split(' - ')[0] || query, url: t.FirstURL, snippet: t.Text });
      }
    } catch {}
  }

  return results;
}

export function formatSearchResults(results: SearchResult[]): string {
  if (results.length === 0) return '(未找到相关搜索结果)';
  return results.map((r, i) => `[${i + 1}] ${r.title}\n    URL: ${r.url}\n    摘要: ${r.snippet}`).join('\n\n');
}
