import { v4 as uuidv4 } from 'uuid';
import type { ChatMessage } from '../providers/openai';

interface Session {
  id: string;
  createdAt: number;
  messages: ChatMessage[];
}

const sessions = new Map<string, Session>();

setInterval(() => {
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  for (const [id, session] of sessions) {
    if (now - session.createdAt > oneDay) {
      sessions.delete(id);
    }
  }
}, 60 * 60 * 1000);

export function createSession(): string {
  const id = uuidv4();
  sessions.set(id, {
    id,
    createdAt: Date.now(),
    messages: [],
  });
  return id;
}

export function getSession(id: string): Session | undefined {
  const session = sessions.get(id);
  if (session) {
    session.createdAt = Date.now();
  }
  return session;
}

export function addMessage(sessionId: string, message: ChatMessage): void {
  const session = sessions.get(sessionId);
  if (session) {
    session.messages.push(message);
    session.createdAt = Date.now();
    if (session.messages.length > 200) {
      session.messages = session.messages.slice(-100);
    }
  }
}

export function getMessages(sessionId: string): ChatMessage[] {
  const session = sessions.get(sessionId);
  return session ? [...session.messages] : [];
}

export function clearMessages(sessionId: string): void {
  const session = sessions.get(sessionId);
  if (session) {
    session.messages = [];
  }
}

export function deleteSession(sessionId: string): void {
  sessions.delete(sessionId);
}
