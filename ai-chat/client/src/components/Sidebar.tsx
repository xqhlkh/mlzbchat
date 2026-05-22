import { Plus, MessageSquare, Trash2 } from 'lucide-react';
import type { Conversation } from '../types';

interface SidebarProps {
  conversations: Conversation[];
  activeConvId: string;
  collapsed: boolean;
  onSelect: (conv: Conversation) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
}

export function Sidebar({ conversations, activeConvId, collapsed, onSelect, onDelete, onNew }: SidebarProps) {
  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <h2>AI Chat</h2>
        <button className="btn-icon" onClick={onNew} title="新建对话"><Plus size={16} /></button>
      </div>
      <div className="sidebar-conversations">
        {conversations.length === 0 && (
          <div style={{ padding: '32px 12px', color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center' }}>
            开始你的第一个对话
          </div>
        )}
        {conversations.map(conv => (
          <div key={conv.id} className={`conversation-item ${conv.id === activeConvId ? 'active' : ''}`} onClick={() => onSelect(conv)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <MessageSquare size={14} style={{ flexShrink: 0, opacity: 0.5 }} />
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{conv.title}</span>
              <button className="btn-icon" style={{ padding: '2px', opacity: 0 }} onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }} title="删除">
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="sidebar-footer">
        <div>自托管 AI 聊天</div>
      </div>
    </div>
  );
}
