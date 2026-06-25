import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { redeemTierAccess, revokeTierSession } from '../api';
import { FREE_CAPS, type TierCaps, type TierId } from './tiers';
import { clearStoredAccessCode, getStoredAccessCode, setStoredAccessCode } from './storage';
import { clearTierCache, getTierCache, setTierCache } from './cache';
import type { DeviceSession } from '../components/SessionLimitModal';

interface TierContextValue {
  caps: TierCaps;
  tier: TierId;
  accessCode: string | null;
  expiresAt: string | null;
  loading: boolean;
  sessions: DeviceSession[];
  maxDevices: number;
  deviceLimitOpen: boolean;
  applyAccessCode: (code: string) => Promise<void>;
  clearAccess: () => void;
  refreshTier: () => Promise<void>;
  revokeSession: (deviceId: string) => Promise<void>;
  closeDeviceLimit: () => void;
  handleDeviceLimitError: (err: unknown) => boolean;
}

const TierContext = createContext<TierContextValue | null>(null);

function isDeviceLimitError(err: unknown): err is Error & { code: string; sessions?: DeviceSession[] } {
  return err instanceof Error && (err as { code?: string }).code === 'DEVICE_LIMIT';
}

export function TierProvider({ children }: { children: ReactNode }) {
  const cached = getTierCache();
  const [caps, setCaps] = useState<TierCaps>(cached?.caps ?? FREE_CAPS);
  const [tier, setTier] = useState<TierId>(cached?.tier ?? 'void');
  const [accessCode, setAccessCode] = useState<string | null>(cached?.accessCode ?? null);
  const [expiresAt, setExpiresAt] = useState<string | null>(cached?.expiresAt ?? null);
  const [sessions, setSessions] = useState<DeviceSession[]>([]);
  const [maxDevices, setMaxDevices] = useState(2);
  const [loading, setLoading] = useState(true);
  const [deviceLimitOpen, setDeviceLimitOpen] = useState(false);
  const [pendingCode, setPendingCode] = useState<string | null>(null);

  const applyResult = useCallback((result: {
    tier: TierId;
    caps: TierCaps;
    accessCode: string;
    expiresAt?: string | null;
    sessions?: DeviceSession[];
    maxDevices?: number;
  }) => {
    setCaps(result.caps);
    setTier(result.tier);
    setAccessCode(result.accessCode);
    setExpiresAt(result.expiresAt ?? null);
    setStoredAccessCode(result.accessCode);
    setTierCache({
      tier: result.tier,
      caps: result.caps,
      accessCode: result.accessCode,
      expiresAt: result.expiresAt ?? null,
    });
    if (result.sessions) setSessions(result.sessions);
    if (result.maxDevices) setMaxDevices(result.maxDevices);
    setDeviceLimitOpen(false);
    setPendingCode(null);
  }, []);

  const refreshTier = useCallback(async () => {
    const stored = getStoredAccessCode();
    if (!stored) {
      setCaps(FREE_CAPS);
      setTier('void');
      setAccessCode(null);
      setExpiresAt(null);
      setSessions([]);
      return;
    }
    const result = await redeemTierAccess(stored);
    applyResult(result);
  }, [applyResult]);

  const applyAccessCode = useCallback(async (code: string) => {
    const normalized = code.trim().toUpperCase();
    try {
      const result = await redeemTierAccess(normalized);
      applyResult(result);
    } catch (err) {
      if (isDeviceLimitError(err)) {
        setStoredAccessCode(normalized);
        setPendingCode(normalized);
        setSessions((err.sessions as DeviceSession[]) ?? []);
        setDeviceLimitOpen(true);
        return;
      }
      throw err;
    }
  }, [applyResult]);

  const clearAccess = useCallback(() => {
    clearStoredAccessCode();
    clearTierCache();
    setCaps(FREE_CAPS);
    setTier('void');
    setAccessCode(null);
    setExpiresAt(null);
    setSessions([]);
    setDeviceLimitOpen(false);
    setPendingCode(null);
  }, []);

  const revokeSession = useCallback(async (deviceId: string) => {
    const result = await revokeTierSession(deviceId);
    applyResult({
      tier: result.tier,
      caps: result.caps,
      accessCode: result.accessCode,
      expiresAt: result.expiresAt,
      sessions: result.sessions,
      maxDevices: result.maxDevices,
    });
    if (result.registered) {
      setDeviceLimitOpen(false);
      setPendingCode(null);
      return;
    }
    const code = pendingCode || getStoredAccessCode();
    if (code) {
      await applyAccessCode(code);
    }
  }, [applyResult, applyAccessCode, pendingCode]);

  const closeDeviceLimit = useCallback(() => {
    setDeviceLimitOpen(false);
    setPendingCode(null);
  }, []);

  const handleDeviceLimitError = useCallback((err: unknown) => {
    if (isDeviceLimitError(err)) {
      const stored = getStoredAccessCode();
      if (stored) {
        setPendingCode(stored);
      }
      setSessions((err.sessions as DeviceSession[]) ?? []);
      setDeviceLimitOpen(true);
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = getStoredAccessCode();
        if (stored) {
          const result = await redeemTierAccess(stored);
          if (!cancelled) applyResult(result);
        }
      } catch (err) {
        if (!cancelled) {
          if (isDeviceLimitError(err)) {
            const code = getStoredAccessCode();
            if (code) setPendingCode(code);
            setSessions((err.sessions as DeviceSession[]) ?? []);
            setDeviceLimitOpen(true);
          } else {
            clearStoredAccessCode();
            clearTierCache();
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applyResult]);

  const value = useMemo(
    () => ({
      caps,
      tier,
      accessCode,
      expiresAt,
      loading,
      sessions,
      maxDevices,
      deviceLimitOpen,
      applyAccessCode,
      clearAccess,
      refreshTier,
      revokeSession,
      closeDeviceLimit,
      handleDeviceLimitError,
    }),
    [
      caps,
      tier,
      accessCode,
      expiresAt,
      loading,
      sessions,
      maxDevices,
      deviceLimitOpen,
      applyAccessCode,
      clearAccess,
      refreshTier,
      revokeSession,
      closeDeviceLimit,
      handleDeviceLimitError,
    ]
  );

  return <TierContext.Provider value={value}>{children}</TierContext.Provider>;
}

export function useTier() {
  const ctx = useContext(TierContext);
  if (!ctx) throw new Error('useTier must be used within TierProvider');
  return ctx;
}

export { FREE_CAPS };