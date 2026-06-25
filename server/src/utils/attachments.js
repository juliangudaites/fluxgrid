export function sanitizeAttachment(data, type, maxBytes) {
  if (!data || typeof data !== 'string') return null;
  if (!['image', 'video'].includes(type)) return null;

  let mime = type === 'image' ? 'image/jpeg' : 'video/mp4';
  let base64 = data;

  const match = data.match(/^data:([\w/+.-]+);base64,(.+)$/);
  if (match) {
    mime = match[1];
    base64 = match[2];
  }

  if (!/^(image\/(jpeg|jpg|png|gif|webp)|video\/(mp4|webm|quicktime))$/i.test(mime)) {
    return null;
  }

  try {
    const bytes = Buffer.byteLength(base64, 'base64');
    if (bytes <= 0 || bytes > maxBytes) return null;
    const url = match ? data : `data:${mime};base64,${base64}`;
    return { attachmentType: type, attachmentUrl: url, attachmentBytes: bytes };
  } catch {
    return null;
  }
}