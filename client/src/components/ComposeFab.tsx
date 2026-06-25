import { useI18n } from '../i18n/context';
import './ComposeFab.css';

interface ComposeFabProps {
  onClick: () => void;
  newCount: number;
}

export function ComposeFab({ onClick, newCount }: ComposeFabProps) {
  const { t } = useI18n();
  return (
    <button type="button" className="compose-fab" onClick={onClick} title="Open transmit panel">
      <span className="compose-fab__icon">◈</span>
      <span className="compose-fab__label">{t('transmitFab')}</span>
      {newCount > 0 && (
        <span className="compose-fab__badge">{newCount > 99 ? '99+' : newCount}</span>
      )}
    </button>
  );
}