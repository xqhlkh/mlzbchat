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
        <h2>对话历史</h2>
        <button className="btn-icon" onClick={onNew} title="新建对话">
          <Plus size={18} />
        </button>
      </div>
      <div className="sidebar-conversations">
        {conversations.length === 0 && (
          <div style={{ padding: '20px 12px', color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center' }}>
            点击 + 开始新对话
          </div>
        )}
        {conversations.map(conv => (
          <div key={conv.id} className={`conversation-item ${conv.id === activeConvId ? 'active' : ''}`} onClick={() => onSelect(conv)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquare size={14} style={{ flexShrink: 0 }} />
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{conv.title}</span>
              <button className="btn-icon" style={{ padding: '2px', opacity: 0.6 }} onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }} title="删除对话">
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="sidebar-footer">
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>多人 AI 聊天助手</div>
      </div>
    </div>
  );
}
