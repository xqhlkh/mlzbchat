import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { User, Bot } from 'lucide-react';
import type { Message } from '../types';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  chatEndRef: React.RefObject<HTMLDivElement>;
}

export function MessageList({ messages, isLoading, chatEndRef }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="chat-area">
        <div className="welcome-screen">
          <h1>AI Chat</h1>
          <p>支持 OpenAI 兼容接口与 Anthropic Claude，联网搜索，文件上传。</p>
          <div className="example-chips">
            {['帮我写一段 Python 代码', '解释一下量子计算', '翻译一段英文'].map(ex => (
              <div key={ex} className="example-chip">{ex}</div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-area">
      {messages.map(msg => (
        <div key={msg.id} className={`message ${msg.role}`}>
          <div className="message-avatar">
            {msg.role === 'user' ? <User size={17} /> : <Bot size={17} />}
          </div>
          <div className="message-content">
            {msg.files && msg.files.length > 0 && (
              <div className="message-files">
                {msg.files.map((file, i) => (
                  <div key={i} className="file-chip">
                    {file.isImage && file.imageBase64 ? <img src={`data:${file.mimeType};base64,${file.imageBase64}`} alt={file.name} /> : <span>📎</span>}
                    <span>{file.name}</span>
                  </div>
                ))}
              </div>
            )}
            {msg.role === 'assistant' && msg.content ? (
              <ReactMarkdown
                components={{
                  code({ className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    const codeStr = String(children).replace(/\n$/, '');
                    if (!match && !codeStr.includes('\n')) return <code className={className} {...props}>{children}</code>;
                    return <SyntaxHighlighter style={oneDark} language={match ? match[1] : ''} PreTag="div">{codeStr}</SyntaxHighlighter>;
                  },
                }}
              >{msg.content}</ReactMarkdown>
            ) : (
              <p style={{ whiteSpace: 'pre-wrap' }}>{msg.content || '...'}</p>
            )}
          </div>
        </div>
      ))}
      {isLoading && messages[messages.length - 1]?.role === 'assistant' && !messages[messages.length - 1]?.content && (
        <div className="typing-indicator"><div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" /></div>
      )}
      <div ref={chatEndRef} />
    </div>
  );
}
