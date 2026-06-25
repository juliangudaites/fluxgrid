import { useEffect, useState } from 'react';
import App from './App';
import { SeoLearnPage } from './seo/SeoLearnPage';
import { initAnalytics, trackPageView } from './utils/analytics';

export function AppRouter() {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    initAnalytics();
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    trackPageView(path + window.location.search, document.title);
  }, [path]);

  const learnMatch = path.match(/^\/learn\/([a-z0-9-]+)$/);
  if (learnMatch) {
    return <SeoLearnPage slug={learnMatch[1]} />;
  }

  return <App />;
}