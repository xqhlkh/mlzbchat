# AI Chat - 自建 AI 聊天网站

一个类似 ChatGPT 的全栈 AI 聊天应用，支持多人访问、多 API 切换、联网搜索和文件上传。

## 功能特性

- 多 API 支持：OpenAI 兼容接口（含 DeepSeek、通义千问等）+ Anthropic Claude
- 流式输出：逐字显示 AI 回复（SSE）
- 联网搜索：支持 DuckDuckGo（免费）/ SerpAPI / Google Custom Search
- 文件上传：支持图片（粘贴上传）和文档（txt/pdf/docx/xlsx 等）
- 多会话管理：每个用户独立会话，切换对话不丢失
- Markdown 渲染：代码高亮、表格、引用块
- 深色主题：现代化 UI 设计
- Oracle Linux 部署：一键部署脚本 + systemd 服务 + Docker

## 技术栈

前端：React 18 + TypeScript + Vite
后端：Node.js + Express + TypeScript
部署：Docker / systemd

## 快速开始

### 本地开发

```bash
npm run install:all
cp server/.env.example server/.env
# 编辑 server/.env 填入你的 API Key
npm run dev
```

前端访问: http://localhost:5173
后端 API: http://localhost:3000/api

### Oracle Linux 部署

```bash
scp -r ai-chat user@your-server-ip:/home/user/
ssh user@your-server-ip
cd /home/user/ai-chat
chmod +x deploy-oracle.sh
./deploy-oracle.sh
```

重要：在 Oracle Cloud 控制台的「安全列表」中开放 TCP 3000 端口。

### Docker 部署

```bash
docker compose up -d
docker compose logs -f
```

## 配置 API

### 方式一：环境变量（服务端，所有人共用）

编辑 server/.env:

```
OPENAI_API_KEY=sk-your-key
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o
ANTHROPIC_API_KEY=sk-ant-your-key
SEARCH_PROVIDER=duckduckgo
```

### 方式二：浏览器设置（每人自己的 Key）

打开网站后，点击右上角齿轮图标，直接在浏览器中填入你的 API Key。Key 存在浏览器本地，通过后端代理发送请求。

## 支持的 API 提供商

| 提供商 | Base URL 示例 |
|--------|-------------|
| OpenAI | https://api.openai.com/v1 |
| DeepSeek | https://api.deepseek.com/v1 |
| 通义千问 | https://dashscope.aliyuncs.com/compatible-mode/v1 |
| 智谱 GLM | https://open.bigmodel.cn/api/paas/v4 |
| Moonshot | https://api.moonshot.cn/v1 |
| 其他兼容接口 | 自定义 |

## 项目结构

```
ai-chat/
├── client/                 # React 前端
│   └── src/
│       ├── components/     # UI 组件
│       │   ├── InputArea.tsx      # 输入框 + 文件上传 + 搜索开关
│       │   ├── MessageList.tsx    # 消息列表 + Markdown 渲染
│       │   ├── SettingsPanel.tsx  # API 配置面板
│       │   └── Sidebar.tsx        # 对话历史侧边栏
│       ├── types/          # TypeScript 类型定义
│       └── styles/         # CSS 样式
├── server/                 # Node.js 后端
│   └── src/
│       ├── providers/      # AI 提供商适配
│       │   ├── openai.ts   # OpenAI 兼容接口
│       │   └── anthropic.ts # Anthropic Claude
│       ├── routes/         # API 路由
│       │   ├── chat.ts     # 聊天接口 (SSE)
│       │   └── upload.ts   # 文件上传
│       ├── utils/          # 工具函数
│       │   ├── search.ts   # 联网搜索
│       │   ├── session.ts  # 会话管理
│       │   └── file-handler.ts # 文件处理
│       └── config.ts       # 配置
├── deploy-oracle.sh        # Oracle Linux 部署脚本
├── Dockerfile              # Docker 构建
└── docker-compose.yml      # Docker Compose
```
