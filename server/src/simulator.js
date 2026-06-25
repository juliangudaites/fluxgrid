import { createMessage } from './models/message.js';
import { loadUserThreads, saveUserThread } from './db/userThreads.js';
import { randomEmoji } from './utils/emojis.js';
import {
  FRIENDLY,
  FUNNY,
  MYSTERIOUS,
  CASUAL,
  SHADY,
  FLIRTY_SECRET,
  GROUP_CHATS,
  DUO_CONVERSATIONS,
  TRIO_CONVERSATIONS,
} from './simulator/messages.js';

let simulatorEnabled = true;
let simPostsThisMinute = 0;
let simMinuteStart = Date.now();
const SIM_MAX_POSTS_PER_MIN = 55;

function canSimPost() {
  const now = Date.now();
  if (now - simMinuteStart > 60_000) {
    simMinuteStart = now;
    simPostsThisMinute = 0;
  }
  if (simPostsThisMinute >= SIM_MAX_POSTS_PER_MIN) return false;
  simPostsThisMinute += 1;
  return true;
}

export function isSimulatorEnabled() {
  return simulatorEnabled;
}

export function setSimulatorEnabled(enabled) {
  simulatorEnabled = Boolean(enabled);
  return simulatorEnabled;
}

/** Pre-seeded demo channels — simulator owns these only. */
const EXISTING_THREADS = [
  'NEON-DREAM', 'XK7-9F2A', 'GHOST-LINE', 'SIGNAL-7', 'CRYPTO-WAVE',
  'ECHO-ROOM', 'ZERO-TRACE', 'PULSE-9', 'DRIFT-CORE', 'FLUX-88',
  'SHADOW-NET', 'MIDNIGHT-PULSE', 'VOID-2026', 'NIGHT-CALL', 'STATIC-42',
  'COFFEE-RUN', 'LATE-NIGHT', 'PARK-MEET', 'STUDY-CREW', 'TRIP-LOG',
  'LOCKER-12', 'BACK-LOT-7', 'NAPKIN-ID', 'BURNER-99', 'ALIBI-X',
  'HOTEL-J', 'PAGE-47', 'BLINDS-DOWN', 'FAKE-MEET', 'VOID-OPS',
];

const PREFIXES = ['VOID', 'SIGNAL', 'PULSE', 'DRIFT', 'ECHO', 'SHADOW', 'FLUX', 'NEON', 'GHOST', 'ZERO', 'BURNER', 'LOCKER', 'ALIBI', 'NIGHT', 'STATIC'];
const SUFFIXES = ['7', '42', '88', '99', 'X', 'CORE', 'WAVE', 'LINE', 'NET', 'ROOM', 'OPS', 'DROP', 'RUN'];

/** Channels the simulator may post to (seeded + simulator-generated only). */
const simulatorThreads = new Set(EXISTING_THREADS);
/** Real user-created channels — simulator must never post here. */
const userThreads = loadUserThreads();
const threadEmojis = new Map();
const recentThreads = [];

const pools = {
  friendly: { items: [...FRIENDLY], used: new Set() },
  funny: { items: [...FUNNY], used: new Set() },
  mysterious: { items: [...MYSTERIOUS], used: new Set() },
  casual: { items: [...CASUAL], used: new Set() },
  shady: { items: [...SHADY], used: new Set() },
  flirty: { items: [...FLIRTY_SECRET], used: new Set() },
};

const duoPool = { items: [...DUO_CONVERSATIONS], used: new Set() };
const groupPool = { items: [...GROUP_CHATS], used: new Set() };
const trioPool = { items: [...TRIO_CONVERSATIONS], used: new Set() };

export function markUserThread(threadId) {
  if (!threadId) return;
  const id = String(threadId).trim().toUpperCase();
  userThreads.add(id);
  saveUserThread(id);
  simulatorThreads.delete(id);
}

export function isUserThread(threadId) {
  return userThreads.has(String(threadId).trim().toUpperCase());
}

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pickUnique(pool) {
  const unused = pool.items.map((item, i) => ({ item, i })).filter(({ i }) => !pool.used.has(i));
  if (unused.length === 0) {
    pool.used.clear();
    return pool.items[Math.floor(Math.random() * pool.items.length)];
  }
  const pick = unused[Math.floor(Math.random() * unused.length)];
  pool.used.add(pick.i);
  return pick.item;
}

function pickFromCategory() {
  const roll = Math.random();
  if (roll < 0.14) return pickUnique(pools.shady);
  if (roll < 0.26) return pickUnique(pools.mysterious);
  if (roll < 0.38) return pickUnique(pools.funny);
  if (roll < 0.5) return pickUnique(pools.casual);
  if (roll < 0.62) return pickUnique(pools.flirty);
  if (roll < 0.76) return pickUnique(pools.friendly);
  return pickUnique(pools.mysterious);
}

function generateNewThreadId() {
  const prefix = randomFrom(PREFIXES);
  const suffix = randomFrom(SUFFIXES);
  const num = Math.floor(Math.random() * 900) + 100;
  return `${prefix}-${suffix}${num}`.slice(0, 16);
}

function rememberThread(threadId) {
  recentThreads.unshift(threadId);
  if (recentThreads.length > 12) recentThreads.pop();
}

