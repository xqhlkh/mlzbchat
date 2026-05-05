import { useState, useRef, useCallback } from 'react';
import { Send, Square, Paperclip, Globe, X } from 'lucide-react';
import type { UploadedFile, AppSettings } from '../types';

interface InputAreaProps {
  onSend: (text: string) => void;
  onStop: () => void;
  isLoading: boolean;
  uploadedFiles: UploadedFile[];
  onFilesUpload: (files: FileList | File[]) => void;
  onRemoveFile: (index: number) => void;
  settings: AppSettings;
  onSettingsChange: (settings: AppSettings) => void;
}

export function InputArea({ onSend, onStop, isLoading, uploadedFiles, onFilesUpload, onRemoveFile, settings, onSettingsChange }: InputAreaProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if (!input.trim() && uploadedFiles.length === 0) return;
    onSend(input);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
  };

  const handleInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  }, []);

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const imageFiles: File[] = [];
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) imageFiles.push(file);
      }
    }
    if (imageFiles.length > 0) onFilesUpload(imageFiles);
  };

  const toggleSearch = () => {
    onSettingsChange({ ...settings, enableSearch: !settings.enableSearch });
  };

  return (
    <div className="input-area">
      {uploadedFiles.length > 0 && (
        <div className="input-options">
          {uploadedFiles.map((file, i) => (
            <div key={i} className="file-chip" style={{ position: 'relative', paddingRight: '28px' }}>
              {file.isImage && file.imageBase64 ? (
                <img src={`data:${file.mimeType};base64,${file.imageBase64}`} alt={file.name} />
              ) : (<span>📄</span>)}
              <span>{file.name}</span>
              <button className="btn-icon" style={{ position: 'absolute', right: 0, top: 0, bottom: 0, padding: '2px 4px' }} onClick={() => onRemoveFile(i)}>
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="input-options">
        <div className={`option-toggle ${settings.enableSearch ? 'active' : ''}`} onClick={toggleSearch}>
          <Globe size={14} /> 联网搜索
        </div>
        <input ref={fileInputRef} type="file" multiple style={{ display: 'none' }} onChange={(e) => { if (e.target.files) { onFilesUpload(e.target.files); e.target.value = ''; } }} accept=".txt,.md,.csv,.json,.pdf,.docx,.xlsx,.png,.jpg,.jpeg,.gif,.webp" />
        <div className="option-toggle" onClick={() => fileInputRef.current?.click()}>
          <Paperclip size={14} /> 上传文件
        </div>
        <div className="option-toggle" style={{ cursor: 'default', fontSize: '11px', color: 'var(--text-muted)' }}>
          {settings.provider === 'openai' ? 'OpenAI 兼容' : 'Anthropic'} · {settings.model}
        </div>
      </div>
      <div className="input-container">
        <div className="input-wrapper">
          <textarea ref={textareaRef} value={input} onChange={handleInput} onKeyDown={handleKeyDown} onPaste={handlePaste} placeholder="输入消息... (Shift+Enter 换行，粘贴图片自动上传)" rows={1} disabled={isLoading} />
          <div className="input-actions">
            {isLoading ? (
              <button className="btn btn-danger btn-sm" onClick={onStop}><Square size={14} /> 停止</button>
            ) : (
              <button className="btn btn-primary btn-sm" onClick={handleSubmit} disabled={!input.trim() && uploadedFiles.length === 0}><Send size={14} /></button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
