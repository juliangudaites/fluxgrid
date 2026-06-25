import { useState } from 'react';
import './TipModal.css';

export interface DeviceSession {
  deviceId: string;
  label: string;
  lastSeen: string;
  isCurrent?: boolean;
  waiting?: boolean;
}

interface SessionLimitModalProps {
  open: boolean;
  sessions: DeviceSession[];
  maxDevices: number;
  onRevoke: (deviceId: string) => Promise<void>;
  onClose: () => void;
}

export function SessionLimitModal({
  open,
  sessions,
  maxDevices,
  onRevoke,
  onClose,
}: SessionLimitModalProps) {
  const [revoking, setRevoking] = useState<string | null>(null);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleRevoke = async (deviceId: string) => {
    setRevoking(deviceId);
    setError('');
    try {
      await onRevoke(deviceId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not end session');
    } finally {
      setRevoking(null);
    }
  };

  return (
    <div className="tip-overlay" onClick={onClose}>
      <div className="tip-modal tip-modal--tier" onClick={(e) => e.stopPropagation()} role="dialog">
        <header className="tip-modal__header">
          <h2>DEVICE LIMIT REACHED</h2>
          <p className="tip-modal__anon-note">
            Each paid access key works on <strong>{maxDevices} devices maximum</strong>.
            You must disconnect an existing session below before this device can activate your tier.
            There is no account — your access key is the only credential. If you lose it, tier access cannot be recovered.
          </p>
          <button type="button" className="tip-modal__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>
        <div className="tip-modal__body">
          <ul className="session-limit-list">
            {sessions.map((s) => (
              <li key={s.deviceId} className="session-limit-item">
                <div>
                  <strong>{s.label}</strong>
                  {s.waiting && <span className="session-limit-current"> · waiting for a slot</span>}
                  {s.isCurrent && !s.waiting && <span className="session-limit-current"> · this device</span>}
                  <p className="session-limit-seen">
                    Last active {new Date(s.lastSeen).toLocaleString()}
                  </p>
                </div>
                {!s.waiting && (
                  <button
                    type="button"
                    className="session-limit-revoke"
                    disabled={revoking === s.deviceId}
                    onClick={() => handleRevoke(s.deviceId)}
                  >
                    {revoking === s.deviceId ? '…' : 'DISCONNECT'}
                  </button>
                )}
              </li>
            ))}
          </ul>
          {error && <p className="tip-modal__error">{error}</p>}
        </div>
      </div>
    </div>
  );
}