import { sanitizeContent, sanitizeThreadId } from '../utils/sanitize.js';
import { sanitizeSenderEmoji } from '../utils/emojis.js';
import { resolveRequestCaps } from '../utils/caps.js';
import { validateFreeTierChannelId } from '../utils/channelId.js';
import { isAllowedBurnSeconds } from '../utils/tiers.js';
import { sanitizeAttachment } from '../utils/attachments.js';

export function validateMessage(req, res, next) {
  const { threadId, content, senderEmoji, burnAfterSeconds, pinMessage, priorityStyle, attachmentData, attachmentType } =
    req.body ?? {};
  const { caps, tier } = resolveRequestCaps(req);

  const cleanThreadId = sanitizeThreadId(threadId);
  if (!cleanThreadId) {
    return res.status(400).json({
      error: 'Channel ID must be 3-64 characters (letters, numbers, dashes, underscores)',
      code: 'INVALID_THREAD_ID',
    });
  }

  if (!caps.vanityIds) {
    const channelCheck = validateFreeTierChannelId(cleanThreadId);
    if (!channelCheck.allowed) {
      return res.status(403).json({
        error: channelCheck.reason,
        code: channelCheck.code,
      });
    }
  }

  let cleanContent = '';
  if (typeof content === 'string' && content.trim()) {
    cleanContent = sanitizeContent(content, caps.maxContent) || '';
    if (!cleanContent) {
      return res.status(400).json({
        error: `Message exceeds ${caps.maxContent} characters for your ${caps.label} tier`,
        code: 'CONTENT_TOO_LONG',
      });
    }
  }

  if (!cleanContent && !attachmentData) {
    return res.status(400).json({
      error: `Message must be 1-${caps.maxContent} characters or include an attachment`,
      code: 'INVALID_CONTENT',
    });
  }

  const cleanEmoji = sanitizeSenderEmoji(senderEmoji);
  if (!cleanEmoji) {
    return res.status(400).json({
      error: 'Pick an anonymous emoji before transmitting',
      code: 'INVALID_EMOJI',
    });
  }

  let burnSeconds = 0;
  if (burnAfterSeconds != null && Number(burnAfterSeconds) > 0) {
    if (!caps.burner) {
      return res.status(403).json({ error: 'Burn timers require FLUX tier', code: 'TIER_FLUX_REQUIRED' });
    }
    burnSeconds = Math.floor(Number(burnAfterSeconds));
    if (!isAllowedBurnSeconds(tier, burnSeconds)) {
      return res.status(400).json({ error: 'Invalid burn timer for your tier' });
    }
  }

  let attachment = null;
  if (attachmentData) {
    if (!caps.attachments) {
      return res.status(403).json({ error: 'Attachments require PULSE tier or higher', code: 'TIER_PULSE_REQUIRED' });
    }
    const type = attachmentType === 'video' ? 'video' : 'image';
    const maxBytes = type === 'video' ? caps.maxVideoBytes : caps.maxImageBytes;
    attachment = sanitizeAttachment(attachmentData, type, maxBytes);
    if (!attachment) {
      return res.status(400).json({ error: 'Invalid or oversized attachment for your tier' });
    }
  }

  const wantsPin = Boolean(pinMessage);
  if (wantsPin && !caps.pinMessages) {
    return res.status(403).json({ error: 'Pinning requires PULSE tier or higher', code: 'TIER_PULSE_REQUIRED' });
  }

  const wantsPriority = Boolean(priorityStyle);
  if (wantsPriority && !caps.priorityStyle) {
    return res.status(403).json({ error: 'Priority styling requires PULSE tier or higher', code: 'TIER_PULSE_REQUIRED' });
  }

  req.validated = {
    threadId: cleanThreadId,
    content: cleanContent || (attachment ? ' ' : ''),
    senderEmoji: cleanEmoji,
    tier,
    caps,
    boosted: false,
    attachment,
    pinMessage: wantsPin,
    priorityStyle: wantsPriority,
    burnSeconds,
    deepVoid: Boolean(caps.deepVoid && tier === 'flux'),
  };
  next();
}