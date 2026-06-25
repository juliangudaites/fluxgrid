export const ALLOWED_EMOJIS = [
  '🦊', '🐸', '🦄', '🐙', '🦋', '🔮', '👻', '🌙', '⭐', '🎭',
  '🍕', '☕', '🌊', '🔥', '💀', '🎪', '🛸', '🌵', '🎲', '🧊',
  '🐱', '🐶', '🦉', '🐢', '🦈', '🌺', '🍀', '🎯', '🎸', '🚀',
  '🧿', '🪐', '⚡', '🌈', '🍄', '🦜', '🐝', '🦀', '🎃', '❄️',
];

export function sanitizeSenderEmoji(value) {
  if (value == null || value === '') return null;
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!ALLOWED_EMOJIS.includes(trimmed)) return null;
  return trimmed;
}

export function randomEmoji() {
  return ALLOWED_EMOJIS[Math.floor(Math.random() * ALLOWED_EMOJIS.length)];
}