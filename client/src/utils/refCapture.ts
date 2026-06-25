const REF_KEY = 'fluxgrid_ref';

export function captureRefFromUrl(): void {
  if (typeof window === 'undefined') return;
  const ref = new URLSearchParams(window.location.search).get('ref');
  if (ref) {
    localStorage.setItem(REF_KEY, ref.trim().slice(0, 100));
  }
}

export function getStoredAffiliateRef(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  const ref = localStorage.getItem(REF_KEY);
  return ref && ref.length > 0 ? ref : undefined;
}