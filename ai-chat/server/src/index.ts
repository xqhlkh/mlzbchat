import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { config } from './config';
import chatRoutes from './routes/chat';
import uploadRoutes from './routes/upload';

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/api', chatRoutes);
app.use('/api', uploadRoutes);

app.get('/api/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

const clientDistPath = path.join(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (_req, res) => res.sendFile(path.join(clientDistPath, 'index.html')));
  console.log(`[Server] Serving static files from: ${clientDistPath}`);
}

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Server Error]', err);
  res.status(500).json({ error: err.message || '服务器内部错误' });
});

app.listen(config.port, config.host, () => {
  console.log(`[Server] AI Chat Server running at http://${config.host}:${config.port}`);
  console.log(`[Server] Providers: OpenAI (${config.providers.openai.apiKey ? 'yes' : 'no'}), Anthropic (${config.providers.anthropic.apiKey ? 'yes' : 'no'})`);
  console.log(`[Server] Search: ${config.search.searchProvider}`);
});
