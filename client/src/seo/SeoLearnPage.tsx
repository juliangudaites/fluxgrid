import { LEARN_PAGES } from './pages';
import { SITE } from './site';
import { useSeo } from './useSeo';
import '../seo/seo.css';

interface SeoLearnPageProps {
  slug: string;
}

export function SeoLearnPage({ slug }: SeoLearnPageProps) {
  const page = LEARN_PAGES[slug];
  if (!page) {
    return (
      <div className="fg-seo-page" style={{ textAlign: 'center', paddingTop: 48 }}>
        <h1>Page not found</h1>
        <a href="/">← FLUXGRID</a>
      </div>
    );
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        headline: page.h1,
        description: page.description,
        url: `${SITE.url}/learn/${page.slug}`,
        publisher: { '@type': 'Organization', name: SITE.name, url: SITE.url },
      },
      {
        '@type': 'FAQPage',
        mainEntity: page.faq.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
    ],
  };

  useSeo({
    title: page.title,
    description: page.description,
    path: `/learn/${page.slug}`,
    type: 'article',
    jsonLd,
  });

  return (
    <div className="fg-seo-page">
      <header className="fg-seo-page__header">
        <a href="/" className="fg-seo-page__brand">FLUXGRID</a>
      </header>
      <article className="fg-seo-article">
        <h1>{page.h1}</h1>
        {page.sections.map((s) => (
          <section key={s.heading}>
            <h2>{s.heading}</h2>
            {s.paragraphs.map((p) => (
              <p key={p.slice(0, 40)}>{p}</p>
            ))}
          </section>
        ))}
        <section>
          <h2>FAQ</h2>
          {page.faq.map((f) => (
            <div key={f.q} className="fg-seo-faq__item">
              <h3>{f.q}</h3>
              <p>{f.a}</p>
            </div>
          ))}
        </section>
        <p className="fg-seo-sister">
          Also see <a href={SITE.sisterSite.url}>{SITE.sisterSite.name}</a> — {SITE.sisterSite.blurb}.
        </p>
        <nav>
          <h2>Related</h2>
          <ul className="fg-seo-related">
            {page.related.map((r) => (
              <li key={r}><a href={`/learn/${r}`}>{LEARN_PAGES[r]?.h1 ?? r}</a></li>
            ))}
            <li><a href="/">Enter the void →</a></li>
          </ul>
        </nav>
      </article>
    </div>
  );
}