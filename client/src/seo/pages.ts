export interface LearnPage {
  slug: string;
  title: string;
  description: string;
  h1: string;
  sections: { heading: string; paragraphs: string[] }[];
  faq: { q: string; a: string }[];
  related: string[];
}

export const LEARN_PAGES: Record<string, LearnPage> = {
  'anonymous-chat-no-login': {
    slug: 'anonymous-chat-no-login',
    title: 'Anonymous Chat No Login — FLUXGRID Free 2026',
    description:
      'Talk in the void without an account. FLUXGRID is free anonymous chat with shared channel codes, live feed, and emoji groups.',
    h1: 'Anonymous Chat — No Login',
    sections: [
      {
        heading: 'Chat without identity',
        paragraphs: [
          'FLUXGRID lets anyone join a conversation with a channel code — no email, no phone, no profile. Messages appear in a live void feed or private thread view.',
          'Pick an emoji avatar, transmit into the void, and disappear. Perfect for candid discussion, support groups, and ephemeral communities.',
        ],
      },
    ],
    faq: [
      { q: 'Is FLUXGRID free?', a: 'Yes. VOID tier is free with unlimited public messages.' },
      { q: 'How do channels work?', a: 'Share a code like VOID-7 or a custom SIGNAL tier vanity ID.' },
    ],
    related: ['anonymous-messaging-app', 'private-channel-codes'],
  },
  'anonymous-messaging-app': {
    slug: 'anonymous-messaging-app',
    title: 'Anonymous Messaging App — Web, No App Store | FLUXGRID',
    description:
      'Anonymous messaging in the browser. No install, no login. FLUXGRID works on mobile and desktop with channel-based private chat.',
    h1: 'Anonymous Messaging App',
    sections: [
      {
        heading: 'Why browser-first',
        paragraphs: [
          'No app store review, no phone number harvest. Open fluxgrid.onrender.com, enter a channel, start talking. Paid tiers unlock vanity IDs, attachments, burn timers, and Deep Void anonymity.',
        ],
      },
    ],
    faq: [
      { q: 'Is there an app?', a: 'Web app — add to home screen on mobile for PWA-like experience.' },
    ],
    related: ['anonymous-chat-no-login', 'vs-telegram-groups'],
  },
  'private-channel-codes': {
    slug: 'private-channel-codes',
    title: 'Private Channel Codes — Share a Code, Open a Room | FLUXGRID',
    description:
      'Create private anonymous channels with shareable codes. Lock channels, emoji chat, and optional burn timers on FLUXGRID.',
    h1: 'Private Channel Codes',
    sections: [
      {
        heading: 'Security through obscurity plus features',
        paragraphs: [
          'Channels are accessed by code, not searchable names. SIGNAL tier reserves custom IDs. Lock your channel so only your emoji can post. FLUX tier adds burn timers and buried mid-feed delivery.',
        ],
      },
    ],
    faq: [
      { q: 'Can anyone guess my channel?', a: 'Use long random codes or paid vanity IDs for memorable sharing.' },
    ],
    related: ['secure-anonymous-communication', 'anonymous-chat-no-login'],
  },
  'vs-telegram-groups': {
    slug: 'vs-telegram-groups',
    title: 'FLUXGRID vs Telegram Groups — Anonymous Alternative',
    description:
      'Compare FLUXGRID and Telegram for anonymous group chat. No phone number, no account, void aesthetic, Bitcoin-paid tiers.',
    h1: 'FLUXGRID vs Telegram',
    sections: [
      {
        heading: 'When FLUXGRID wins',
        paragraphs: [
          'You need zero identity footprint: no SIM, no Telegram account, no metadata-rich app install. Share a channel code in person or on a forum and talk immediately.',
          'Telegram wins on scale and media; FLUXGRID wins on lightweight anonymous rooms and cyberpunk-minimal UX in the same universe as DEADLINK secret sharing.',
        ],
      },
    ],
    faq: [
      { q: 'E2E encryption?', a: 'FLUXGRID focuses on anonymous access and retention policy; use DEADLINK for one-time secrets.' },
    ],
    related: ['anonymous-messaging-app', 'security'],
  },
  'secure-anonymous-communication': {
    slug: 'secure-anonymous-communication',
    title: 'Secure Anonymous Communication — FLUXGRID Guide',
    description:
      'Best practices for secure anonymous communication with FLUXGRID channels, locks, burn timers, and paid tiers.',
    h1: 'Secure Anonymous Communication',
    sections: [
      {
        heading: 'Operational tips',
        paragraphs: [
          'Use unique channel codes per conversation. Enable channel lock after setup. For one-time credentials use sister product DEADLINK instead of chat.',
          'Paid access keys are device-bound — no central account database to breach.',
        ],
      },
    ],
    faq: [
      { q: '18+ only?', a: 'Yes. Age gate on entry.' },
    ],
    related: ['private-channel-codes', 'security'],
  },
  security: {
    slug: 'security',
    title: 'FLUXGRID Security — Moderation, Reports, Payments',
    description:
      'FLUXGRID security model: admin moderation, abuse reports, banned channels, anonymous tier keys, Bitcoin and Stripe payments.',
    h1: 'Security Overview',
    sections: [
      {
        heading: 'Moderation',
        paragraphs: [
          'Community reports, admin portal, channel bans, message removal. Simulator for feed activity in development.',
          'Do not use FLUXGRID for illegal content. CSAM and threats are zero tolerance.',
        ],
      },
    ],
    faq: [
      { q: 'Where is data stored?', a: 'JSON file store on server; messages can be hidden, removed, or burned per policy.' },
    ],
    related: ['anonymous-chat-no-login', 'secure-anonymous-communication'],
  },
};

export const LEARN_SLUGS = Object.keys(LEARN_PAGES);