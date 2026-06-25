import { useEffect, useState } from 'react';
import { formatBurnCountdown, getBurnSecondsLeft } from '../utils/messages';
import './BurnCountdown.css';

interface BurnCountdownProps {
  burnAt: string;
}

export function BurnCountdown({ burnAt }: BurnCountdownProps) {
  const [seconds, setSeconds] = useState(() => getBurnSecondsLeft(burnAt));

  useEffect(() => {
    const tick = () => setSeconds(getBurnSecondsLeft(burnAt));
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [burnAt]);

  if (seconds <= 0) return null;

  return (
    <span className="burn-countdown" title="Message will burn and disappear">
      🔥 {formatBurnCountdown(seconds)}
    </span>
  );
}