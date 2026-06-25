import { useEffect, useState } from 'react';
import { useI18n } from '../i18n/context';
import './VoidDepthCounter.css';

const VOID_BASE = 612_847;
const VOID_CEILING = 984_293;

interface VoidDepthCounterProps {
  variant?: 'full' | 'banner';
}

export function VoidDepthCounter({ variant = 'full' }: VoidDepthCounterProps) {
  const { t } = useI18n();
  const [lostCount, setLostCount] = useState(VOID_BASE);
  const isBanner = variant === 'banner';

  useEffect(() => {
    const tick = () => {
      setLostCount((prev) => {
        if (prev >= VOID_CEILING) return VOID_CEILING;
        const bump = Math.floor(Math.random() * 4) + 1;
        return Math.min(VOID_CEILING, prev + bump);
      });
    };
    const interval = setInterval(tick, 2400 + Math.random() * 1800);
    return () => clearInterval(interval);
  }, []);

  const formatted = lostCount.toLocaleString();

  return (
    <section
      className={`void-depth ${isBanner ? 'void-depth--banner' : ''}`}
      aria-label={t('voidDepthAria')}
    >
      <div className="void-depth__horizon" aria-hidden="true" />
      <div className="void-depth__glow" aria-hidden="true" />

      <div className="void-depth__counter-row">
        <span className="void-depth__counter" aria-live="polite">
          {formatted}
        </span>
        <span className="void-depth__counter-label">{t('voidDepthCounterLabel')}</span>
      </div>

      <p className="void-depth__tagline">{t('voidDepthTagline')}</p>

      {!isBanner && (
        <div className="void-depth__facts">
          <p className="void-depth__fact void-depth__fact--emphasis">{t('voidDepthNoDb')}</p>
          <p className="void-depth__fact">{t('voidDepthLostForever')}</p>
          <p className="void-depth__fact">{t('voidDepthRecovery')}</p>
          <p className="void-depth__fact void-depth__fact--code">{t('voidDepthChannelOnly')}</p>
        </div>
      )}
    </section>
  );
}