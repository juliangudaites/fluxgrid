import { initStore, createMessage } from './models/message.js';

initStore();

const seeds = [
  { threadId: 'NEON-DREAM', content: 'Anyone out there in the void tonight?' },
  { threadId: 'NEON-DREAM', content: 'Signal received. Channel open.' },
  { threadId: 'XK7-9F2A', content: 'Meet me at the old frequency. You know which one.' },
  { threadId: 'MIDNIGHT-PULSE', content: 'The future is anonymous. The future is now.' },
  { threadId: 'FLUXGRID-2026', content: 'FLUXGRID launch confirmed. No names. No traces.' },
  { threadId: 'GHOST-LINE', content: 'I left a message for you. Find the ID.' },
  { threadId: 'SIGNAL-7', content: 'Static on the line but I can hear you.' },
  { threadId: 'CRYPTO-WAVE', content: 'Share your ID in person. That is the only link.' },
  { threadId: 'ECHO-ROOM', content: 'Every message floats here. Everyone can see everything.' },
  { threadId: 'ZERO-TRACE', content: 'No login. No username. No password. Just words and codes.' },
  { threadId: 'PULSE-9', content: '2026: the year we stopped asking who you are.' },
  { threadId: 'DRIFT-CORE', content: 'Write anything. Attach any ID. Complete anonymity.' },
  { threadId: 'NEON-DREAM', content: 'Remember: anyone can post to any ID. That is the point.' },
  { threadId: 'FLUX-88', content: 'Countless messages. One void. Infinite connections.' },
  { threadId: 'SHADOW-NET', content: 'Tell them the code. Start speaking. No app ties you together.' },
];

for (const seed of seeds) {
  createMessage(seed.threadId, seed.content);
}

console.log(`Seeded ${seeds.length} demo messages.`);