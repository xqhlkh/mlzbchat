import { useState } from 'react';
import { X } from 'lucide-react';
import type { AppSettings, Provider } from '../types';

interface SettingsPanelProps {
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
  onClose: () => void;
}

const PROVIDER_PRESETS: Record<Provider, { defaultBaseURL: string; defaultModel: string }> = {
  openai: { defaultBaseURL: 'https://api.openai.com/v1', defaultModel: 'gpt-4o' },
  anthropic: { defaultBaseURL: 'https://api.anthropic.com', defaultModel: 'claude-sonnet-4-20250514' },
};

const SEARCH_PROVIDERS = [
  { value: 'duckduckgo', label: 'DuckDuckGo (免费)' },
  { value: 'serpapi', label: 'SerpAPI' },
  { value: 'google', label: 'Google Custom Search' },
];

export function SettingsPanel({ settings, onSave, onClose }: SettingsPanelProps) {
  const [local, setLocal] = useState<AppSettings>({ ...settings });

  const handleProviderChange = (provider: Provider) => {
    const p = PROVIDER_PRESETS[provider];
    setLocal({ ...local, provider, baseURL: p.defaultBaseURL, model: p.defaultModel });
  };

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ margin: 0 }}>设置</h3>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="form-group">
          <label>API 提供商</label>
          <select value={local.provider} onChange={(e) => handleProviderChange(e.target.value as Provider)}>
            <option value="openai">OpenAI 兼容（DeepSeek、通义千问等）</option>
            <option value="anthropic">Anthropic Claude</option>
          </select>
        </div>

        <div className="form-group">
          <label>API Key</label>
          <input type="password" value={local.apiKey} onChange={(e) => setLocal({ ...local, apiKey: e.target.value })} placeholder={local.provider === 'openai' ? 'sk-...' : 'sk-ant-...'} />
          <div className="hint">Key 仅存于浏览器本地，通过后端代理发出</div>
        </div>

        <div className="form-group">
          <label>API 地址</label>
          <input type="text" value={local.baseURL} onChange={(e) => setLocal({ ...local, baseURL: e.target.value })} placeholder={PROVIDER_PRESETS[local.provider].defaultBaseURL} />
        </div>

        <div className="form-group">
          <label>模型</label>
          <input type="text" value={local.model} onChange={(e) => setLocal({ ...local, model: e.target.value })} placeholder={PROVIDER_PRESETS[local.provider].defaultModel} />
          <div className="hint">gpt-4o / deepseek-chat / qwen-plus / claude-sonnet-4-20250514</div>
        </div>

        <div style={{ borderTop: '1px solid var(--border)', margin: '24px 0' }} />

        <div className="form-group">
          <label>搜索引擎</label>
          <select value={local.searchProvider} onChange={(e) => setLocal({ ...local, searchProvider: e.target.value })}>
            {SEARCH_PROVIDERS.map(sp => (<option key={sp.value} value={sp.value}>{sp.label}</option>))}
          </select>
        </div>

        <div className="form-group">
          <label>系统提示词</label>
          <textarea value={local.systemPrompt} onChange={(e) => setLocal({ ...local, systemPrompt: e.target.value })} placeholder="你是一个专业的编程助手..." rows={3} />
        </div>

        <div className="form-actions">
          <button className="btn" onClick={onClose}>取消</button>
          <button className="btn btn-primary" onClick={() => onSave(local)} disabled={!local.apiKey.trim()}>保存</button>
        </div>
      </div>
    </div>
  );
}
