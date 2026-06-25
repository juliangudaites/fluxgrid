declare global {
  interface Window {
    rewardful?: (...args: unknown[]) => void;
    Rewardful?: { referral?: string };
    _rwq?: string;
  }
}

let initStarted = false;

export function initRewardful(apiKey: string | undefined) {
  if (!apiKey || initStarted || typeof document === 'undefined') return;
  initStarted = true;

  const queueScript = document.createElement('script');
  queueScript.textContent = `(function(w,r){w._rwq=r;w[r]=w[r]||function(){(w[r].q=w[r].q||[]).push(arguments)}})(window,'rewardful');`;
  document.head.appendChild(queueScript);

  const loader = document.createElement('script');
  loader.async = true;
  loader.src = 'https://r.wdfl.co/rw.js';
  loader.setAttribute('data-rewardful', apiKey);
  document.head.appendChild(loader);
}

export function waitForRewardfulReady(timeoutMs = 4000): Promise<void> {
  return new Promise((resolve) => {
    if (window.Rewardful?.referral !== undefined || !window.rewardful) {
      resolve();
      return;
    }
    const timer = setTimeout(() => resolve(), timeoutMs);
    window.rewardful?.('ready', () => {
      clearTimeout(timer);
      resolve();
    });
  });
}

export function getRewardfulReferral(): string | undefined {
  const ref = window.Rewardful?.referral;
  return ref && ref.length > 0 ? ref : undefined;
}