import type { TierCaps, TierId } from './tiers';

const CACHE_KEY = 'fluxgrid_tier_cache';

export interface TierCache {
  tier: TierId;
  caps: TierCaps;
  accessCode: string;
  expiresAt?: string | null;
}

export function getTierCache(): TierCache | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TierCache;
    if (!parsed?.accessCode || !parsed?.caps?.label) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function setTierCache(data: TierCache): void {
  localStorage.setItem(CACHE_KEY, JSON.stringify(data));
}

export function clearTierCache(): void {
  localStorage.removeItem(CACHE_KEY);
}