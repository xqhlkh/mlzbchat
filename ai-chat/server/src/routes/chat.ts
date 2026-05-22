import { Router, Request, Response } from 'express';
import { streamOpenAI, ChatMessage } from '../providers/openai';
import { streamAnthropic } from '../providers/anthropic';
import { searchWeb, formatSearchResults } from '../utils/search';
import { createSession, addMessage, getMessages } from '../utils/session';
import { config } from '../config';

const router = Router();

router.post('/session', (_req: Request, res: Response) => {
  res.json({ sessionId: createSession() });
});

router.get('/session/:id/messages', (req: Request, res: Response) => {
  res.json({ messages: getMessages(req.params.id) });
});

router.delete('/session/:id/messages', (req: Request, res: Response) => {
  res.json({ success: true });
});

router.post('/completions', async (req: Request, res: Response) => {
  try {
    const { message, sessionId, provider, apiKey, baseURL, model, enableSearch, searchProvider, fileContents, systemPrompt } = req.body;

    if (!message && (!fileContents || fileContents.length === 0)) {
      return res.status(400).json({ error: '消息内容不能为空' });
    }

    let currentSessionId = sessionId;
    if (!currentSessionId || !getMessages(currentSessionId)) {
      currentSessionId = createSession();
    }

    const selectedProvider = provider || 'openai';
    const pc = config.providers[selectedProvider as keyof typeof config.providers];
    const providerApiKey = apiKey || pc?.apiKey;
    const providerBaseURL = baseURL || pc?.baseURL;
    const providerModel = model || pc?.defaultModel;

    if (!providerApiKey) {
      return res.status(400).json({ error: `请在设置中配置 ${selectedProvider.toUpperCase()} API Key` });
    }

    let userContent = message || '';

    if (fileContents && fileContents.length > 0) {
      const ft = fileContents.map((f: { name: string; content: string }) => `[上传文件: ${f.name}]\n${f.content}`).join('\n\n---\n\n');
      userContent = `以下是用户上传的文件内容：\n\n${ft}\n\n---\n\n用户消息：${userContent}`;
    }

    if (enableSearch) {
      try {
        const sr = await searchWeb(message, searchProvider);
        userContent = `以下是联网搜索结果：\n\n${formatSearchResults(sr)}\n\n---\n\n用户问题：${userContent}`;
      } catch (err: any) { userContent = `(联网搜索失败: ${err.message}) ${userContent}`; }
    }

    addMessage(currentSessionId, { role: 'user', content: userContent });
    const history = getMessages(currentSessionId);

    const messages: ChatMessage[] = [];
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
    messages.push(...history);

    res.writeHead(200, {
      'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache',
      'Connection': 'keep-alive', 'X-Accel-Buffering': 'no', 'X-Session-Id': currentSessionId,
    });

    let fullResponse = '';
    try {
      const streamFn = selectedProvider === 'anthropic' ? streamAnthropic : streamOpenAI;
      const stream = streamFn(messages, { apiKey: providerApiKey, baseURL: providerBaseURL, model: providerModel });
      for await (const token of stream) {
        fullResponse += token;
        res.write(`data: ${JSON.stringify({ token, sessionId: currentSessionId })}\n\n`);
      }
      addMessage(currentSessionId, { role: 'assistant', content: fullResponse });
      res.write(`data: ${JSON.stringify({ done: true, sessionId: currentSessionId })}\n\n`);
    } catch (err: any) {
      res.write(`data: ${JSON.stringify({ error: err.message || 'AI 服务请求失败' })}\n\n`);
    }
    res.end();
  } catch (err: any) {
    if (!res.headersSent) res.status(500).json({ error: err.message || '服务器内部错误' });
    else { res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`); res.end(); }
  }
});

export default router;
