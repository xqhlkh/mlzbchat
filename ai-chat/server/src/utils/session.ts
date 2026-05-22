import { v4 as uuidv4 } from 'uuid';
import type { ChatMessage } from '../providers/openai';

interface Session { id: string; createdAt: number; messages: ChatMessage[]; }
const sessions = new Map<string, Session>();

setInterval(() => {
  const now = Date.now();
  for (const [id, s] of sessions) { if (now - s.createdAt > 86400000) sessions.delete(id); }
}, 3600000);

export function createSession(): string {
  const id = uuidv4();
  sessions.set(id, { id, createdAt: Date.now(), messages: [] });
  return id;
}

export function getSession(id: string): Session | undefined {
  const s = sessions.get(id);
  if (s) s.createdAt = Date.now();
  return s;
}

export function addMessage(sessionId: string, message: ChatMessage): void {
  const s = sessions.get(sessionId);
  if (s) { s.messages.push(message); s.createdAt = Date.now(); if (s.messages.length > 200) s.messages = s.messages.slice(-100); }
}

export function getMessages(sessionId: string): ChatMessage[] {
  const s = sessions.get(sessionId);
  return s ? [...s.messages] : [];
}

export function clearMessages(sessionId: string): void {
  const s = sessions.get(sessionId);
  if (s) s.messages = [];
}

export function deleteSession(sessionId: string): void { sessions.delete(sessionId); }