function pickThreadId(preferFresh = false) {
  const available = [...simulatorThreads].filter((id) => !userThreads.has(id));
  const notRecent = available.filter((id) => !recentThreads.includes(id));

  if (preferFresh || available.length < 10 || Math.random() < 0.42) {
    let newId = generateNewThreadId();
    let attempts = 0;
    while ((userThreads.has(newId) || recentThreads.includes(newId)) && attempts < 24) {
      newId = generateNewThreadId();
      attempts += 1;
    }

    if (!userThreads.has(newId)) {
      simulatorThreads.add(newId);
      rememberThread(newId);
      return newId;
    }
  }

  const pool = notRecent.length > 0 ? notRecent : available;
  if (pool.length > 0) {
    const id = randomFrom(pool);
    rememberThread(id);
    return id;
  }

  const fallback = randomFrom([...EXISTING_THREADS]);
  rememberThread(fallback);
  return fallback;
}

function getThreadEmoji(threadId) {
  if (!threadEmojis.has(threadId)) {
    threadEmojis.set(threadId, randomEmoji());
  }
  return threadEmojis.get(threadId);
}

function post(threadId, content, emoji) {
  if (userThreads.has(threadId) || !canSimPost()) return;
  createMessage(threadId, content, emoji || getThreadEmoji(threadId));
}

function runMultiLineConversation(threadId, lines, baseDelay = 120) {
  if (userThreads.has(threadId)) return;
  let delay = 0;
  const emojis = shuffle(lines.map(() => randomEmoji()));

  for (let i = 0; i < lines.length; i += 1) {
    const content = lines[i];
    const emoji = emojis[i] || randomEmoji();
    setTimeout(() => {
      try {
        if (simulatorEnabled && !userThreads.has(threadId)) post(threadId, content, emoji);
      } catch (err) {
        console.error('Simulator multi-line error:', err);
      }
    }, delay);
    delay += baseDelay + Math.random() * (baseDelay * 2.2);
  }
}

function runDuoConversation(threadId, pair) {
  if (userThreads.has(threadId)) return;
  const [first, second] = pair;
  const emojiA = randomEmoji();
  let emojiB = randomEmoji();
  while (emojiB === emojiA) emojiB = randomEmoji();
  post(threadId, first, emojiA);
  setTimeout(() => {
    try {
      if (simulatorEnabled && !userThreads.has(threadId)) post(threadId, second, emojiB);
    } catch (err) {
      console.error('Simulator duo error:', err);
    }
  }, 90 + Math.random() * 280);
}

function runGroupConversation(threadId, lines) {
  if (userThreads.has(threadId)) return;
  let delay = 0;
  for (const line of lines) {
    const [emoji, content] = line;
    setTimeout(() => {
      try {
        if (simulatorEnabled && !userThreads.has(threadId)) post(threadId, content, emoji);
      } catch (err) {
        console.error('Simulator group error:', err);
      }
    }, delay);
    delay += 100 + Math.random() * 240;
  }
}

function pickDuoConversation() {
  const idx = duoPool.items.findIndex((_, i) => !duoPool.used.has(i));
  if (idx === -1) {
    duoPool.used.clear();
    return duoPool.items[Math.floor(Math.random() * duoPool.items.length)];
  }
  duoPool.used.add(idx);
  return duoPool.items[idx];
}

function pickGroupConversation() {
  const idx = groupPool.items.findIndex((_, i) => !groupPool.used.has(i));
  if (idx === -1) {
    groupPool.used.clear();
    return groupPool.items[Math.floor(Math.random() * groupPool.items.length)];
  }
  groupPool.used.add(idx);
  return groupPool.items[idx];
}

function pickTrioConversation() {
  const idx = trioPool.items.findIndex((_, i) => !trioPool.used.has(i));
  if (idx === -1) {
    trioPool.used.clear();
    return trioPool.items[Math.floor(Math.random() * trioPool.items.length)];
  }
  trioPool.used.add(idx);
  return trioPool.items[idx];
}

function tick() {
  if (!simulatorEnabled) {
    setTimeout(tick, 5000);
    return;
  }

  try {
    const roll = Math.random();
    const threadId = pickThreadId(roll > 0.55);

    if (userThreads.has(threadId)) {
      setTimeout(tick, 1200 + Math.random() * 2000);
      return;
    }

    if (roll < 0.28) {
      runGroupConversation(threadId, pickGroupConversation());
    } else if (roll < 0.58) {
      runDuoConversation(threadId, pickDuoConversation());
    } else if (roll < 0.68) {
      runMultiLineConversation(threadId, pickTrioConversation(), 110);
    } else if (roll < 0.84) {
      const msg = pickFromCategory();
      post(threadId, msg, randomEmoji());
      if (Math.random() < 0.55) {
        setTimeout(() => {
          try {
            if (simulatorEnabled && !userThreads.has(threadId)) {
              const reply = pickFromCategory();
              post(threadId, reply, randomEmoji());
            }
          } catch (err) {
            console.error('Simulator reply error:', err);
          }
        }, 140 + Math.random() * 360);
      }
      if (Math.random() < 0.22) {
        setTimeout(() => {
          try {
            if (simulatorEnabled && !userThreads.has(threadId)) {
              post(threadId, pickFromCategory(), randomEmoji());
            }
          } catch (err) {
            console.error('Simulator third-line error:', err);
          }
        }, 480 + Math.random() * 620);
      }
    } else {
      post(threadId, pickFromCategory(), randomEmoji());
    }
  } catch (err) {
    console.error('Simulator tick error:', err);
  }

  const next = 1100 + Math.random() * 2400;
  setTimeout(tick, next);
}

export function startSimulator() {
  console.log('FLUXGRID simulator active — main grid only, user channels excluded');
  setTimeout(tick, 180);
}