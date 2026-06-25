import { useState } from 'react';
import type { Message, ThreadMeta } from '../types';
import { lockThread, unlockThread } from '../api';
import { useI18n } from '../i18n/context';
import { BurnCountdown } from './BurnCountdown';
import { MessageAttachment } from './MessageAttachment';
import './ThreadView.css';

interface ThreadViewProps {
  threadId: string;
  messages: Message[];
  loading: boolean;
  threadMeta: ThreadMeta | null;
  myEmoji: string | null;
  onShare: (threadId: string) => void;
  onMetaUpdate: (meta: ThreadMeta) => void;
  onToast: (message: string) => void;
  onRefresh?: () => void;
}

function formatTime(timestamp: string) {
  return new Date(timestamp).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ThreadView({
  threadId,
  messages,
  loading,
  threadMeta,
  myEmoji,
  onShare,
  onMetaUpdate,
  onToast,
}: ThreadViewProps) {
  const { t } = useI18n();
  const [togglingLock, setTogglingLock] = useState(false);

  const participants = threadMeta?.participants?.length
    ? threadMeta.participants
    : [...new Set(messages.map((m) => m.senderEmoji).filter(Boolean))] as string[];

  const isParticipant = myEmoji && participants.includes(myEmoji);
  const isLocked = Boolean(threadMeta?.locked);
  const canToggleLock = isParticipant && participants.length >= 1;
  const showInitialLoad = loading && messages.length === 0;

  const handleToggleLock = async () => {
    if (!myEmoji || togglingLock || !canToggleLock) return;
    setTogglingLock(true);
    try {
      const meta = isLocked
        ? await unlockThread(threadId, myEmoji)
        : await lockThread(threadId, myEmoji);
      onMetaUpdate(meta);
      onToast(isLocked ? t('channelUnlocked') : t('channelLocked'));
    } catch (err) {
      onToast(err instanceof Error ? err.message : isLocked ? t('unlockFailed') : t('lockFailed'));
    } finally {
      setTogglingLock(false);
    }
  };

  return (
    <section className="thread-view">
      <header className="thread-view__header">
        <div>
          <span className="thread-view__label">{t('activeChannel')}</span>
          <h2 className="thread-view__id">{threadId}</h2>
          {isLocked && <span className="thread-view__status-badge thread-view__status-badge--locked">{t('channelClosed')}</span>}
          {!isLocked && participants.length > 0 && (
            <span className="thread-view__status-badge thread-view__status-badge--open">{t('channelOpenBadge')}</span>
          )}
        </div>
        <button type="button" className="thread-view__share" onClick={() => onShare(threadId)}>
          {t('shareId')}
        </button>
      </header>

      {participants.length > 0 && (
        <div className="thread-view__participants">
          <span className="thread-view__participants-label">{t('inThisChannel')}</span>
          <div className="thread-view__participant-list">
            {participants.map((emoji) => (
              <span
                key={emoji}
                className={`thread-view__participant ${emoji === myEmoji ? 'thread-view__participant--you' : ''}`}
                title={emoji === myEmoji ? t('yourEmoji') : undefined}
              >
                {emoji}
              </span>
            ))}
          </div>
        </div>
      )}

      {isLocked && (
        <p className="thread-view__locked">{t('channelLockedNotice')}</p>
      )}

      {canToggleLock && (
        <button
          type="button"
          className={`thread-view__lock-btn ${isLocked ? 'thread-view__lock-btn--unlock' : ''}`}
          onClick={handleToggleLock}
          disabled={togglingLock}
        >
          {togglingLock
            ? isLocked
              ? t('unlocking')
              : t('locking')
            : isLocked
              ? t('unlockChannel')
              : t('lockChannel')}
        </button>
      )}

      {showInitialLoad ? (
        <div className="thread-view__loading">{t('scanningVoid')}</div>
      ) : messages.length === 0 ? (
        <div className="thread-view__empty">
          <span className="thread-view__empty-icon">◎</span>
          <p>{t('threadEmpty')}</p>
        </div>
      ) : (
        <div className="thread-view__messages">
          {messages.map((msg, i) => (
            <div
              key={msg.id}
              className={`thread-view__message ${msg.senderEmoji === myEmoji ? 'thread-view__message--mine' : ''}`}
              style={{ animationDelay: `${Math.min(i, 12) * 0.03}s` }}
            >
              {msg.senderEmoji && (
                <span className="thread-view__avatar" aria-hidden="true">
                  {msg.senderEmoji}
                </span>
              )}
              <div className="thread-view__bubble">
                <div className="thread-view__meta-row">
                  <time className="thread-view__time">{formatTime(msg.timestamp)}</time>
                  {msg.burnAt && <BurnCountdown burnAt={msg.burnAt} />}
                </div>
                {msg.content && <p className="thread-view__content">{msg.content}</p>}
                {msg.attachmentUrl && msg.attachmentType && (
                  <MessageAttachment type={msg.attachmentType} url={msg.attachmentUrl} />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {loading && messages.length > 0 && (
        <div className="thread-view__sync" aria-hidden="true">
          <span className="thread-view__sync-dot" />
        </div>
      )}
    </section>
  );
}