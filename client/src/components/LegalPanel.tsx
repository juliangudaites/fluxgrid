import { useI18n } from '../i18n/context';
import { legalDocs } from '../legal/content';
import './LegalPanel.css';

export type LegalDocType = 'terms' | 'privacy' | 'aup' | 'safety';

interface LegalPanelProps {
  open: boolean;
  doc: LegalDocType | null;
  onClose: () => void;
}

export function LegalPanel({ open, doc, onClose }: LegalPanelProps) {
  const { lang } = useI18n();

  if (!open || !doc) return null;

  const content = legalDocs[lang][doc];

  return (
    <div className="legal-overlay" onClick={onClose}>
      <article className="legal-panel" onClick={(e) => e.stopPropagation()}>
        <header className="legal-panel__header">
          <div>
            <h2 className="legal-panel__title">{content.title}</h2>
            <span className="legal-panel__updated">{content.updated}</span>
          </div>
          <button type="button" className="legal-panel__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>
        <div className="legal-panel__body">
          {content.sections.map((section) => (
            <section key={section.title} className="legal-panel__section">
              <h3>{section.title}</h3>
              {section.body.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </section>
          ))}
        </div>
      </article>
    </div>
  );
}