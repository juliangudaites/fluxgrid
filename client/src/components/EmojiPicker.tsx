import { useState } from 'react';
import { ALLOWED_EMOJIS } from '../emojis';
import { useI18n } from '../i18n/context';
import './EmojiPicker.css';

interface EmojiPickerProps {
  value: string | null;
  onChange: (emoji: string) => void;
  compact?: boolean;
  collapsible?: boolean;
}

export function EmojiPicker({ value, onChange, compact, collapsible }: EmojiPickerProps) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);

  const showGrid = !collapsible || expanded;

  return (
    <div className={`emoji-picker ${compact ? 'emoji-picker--compact' : ''} ${collapsible ? 'emoji-picker--collapsible' : ''}`}>
      <div className="emoji-picker__header">
        <span className="emoji-picker__label">{t('yourEmoji')}</span>
        <div className="emoji-picker__header-actions">
          {value && (
            <span className="emoji-picker__selected" title={t('yourEmojiHint')}>
              {value}
            </span>
          )}
          {collapsible && (
            <button
              type="button"
              className="emoji-picker__toggle"
              onClick={() => setExpanded((e) => !e)}
              aria-expanded={expanded}
            >
              {expanded ? t('emojiCollapse') : t('emojiChange')}
            </button>
          )}
        </div>
      </div>
      {!compact && <p className="emoji-picker__hint">{t('yourEmojiHint')}</p>}
      {showGrid && (
        <div className="emoji-picker__grid" role="listbox" aria-label={t('yourEmoji')}>
          {ALLOWED_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              role="option"
              aria-selected={value === emoji}
              className={`emoji-picker__btn ${value === emoji ? 'emoji-picker__btn--active' : ''}`}
              onClick={() => {
                onChange(emoji);
                if (collapsible) setExpanded(false);
              }}
              title={t('pickEmoji')}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}