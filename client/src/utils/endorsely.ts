declare global {
  interface Window {
    endorsely_referral?: string;
  }
}

export function waitForEndorselyReferral(timeoutMs = 3000): Promise<string | undefined> {
  return new Promise((resolve) => {
    const existing = window.endorsely_referral;
    if (existing) {
      resolve(existing);
      return;
    }
    const started = Date.now();
    const tick = () => {
      const ref = window.endorsely_referral;
      if (ref) {
        resolve(ref);
        return;
      }
      if (Date.now() - started >= timeoutMs) {
        resolve(undefined);
        return;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

export function getEndorselyReferral(): string | undefined {
  const ref = window.endorsely_referral;
  return ref && ref.length > 0 ? ref : undefined;
}