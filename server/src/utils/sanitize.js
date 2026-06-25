const THREAD_ID_REGEX = /^[a-zA-Z0-9_-]{3,64}$/;

export function sanitizeContent(content, maxLen = 2000) {
  if (typeof content !== 'string') return null;
  const trimmed = content.trim().replace(/\0/g, '');
  const limit = Math.min(Math.max(Number(maxLen) || 2000, 1), 5000);
  if (trimmed.length < 1 || trimmed.length > limit) return null;
  return trimmed;
}

export function sanitizeThreadId(threadId) {
  if (typeof threadId !== 'string') return null;
  const normalized = threadId.trim().toUpperCase();
  if (!THREAD_ID_REGEX.test(normalized)) return null;
  return normalized;
}

export function previewContent(content, max = 120) {
  if (content.length <= max) return content;
  return content.slice(0, max).trimEnd() + '…';
}