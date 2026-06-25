import { useState } from 'react';
import { useI18n } from '../i18n/context';
import { submitReport, type ReportCategory } from '../api';
import type { Message } from '../types';
import './ReportModal.css';

interface ReportModalProps {
  message: Message | null;
  onClose: () => void;
  onSuccess: () => void;
}

const CATEGORIES: ReportCategory[] = [
  'csam',
  'grooming',
  'threat',
  'illegal',
  'harassment',
  'spam',
];

export function ReportModal({ message, onClose, onSuccess }: ReportModalProps) {
  const { t } = useI18n();
  const [category, setCategory] = useState<ReportCategory>('illegal');
  const [submitting, setSubmitting] = useState(false);

  if (!message) return null;

  const categoryLabels: Record<ReportCategory, string> = {
    csam: t('reportCsam'),
    grooming: t('reportGrooming'),
    threat: t('reportThreat'),
    illegal: t('reportIllegal'),
    harassment: t('reportHarassment'),
    spam: t('reportSpam'),
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await submitReport(message.id, message.threadId, category);
      onSuccess();
      onClose();
    } catch {
      setSubmitting(false);
    }
  };

  return (
    <div className="report-overlay" onClick={onClose}>
      <div className="report-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="report-modal__title">{t('reportTitle')}</h3>
        <p className="report-modal__channel">
          {message.threadId}
        </p>
        <p className="report-modal__preview">{message.content.slice(0, 120)}{message.content.length > 120 ? '…' : ''}</p>

        <div className="report-modal__categories">
          {CATEGORIES.map((cat) => (
            <label key={cat} className={`report-modal__cat ${category === cat ? 'report-modal__cat--active' : ''}`}>
              <input
                type="radio"
                name="category"
                value={cat}
                checked={category === cat}
                onChange={() => setCategory(cat)}
              />
              {categoryLabels[cat]}
            </label>
          ))}
        </div>

        <p className="report-modal__note">{t('reportNote')}</p>

        <div className="report-modal__actions">
          <button type="button" className="report-modal__cancel" onClick={onClose}>
            {t('reportCancel')}
          </button>
          <button
            type="button"
            className="report-modal__submit"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? '...' : t('reportSubmit')}
          </button>
        </div>
      </div>
    </div>
  );
}