import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { User, Bot, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import type { Message } from '../types';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  chatEndRef: React.RefObject<HTMLDivElement>;
}

function CodeBlock({ language, children }: { language: string; children: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ position: 'relative', margin: '12px 0' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '8px 14px', background: 'rgba(255,255,255,0.05)',
        borderTopLeftRadius: '8px', borderTopRightRadius: '8px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        fontSize: '12px', color: 'var(--text-muted)',
      }}>
        <span>{language || 'code'}</span>
        <button onClick={handleCopy} style={{
          background: 'none', border: 'none', color: 'var(--text-muted)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px',
        }}>
          {copied ? <><Check size={12} /> 已复制</> : <><Copy size={12} /> 复制</>}
        </button>
      </div>
      <SyntaxHighlighter
        style={oneDark}
        language={language || 'text'}
        PreTag="div"
        customStyle={{
          margin: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0,
          borderRadius: '0 0 8px 8px', padding: '14px 16px',
          fontSize: '13px', lineHeight: '1.6',
        }}
      >
        {children}
      </SyntaxHighlighter>
    </div>
  );
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
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    const codeStr = String(children).replace(/\n$/, '');
                    const isInline = !match && !codeStr.includes('\n');

                    if (isInline) {
                      return <code className={className} {...props}>{children}</code>;
                    }

                    return <CodeBlock language={match ? match[1] : ''} children={codeStr} />;
                  },
                  table({ children }) {
                    return (
                      <div style={{ overflowX: 'auto', margin: '12px 0' }}>
                        <table>{children}</table>
                      </div>
                    );
                  },
                  a({ href, children }) {
                    return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
                  },
                }}
              >
                {msg.content}
              </ReactMarkdown>
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
