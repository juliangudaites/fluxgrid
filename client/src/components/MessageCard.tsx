import { useI18n } from '../i18n/context';
import type { Message } from '../types';
import { BurnCountdown } from './BurnCountdown';
import { MessageAttachment } from './MessageAttachment';
import './MessageCard.css';

interface MessageCardProps {
  message: Message;
  index: number;
  highlighted?: boolean;
  isNew?: boolean;
  onSelectThread: (threadId: string) => void;
  onShare: (threadId: string) => void;
  onReport: (message: Message) => void;
}

function formatTime(timestamp: string) {
  return new Date(timestamp).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function MessageCard({
  message,
  index,
  highlighted,
  isNew,
  onSelectThread,
  onShare,
  onReport,
}: MessageCardProps) {
  const { t } = useI18n();

  return (
    <article
      className={`message-card ${highlighted ? 'message-card--highlighted' : ''} ${isNew ? 'message-card--new' : ''} ${message.boosted ? 'message-card--boosted' : ''} ${message.priorityStyle ? 'message-card--priority' : ''} ${message.pinned ? 'message-card--pinned' : ''}`}
      style={{ animationDelay: isNew ? '0s' : `${(index % 8) * 0.15}s` }}
    >
      <header className="message-card__header">
        <div className="message-card__header-left">
          {message.senderEmoji && (
            <span className="message-card__emoji" aria-hidden="true">
              {message.senderEmoji}
            </span>
          )}
          <button
            type="button"
            className="message-card__thread-id"
            onClick={() => onSelectThread(message.threadId)}
            title="Open this channel"
          >
            {message.threadId}
          </button>
        </div>
        <time className="message-card__time" dateTime={message.timestamp}>
          {formatTime(message.timestamp)}
        </time>
      </header>
      {message.pinned && <span className="message-card__pin-badge">{t('pinnedBadge')}</span>}
      {message.content && <p className="message-card__content">{message.content}</p>}
      {message.attachmentUrl && message.attachmentType && (
        <MessageAttachment type={message.attachmentType} url={message.attachmentUrl} />
      )}
      <footer className="message-card__footer">
        <span className="message-card__hint">
          {message.boosted && <span className="message-card__boosted">{t('boostedBadge')}</span>}
          {message.burnAt && <BurnCountdown burnAt={message.burnAt} />}
          {isNew ? t('liveBadge') : t('publicSignal')}
        </span>
        <div className="message-card__actions">
          <button
            type="button"
            className="message-card__report"
            onClick={() => onReport(message)}
            title={t('report')}
          >
            {t('report')}
          </button>
          <button
            type="button"
            className="message-card__share"
            onClick={() => onShare(message.threadId)}
            title={t('shareId')}
          >
            {t('shareId')}
          </button>
        </div>
      </footer>
    </article>
  );
}