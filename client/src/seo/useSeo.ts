import { useEffect } from 'react';
import { SITE } from './site';

export interface SeoConfig {
  title: string;
  description: string;
  path: string;
  noindex?: boolean;
  type?: 'website' | 'article';
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

function setMeta(name: string, content: string, attr: 'name' | 'property' = 'name') {
  let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.content = content;
}

function setCanonical(href: string) {
  let el = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement('link');
    el.rel = 'canonical';
    document.head.appendChild(el);
  }
  el.href = href;
}

function setJsonLd(data: Record<string, unknown> | Record<string, unknown>[] | undefined) {
  const id = 'seo-jsonld';
  const existing = document.getElementById(id);
  if (existing) existing.remove();
  if (!data) return;
  const script = document.createElement('script');
  script.id = id;
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
}

export function useSeo(config: SeoConfig) {
  useEffect(() => {
    const url = `${SITE.url}${config.path}`;
    document.title = config.title;
    setMeta('description', config.description);
    setMeta('robots', config.noindex ? 'noindex, nofollow' : 'index, follow');
    setCanonical(url);
    setMeta('og:title', config.title, 'property');
    setMeta('og:description', config.description, 'property');
    setMeta('og:url', url, 'property');
    setMeta('og:type', config.type || 'website', 'property');
    setMeta('og:image', `${SITE.url}/favicon.svg`, 'property');
    setMeta('og:site_name', SITE.name, 'property');
    setMeta('twitter:card', 'summary_large_image', 'name');
    setMeta('twitter:title', config.title, 'name');
    setMeta('twitter:description', config.description, 'name');
    setJsonLd(config.jsonLd);
  }, [config.title, config.description, config.path, config.noindex, config.type, config.jsonLd]);
}