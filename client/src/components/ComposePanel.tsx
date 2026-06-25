import { useEffect, useRef, useState, type FormEvent } from 'react';
import { generateThreadId as randomChannelId, isVanityChannelId } from '../channelId';
import { getStoredEmoji, setStoredEmoji, pickRandomEmoji } from '../emojis';
import { useI18n } from '../i18n/context';
import { useTier } from '../tiers/context';
import { FLUX_BURN_OPTIONS } from '../tiers/tiers';
import { playTransmitSound } from '../utils/transmitSound';
import type { TransmitOptions } from '../types';
import { EmojiPicker } from './EmojiPicker';
import type { ThreadMeta } from '../types';
import './ComposePanel.css';

interface ComposePanelProps {
  open: boolean;
  activeThreadId: string;
  threadMeta: ThreadMeta | null;
  onTransmit: (
    threadId: string,
    content: string,
    senderEmoji: string | null,
    options?: TransmitOptions
  ) => Promise<void>;
  onShare: (threadId: string) => void;
  onClose: () => void;
  onOpenTerms: () => void;
  onOpenPlans: () => void;
}

export function ComposePanel({
  open,
  activeThreadId,
  threadMeta,
  onTransmit,
  onShare,
  onClose,
  onOpenTerms,
  onOpenPlans,
}: ComposePanelProps) {
  const { t } = useI18n();
  const { caps, tier, loading: tierLoading, accessCode } = useTier();
  const [threadId, setThreadId] = useState('');
  const [content, setContent] = useState('');
  const [senderEmoji, setSenderEmoji] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [vanityNotice, setVanityNotice] = useState('');
  const [burnSeconds, setBurnSeconds] = useState(0);
  const [pinMessage, setPinMessage] = useState(false);
  const [priorityStyle, setPriorityStyle] = useState(false);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const [attachmentType, setAttachmentType] = useState<'image' | 'video'>('image');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const joinedChannelRef = useRef('');

  const effectiveThread = (threadId || activeThreadId).trim().toUpperCase();
  const channelLocked = Boolean(threadMeta?.locked);
  const isNewParticipant =
    channelLocked &&
    senderEmoji &&
    threadMeta &&
    !threadMeta.participants.includes(senderEmoji);

  const isJoiningExisting = Boolean(activeThreadId && effectiveThread === activeThreadId.trim().toUpperCase());
  const canSubmit = Boolean(
    (content.trim() || attachmentPreview) &&
    termsAccepted &&
    senderEmoji &&
    !isNewParticipant
  );

  const hasPaidFeatures =
    caps.vanityIds || caps.burner || caps.attachments || caps.pinMessages || caps.priorityStyle;

  useEffect(() => {
    if (activeThreadId) {
      setThreadId(activeThreadId);
      joinedChannelRef.current = activeThreadId;
      return;
    }
    if (joinedChannelRef.current) {
      joinedChannelRef.current = '';
      setThreadId(randomChannelId());
      return;
    }
    setThreadId((current) => current || randomChannelId());
  }, [activeThreadId]);

  useEffect(() => {
    if (!effectiveThread || effectiveThread.length < 3) {
      setSenderEmoji(null);
      return;
    }
    const stored = getStoredEmoji(effectiveThread);
    setSenderEmoji(stored ?? pickRandomEmoji());
  }, [effectiveThread]);

  const handleEmojiChange = (emoji: string) => {
    setSenderEmoji(emoji);
    if (effectiveThread.length >= 3) {
      setStoredEmoji(effectiveThread, emoji);
    }
  };

  const handleGenerate = () => {
    const id = randomChannelId();
    setThreadId(id);
    setSenderEmoji(pickRandomEmoji());
    setStatus('idle');
    setErrorMsg('');
    setVanityNotice('');
    onShare(id);
  };

  const rejectVanityAttempt = () => {
    const id = randomChannelId();
    setThreadId(id);
    setSenderEmoji(pickRandomEmoji());
    setVanityNotice(t('vanityIdRequiresSignal'));
    setStatus('idle');
    setErrorMsg('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    let tid = (threadId || randomChannelId()).trim().toUpperCase();
    const text = content.trim();

    if (!caps.vanityIds && !isJoiningExisting && isVanityChannelId(tid)) {
      rejectVanityAttempt();
      setStatus('error');
      setErrorMsg(t('vanityIdRequiresSignal'));
      return;
    }

    if (isNewParticipant) {
      setErrorMsg(t('channelLockedNew'));
      setStatus('error');
      return;
    }

    setSending(true);
    setStatus('idle');
    setErrorMsg('');
    playTransmitSound();
    try {
      setStoredEmoji(tid, senderEmoji!);
      const options: TransmitOptions = {};
      if (caps.burner && burnSeconds > 0) options.burnAfterSeconds = burnSeconds;
      if (caps.pinMessages && pinMessage) options.pinMessage = true;
      if (caps.priorityStyle && priorityStyle) options.priorityStyle = true;
      if (caps.attachments && attachmentPreview) {
        options.attachmentData = attachmentPreview;
        options.attachmentType = attachmentType;
      }
      await onTransmit(tid, text, senderEmoji, options);
      setContent('');
      setBurnSeconds(0);
      setPinMessage(false);
      setPriorityStyle(false);
      setAttachmentPreview(null);
      setThreadId(tid);
      joinedChannelRef.current = tid;
      setStatus('success');
      setTimeout(() => setStatus('idle'), 1200);
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : t('transmitFailed'));
    } finally {
      setSending(false);
    }
  };

  const showEmojiPicker = effectiveThread.length >= 3;
  const panelOpen = open;

  return (
    <section className={`compose-panel ${panelOpen ? 'compose-panel--open' : 'compose-panel--closed'}`}>
      <div className="compose-panel__glow" aria-hidden="true" />
      <form className="compose-panel__form" onSubmit={handleSubmit}>
        <div className="compose-panel__scroll">
          <div className="compose-panel__topbar">
            <div className="compose-panel__badge">
              <span className="compose-panel__lock">◈</span>
              {t('composeAnonymous')}
            </div>
            <button
              type="button"
              className="compose-panel__close"
              onClick={onClose}
              aria-label={t('composeClose')}
              title={t('composeClose')}
            >
              ✕
            </button>
          </div>

          <div className="compose-panel__row">
            <label className="compose-panel__label" htmlFor="thread-id">
              {t('channelId')}
            </label>
            <div className="compose-panel__id-row">
              <input
                id="thread-id"
                type="text"
                className={`compose-panel__id-input ${caps.vanityIds && !isJoiningExisting ? '' : 'compose-panel__id-input--readonly'}`}
                placeholder={caps.vanityIds ? t('vanityPlaceholder') : t('channelPlaceholder')}
                value={threadId}
                readOnly={!caps.vanityIds || isJoiningExisting}
                onChange={(e) => caps.vanityIds && !isJoiningExisting && setThreadId(e.target.value.toUpperCase())}
                maxLength={64}
                spellCheck={false}
                onPaste={(e) => {
                  if (!caps.vanityIds && !isJoiningExisting) {
                    e.preventDefault();
                    rejectVanityAttempt();
                  }
                }}
                onKeyDown={(e) => {
                  if (!caps.vanityIds && !isJoiningExisting && e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
                    e.preventDefault();
                    rejectVanityAttempt();
                  }
                }}
              />
              {!isJoiningExisting && (
                <button type="button" className="compose-panel__gen-btn" onClick={handleGenerate}>
                  {t('generate')}
                </button>
              )}
              {threadId && (
                <button type="button" className="compose-panel__share-btn" onClick={() => onShare(threadId)}>
                  {t('shareIdBtn')}
                </button>
              )}
            </div>
            {isJoiningExisting && (
              <p className="compose-panel__hint compose-panel__hint--inline">{t('channelJoinHint')}</p>
            )}
            {!isJoiningExisting && (
              <>
                <p className="compose-panel__hint compose-panel__hint--inline">{t('channelHint')}</p>
                {vanityNotice && (
                  <p className="compose-panel__vanity-notice" role="status">{vanityNotice}</p>
                )}
              </>
            )}
          </div>

          {showEmojiPicker && (
            <div className="compose-panel__row compose-panel__row--emoji">
              <EmojiPicker value={senderEmoji} onChange={handleEmojiChange} compact collapsible />
              {isNewParticipant && (
                <p className="compose-panel__locked-warn">{t('channelLockedNew')}</p>
              )}
            </div>
          )}

          <div className="compose-panel__row">
            <label className="compose-panel__label" htmlFor="message-content">
              {t('yourMessage')}
            </label>
            <textarea
              id="message-content"
              className="compose-panel__textarea"
              placeholder={t('messagePlaceholder')}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={caps.maxContent}
              rows={2}
              disabled={Boolean(isNewParticipant)}
            />
            <div className="compose-panel__meta">
              <span>{content.length}/{caps.maxContent}</span>
              <span className="compose-panel__tier-tag">
                {tierLoading && accessCode ? `${caps.label} · syncing…` : caps.label}
                {tier !== 'void' && !tierLoading && ' · active'}
              </span>
            </div>
          </div>

          {hasPaidFeatures ? (
            <div className="compose-panel__tier-features">
              {caps.burner && (
                <label className="compose-panel__feature">
                  <span>{t('burnTimerLabel')}</span>
                  <select value={burnSeconds} onChange={(e) => setBurnSeconds(Number(e.target.value))}>
                    <option value={0}>{t('burnOff')}</option>
                    {FLUX_BURN_OPTIONS.map((o) => (
                      <option key={o.seconds} value={o.seconds}>{o.label}</option>
                    ))}
                  </select>
                  <span className="compose-panel__feature-hint">{t('burnModeHint')}</span>
                </label>
              )}
              {caps.attachments && (
                <div className="compose-panel__feature">
                  <span>{t('attachmentLabel')}</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm"
                    hidden
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const isVideo = file.type.startsWith('video/');
                      const max = isVideo ? caps.maxVideoBytes : caps.maxImageBytes;
                      if (file.size > max) {
                        setErrorMsg(t('attachmentTooLarge'));
                        setStatus('error');
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = () => {
                        setAttachmentPreview(reader.result as string);
                        setAttachmentType(isVideo ? 'video' : 'image');
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                  <button type="button" onClick={() => fileInputRef.current?.click()}>
                    {t('attachmentBtn')}
                  </button>
                  {attachmentPreview && (
                    <button type="button" onClick={() => setAttachmentPreview(null)}>
                      {t('attachmentClear')}
                    </button>
                  )}
                </div>
              )}
              {caps.pinMessages && (
                <label className="compose-panel__feature compose-panel__feature--check">
                  <input type="checkbox" checked={pinMessage} onChange={(e) => setPinMessage(e.target.checked)} />
                  <span>{t('pinMessageLabel')}</span>
                </label>
              )}
              {caps.priorityStyle && (
                <label className="compose-panel__feature compose-panel__feature--check">
                  <input type="checkbox" checked={priorityStyle} onChange={(e) => setPriorityStyle(e.target.checked)} />
                  <span>{t('priorityChannel')}</span>
                </label>
              )}
            </div>
          ) : (
            <button type="button" className="compose-panel__upgrade" onClick={onOpenPlans}>
              {t('featuresUpgrade')}
            </button>
          )}
        </div>

        <div className="compose-panel__footer">
          <label className="compose-panel__terms">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
            />
            <span>
              {t('termsCheckbox')}{' '}
              <button type="button" className="compose-panel__terms-link" onClick={onOpenTerms}>
                →
              </button>
            </span>
          </label>

          <button
            type="submit"
            className={`compose-panel__transmit ${status === 'success' ? 'compose-panel__transmit--success' : ''}`}
            disabled={sending || !canSubmit}
          >
            {sending ? t('transmitting') : status === 'success' ? t('sent') : t('transmit')}
          </button>

          {status === 'error' && (
            <p className="compose-panel__error">{errorMsg || t('transmitFailed')}</p>
          )}
          {activeThreadId && (
            <p className="compose-panel__keep-open">{t('keepTransmitting')}</p>
          )}
        </div>
      </form>
    </section>
  );
}