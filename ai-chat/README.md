# AI Chat - 自建 AI 聊天网站

类似 ChatGPT 的全栈 AI 聊天应用，支持多人访问、多 API 切换、联网搜索和文件上传。

## 功能

- 多 API：OpenAI 兼容接口（DeepSeek、通义千问等）+ Anthropic Claude
- 流式输出（SSE）
- 联网搜索：DuckDuckGo（免费）/ SerpAPI / Google
- 文件上传：图片粘贴 + 文档上传
- 多会话管理
- Markdown 渲染 + 代码高亮
- 深色主题

## 快速开始

```bash
npm run install:all
cp server/.env.example server/.env   # 填入 API Key
npm run dev
```

前端 http://localhost:5173 | 后端 http://localhost:3000/api

## 部署到 Oracle Linux

```bash
git clone https://github.com/xghlkh/mlzb-chat.git ai-chat
cd ai-chat
chmod +x deploy-oracle.sh
./deploy-oracle.sh
```

别忘了在 Oracle Cloud 控制台安全列表中开放 TCP 3000 端口。

## Docker 部署

```bash
docker compose up -d
```

## 配置 API

编辑 `server/.env` 或打开网站后点右上角齿轮图标在浏览器中配置。

支持：OpenAI、DeepSeek、通义千问、智谱 GLM、Moonshot 等任何 OpenAI 兼容接口。

## 项目结构

```
ai-chat/
├── client/src/              # React 前端
│   ├── App.tsx              # 主应用
│   ├── components/          # UI 组件
│   └── styles/              # CSS 样式
├── server/src/              # Node.js 后端
│   ├── providers/           # AI 提供商适配
│   ├── routes/              # API 路由
│   └── utils/               # 搜索/会话/文件处理
├── deploy-oracle.sh         # Oracle Linux 部署脚本
├── Dockerfile               # Docker 构建
└── docker-compose.yml       # Docker Compose
```
