export const SITE = {
  name: 'FLUXGRID',
  tagline: 'Anonymous conversation in the void.',
  url: import.meta.env.VITE_PUBLIC_SITE_URL || 'https://fluxgrid.onrender.com',
  defaultTitle: 'FLUXGRID — Anonymous Chat & Channels | No Login 2026',
  defaultDescription:
    'Anonymous messaging with shared channel codes. No account, no email, live feed, emoji chat, burn timers on paid tiers. Free forever.',
  twitter: '@fluxgrid',
  sisterSite: { name: 'DEADLINK', url: 'https://deadlink.onrender.com', blurb: 'One-time secret links that burn after reading' },
} as const;