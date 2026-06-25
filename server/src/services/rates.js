let cache = null;
let cacheAt = 0;
let refreshing = false;
const CACHE_MS = 5 * 60 * 1000;
const FETCH_TIMEOUT_MS = 4000;

const FALLBACK_RATES = { usd: 95000, brl: 520000, updatedAt: null, fallback: true };

async function fetchRates() {
  const res = await fetch(
    'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,brl',
    { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) }
  );
  if (!res.ok) throw new Error('Rate fetch failed');
  const data = await res.json();
  return {
    usd: data.bitcoin?.usd ?? 0,
    brl: data.bitcoin?.brl ?? 0,
    updatedAt: new Date().toISOString(),
  };
}

function refreshInBackground() {
  if (refreshing) return;
  refreshing = true;
  fetchRates()
    .then((rates) => {
      cache = rates;
      cacheAt = Date.now();
    })
    .catch(() => {})
    .finally(() => {
      refreshing = false;
    });
}

export async function getBtcRates() {
  const now = Date.now();
  if (cache && now - cacheAt < CACHE_MS) return cache;

  if (!cache) {
    cache = { ...FALLBACK_RATES };
    cacheAt = now;
    refreshInBackground();
    return cache;
  }

  try {
    cache = await fetchRates();
    cacheAt = now;
    return cache;
  } catch {
    refreshInBackground();
    return cache;
  }
}

export function usdToBtc(amountUsd, btcUsd) {
  if (!btcUsd || btcUsd <= 0) return 0;
  return amountUsd / btcUsd;
}

export function brlToBtc(amountBrl, btcBrl) {
  if (!btcBrl || btcBrl <= 0) return 0;
  return amountBrl / btcBrl;
}

export function formatBtc(btc) {
  if (btc >= 0.01) return btc.toFixed(6);
  if (btc >= 0.0001) return btc.toFixed(8);
  return btc.toFixed(10);
}