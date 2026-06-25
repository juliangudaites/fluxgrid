import type { Message } from '../types';

export function isMessageVisible(message: Message): boolean {
  if (!message.burnAt) return true;
  return new Date(message.burnAt).getTime() > Date.now();
}

export function filterVisibleMessages(messages: Message[]): Message[] {
  return messages.filter(isMessageVisible);
}

export function getBurnSecondsLeft(burnAt: string): number {
  return Math.max(0, Math.ceil((new Date(burnAt).getTime() - Date.now()) / 1000));
}

export function formatBurnCountdown(seconds: number): string {
  if (seconds <= 0) return '0s';
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
  }
  if (seconds < 86400) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  return h > 0 ? `${d}d ${h}h` : `${d}d`;
}