import { useState, useEffect, useRef, useCallback } from 'react';
import type { Message, UploadedFile, Conversation, AppSettings, Provider, StreamChunk } from './types';
import { SettingsPanel } from './components/SettingsPanel';
import { MessageList } from './components/MessageList';
import { InputArea } from './components/InputArea';
import { Sidebar } from './components/Sidebar';
import { Menu, Plus, Settings, Trash2 } from 'lucide-react';

const defaultSettings: AppSettings = {
  provider: 'openai',
  apiKey: '',
  baseURL: 'https://api.openai.com/v1',
  model: 'gpt-4o',
  enableSearch: false,
  searchProvider: 'duckduckgo',
  systemPrompt: '',
};

function loadSettings(): AppSettings {
  try {
    const saved = localStorage.getItem('ai-chat-settings');
    if (saved) return { ...defaultSettings, ...JSON.parse(saved) };
  } catch {}
  return defaultSettings;
}

function loadConversations(): Conversation[] {
  try {
    const saved = localStorage.getItem('ai-chat-conversations');
    if (saved) return JSON.parse(saved);
  } catch {}
  return [];
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>(loadConversations);
  const [activeConvId, setActiveConvId] = useState<string>('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    startNewConversation();
  }, []);

  const startNewConversation = async () => {
    try {
      const res = await fetch('/api/session', { method: 'POST' });
      const data = await res.json();
      setSessionId(data.sessionId);
      setMessages([]);
      setUploadedFiles([]);

      const conv: Conversation = {
        id: Date.now().toString(),
        title: '新对话',
        sessionId: data.sessionId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setConversations(prev => [conv, ...prev]);
      setActiveConvId(conv.id);
      saveConversations([conv, ...conversations]);
    } catch (err) {
      console.error('创建会话失败:', err);
    }
  };

  const saveConversations = (convs: Conversation[]) => {
    localStorage.setItem('ai-chat-conversations', JSON.stringify(convs));
  };

  const switchConversation = async (conv: Conversation) => {
    if (isLoading) return;
    setActiveConvId(conv.id);
    setSessionId(conv.sessionId);
    setUploadedFiles([]);

    try {
      const res = await fetch(`/api/session/${conv.sessionId}/messages`);
      const data = await res.json();
      const msgs: Message[] = (data.messages || []).map((m: any, i: number) => ({
        id: `${conv.sessionId}-${i}`,
        role: m.role,
        content: m.content,
        timestamp: Date.now(),
      }));
      setMessages(msgs);
    } catch {
      setMessages([]);
    }
  };

  const deleteConversation = (convId: string) => {
    const updated = conversations.filter(c => c.id !== convId);
    setConversations(updated);
    saveConversations(updated);
    if (convId === activeConvId) {
      startNewConversation();
    }
  };

  const clearCurrentConversation = async () => {
    if (!sessionId) return;
    await fetch(`/api/session/${sessionId}/messages`, { method: 'DELETE' });
    setMessages([]);
  };

  const handleSettingsChange = (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem('ai-chat-settings', JSON.stringify(newSettings));
  };

  const handleSend = async (text: string) => {
    if (!text.trim() && uploadedFiles.length === 0) return;
    if (isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
      files: uploadedFiles.length > 0 ? [...uploadedFiles] : undefined,
    };

    setMessages(prev => [...prev, userMessage]);
    setUploadedFiles([]);
    setIsLoading(true);

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, assistantMessage]);

    abortRef.current = new AbortController();

    try {
      const response = await fetch('/api/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          sessionId,
          provider: settings.provider,
          apiKey: settings.apiKey || undefined,
          baseURL: settings.baseURL || undefined,
          model: settings.model || undefined,
          enableSearch: settings.enableSearch,
          searchProvider: settings.searchProvider,
          fileContents: uploadedFiles.map(f => ({ name: f.name, content: f.content })),
          systemPrompt: settings.systemPrompt || undefined,
        }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || '请求失败');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('无法读取响应流');

      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data: StreamChunk = JSON.parse(line.slice(6));
              if (data.token) {
                fullContent += data.token;
                setMessages(prev => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  if (last && last.role === 'assistant') {
                    updated[updated.length - 1] = { ...last, content: fullContent };
                  }
                  return updated;
                });
              }
              if (data.error) {
                setMessages(prev => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  if (last && last.role === 'assistant') {
                    updated[updated.length - 1] = { ...last, content: `❌ 错误: ${data.error}` };
                  }
                  return updated;
                });
              }
              if (data.sessionId && data.sessionId !== sessionId) {
                setSessionId(data.sessionId);
              }
            } catch {}
          }
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setMessages(prev => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last && last.role === 'assistant') {
            updated[updated.length - 1] = { ...last, content: `❌ 错误: ${err.message || '请求失败，请检查 API 配置'}` };
          }
          return updated;
        });
      }
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  };

  const handleStop = () => {
    abortRef.current?.abort();
    setIsLoading(false);
  };

  const handleFilesUpload = async (files: FileList | File[]) => {
    const formData = new FormData();
    const fileArray = Array.isArray(files) ? files : Array.from(files);
    fileArray.forEach(f => formData.append('files', f));

    try {
      const res = await fetch('/api/file', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.files) setUploadedFiles(prev => [...prev, ...data.files]);
      if (data.error) alert(data.error);
    } catch (err: any) {
      alert('文件上传失败: ' + err.message);
    }
  };

  const removeUploadedFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="app-layout">
      <Sidebar
        conversations={conversations}
        activeConvId={activeConvId}
        collapsed={!sidebarOpen}
        onSelect={switchConversation}
        onDelete={deleteConversation}
        onNew={startNewConversation}
      />

      <div className="main-area">
        <div className="topbar">
          <div className="topbar-left">
            <button className="btn-icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <Menu size={20} />
            </button>
            <span className="topbar-title">
              AI Chat{settings.provider === 'openai' ? ' - OpenAI 兼容' : ' - Anthropic'}
            </span>
          </div>
          <div className="topbar-right">
            <button className="btn btn-sm" onClick={clearCurrentConversation}>
              <Trash2 size={14} /> 清除对话
            </button>
            <button className="btn btn-sm" onClick={startNewConversation}>
              <Plus size={14} /> 新对话
            </button>
            <button className="btn-icon" onClick={() => setShowSettings(!showSettings)}>
              <Settings size={20} />
            </button>
          </div>
        </div>

        <MessageList messages={messages} isLoading={isLoading} chatEndRef={chatEndRef} />

        <InputArea
          onSend={handleSend}
          onStop={handleStop}
          isLoading={isLoading}
          uploadedFiles={uploadedFiles}
          onFilesUpload={handleFilesUpload}
          onRemoveFile={removeUploadedFile}
          settings={settings}
          onSettingsChange={handleSettingsChange}
        />
      </div>

      {showSettings && (
        <SettingsPanel
          settings={settings}
          onSave={(s) => { handleSettingsChange(s); setShowSettings(false); }}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
