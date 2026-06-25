export const ALLOWED_EMOJIS = [
  '🦊', '🐸', '🦄', '🐙', '🦋', '🔮', '👻', '🌙', '⭐', '🎭',
  '🍕', '☕', '🌊', '🔥', '💀', '🎪', '🛸', '🌵', '🎲', '🧊',
  '🐱', '🐶', '🦉', '🐢', '🦈', '🌺', '🍀', '🎯', '🎸', '🚀',
  '🧿', '🪐', '⚡', '🌈', '🍄', '🦜', '🐝', '🦀', '🎃', '❄️',
] as const;

export type SenderEmoji = (typeof ALLOWED_EMOJIS)[number];

const STORAGE_PREFIX = 'fluxgrid_emoji_';

export function getStoredEmoji(threadId: string): string | null {
  const stored = localStorage.getItem(`${STORAGE_PREFIX}${threadId}`);
  if (stored && ALLOWED_EMOJIS.includes(stored as SenderEmoji)) return stored;
  return null;
}

export function setStoredEmoji(threadId: string, emoji: string): void {
  if (!ALLOWED_EMOJIS.includes(emoji as SenderEmoji)) return;
  localStorage.setItem(`${STORAGE_PREFIX}${threadId}`, emoji);
}

export function pickRandomEmoji(): SenderEmoji {
  return ALLOWED_EMOJIS[Math.floor(Math.random() * ALLOWED_EMOJIS.length)];
}