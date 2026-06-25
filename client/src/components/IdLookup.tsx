import { useState, type FormEvent } from 'react';
import { useI18n } from '../i18n/context';
import './IdLookup.css';

interface IdLookupProps {
  value: string;
  onLookup: (threadId: string) => void;
  onClear: () => void;
}

export function IdLookup({ value, onLookup, onClear }: IdLookupProps) {
  const { t } = useI18n();
  const [input, setInput] = useState(value);
  const [error, setError] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim().toUpperCase();
    if (!trimmed || trimmed.length < 3) {
      setError(true);
      return;
    }
    setError(false);
    onLookup(trimmed);
  };

  return (
    <form className={`id-lookup ${error ? 'id-lookup--error' : ''}`} onSubmit={handleSubmit}>
      <span className="id-lookup__icon" aria-hidden="true">◎</span>
      <input
        type="text"
        className="id-lookup__input"
        placeholder={t('lookupPlaceholder')}
        value={input}
        onChange={(e) => {
          setInput(e.target.value.toUpperCase());
          setError(false);
        }}
        maxLength={64}
        spellCheck={false}
      />
      <button type="submit" className="id-lookup__btn">
        {t('open')}
      </button>
      {value && (
        <button type="button" className="id-lookup__clear" onClick={() => { setInput(''); onClear(); }}>
          {t('all')}
        </button>
      )}
    </form>
  );
}