const PLAUSIBLE_DOMAIN = import.meta.env.VITE_PLAUSIBLE_DOMAIN as string | undefined;
export const GA4_ID = import.meta.env.VITE_GA4_MEASUREMENT_ID || 'G-6RVP3T8ET3';

let initialized = false;

function loadScript(src: string, attrs: Record<string, string> = {}) {
  if (document.querySelector(`script[src="${src}"]`)) return;
  const s = document.createElement('script');
  s.async = true;
  s.src = src;
  Object.entries(attrs).forEach(([k, v]) => s.setAttribute(k, v));
  document.head.appendChild(s);
}

function hasGtag() {
  return typeof window.gtag === 'function';
}

export function initAnalytics() {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  if (PLAUSIBLE_DOMAIN?.trim()) {
    loadScript('https://plausible.io/js/script.js', {
      defer: '',
      'data-domain': PLAUSIBLE_DOMAIN.trim(),
    });
  }
}

export function trackPageView(path: string, title?: string) {
  if (PLAUSIBLE_DOMAIN?.trim() && window.plausible) {
    window.plausible('pageview', { u: path });
  }
  if (hasGtag()) {
    window.gtag!('event', 'page_view', {
      page_path: path,
      page_title: title || document.title,
    });
  }
}

export function trackEvent(name: string, props?: Record<string, string | number>) {
  if (PLAUSIBLE_DOMAIN?.trim() && window.plausible) {
    window.plausible(name, { props });
  }
  if (hasGtag()) {
    window.gtag!(name, props);
  }
}

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    plausible?: (event: string, options?: { u?: string; props?: Record<string, string | number> }) => void;
  }
}