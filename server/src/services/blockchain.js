const MEMPOOL_API = 'https://mempool.space/api';

export async function findMatchingPayment(address, expectedSats, sinceIso) {
  if (!address || !expectedSats) return null;
  const sinceSec = Math.floor(new Date(sinceIso).getTime() / 1000);

  try {
    const res = await fetch(`${MEMPOOL_API}/address/${encodeURIComponent(address)}/txs`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const txs = await res.json();
    if (!Array.isArray(txs)) return null;

    for (const tx of txs) {
      const blockTime = tx.status?.block_time ?? tx.status?.blockTime;
      if (blockTime && blockTime < sinceSec - 120) continue;

      for (const vout of tx.vout ?? []) {
        const dest = vout.scriptpubkey_address ?? vout.scriptpubkeyAddress;
        if (dest !== address) continue;
        const sats = Number(vout.value);
        if (Math.abs(sats - expectedSats) <= 5) {
          return { txid: tx.txid, sats, confirmed: Boolean(tx.status?.confirmed) };
        }
      }
    }
  } catch {
    return null;
  }
  return null;
}