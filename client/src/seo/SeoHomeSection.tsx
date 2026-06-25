import { SITE } from './site';
import { LEARN_PAGES } from './pages';

export function SeoHomeSection() {
  const guides = Object.values(LEARN_PAGES).slice(0, 5);
  return (
    <section className="fg-seo-home" aria-label="Learn more">
      <details>
        <summary>Guides &amp; resources</summary>
        <p>
          {SITE.name} — {SITE.tagline} Free anonymous chat with channel codes, live feed, and paid tiers for vanity IDs and burn timers.
        </p>
        <ul>
          {guides.map((g) => (
            <li key={g.slug}><a href={`/learn/${g.slug}`}>{g.h1}</a></li>
          ))}
          <li><a href="/learn/security">Security overview</a></li>
        </ul>
        <p>
          Sister product: <a href={SITE.sisterSite.url} rel="noopener">{SITE.sisterSite.name}</a>
        </p>
      </details>
    </section>
  );
}