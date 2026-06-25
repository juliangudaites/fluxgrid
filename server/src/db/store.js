import { randomUUID } from 'crypto';
import { config } from '../config.js';
import { isChannelBanned } from './banned.js';
import { getThreadMeta } from './threads.js';
import { createJsonFileStore } from './jsonFile.js';

const file = createJsonFileStore(config.dbPath, { messages: [] });

const LIST_CACHE_MS = 2000;
const THREAD_CACHE_MS = 2000;
let publicListCache = null;
let publicListCacheAt = 0;
const threadListCache = new Map();

function readStore() {
  return file.read();
}

function invalidateCaches() {
  publicListCache = null;
  publicListCacheAt = 0;
  threadListCache.clear();
}

function writeStore(data) {
  invalidateCaches();
  file.write(data);
}

function pruneMessages(store) {
  const max = config.maxMessages;
  if (store.messages.length <= max) return;

  const priority = (m) => {
    const st = m.status ?? 'active';
    if (st === 'removed') return 0;
    if (st === 'hidden') return 1;
    return 2;
  };

  const sorted = [...store.messages].sort((a, b) => {
    const p = priority(a) - priority(b);
    if (p !== 0) return p;
    return new Date(a.timestamp) - new Date(b.timestamp);
  });

  const toRemove = store.messages.length - max;
  const dropIds = new Set(sorted.slice(0, toRemove).map((m) => m.id));
  store.messages = store.messages.filter((m) => !dropIds.has(m.id));
}

function stripForPublic(message, { includeAttachments = true } = {}) {
  const { deleteToken, reportCount, hiddenAt, attachmentUrl, attachmentType, ...rest } = message;
  const pub = { ...rest };
  if (includeAttachments && attachmentUrl && attachmentType) {
    pub.attachmentType = attachmentType;
    pub.attachmentUrl = attachmentUrl;
  }
  return pub;
}

function getCachedPublicList() {
  const now = Date.now();
  if (publicListCache && now - publicListCacheAt < LIST_CACHE_MS) {
    return publicListCache;
  }

  const store = readStore();
  const list = [];
  for (const m of store.messages) {
    if (isPublic(m)) list.push(m);
  }
  list.sort((a, b) => {
    if (a.boosted && !b.boosted) return -1;
    if (!a.boosted && b.boosted) return 1;
    return new Date(b.timestamp) - new Date(a.timestamp);
  });

  publicListCache = list;
  publicListCacheAt = now;
  return list;
}

function isBurned(message) {
  return message.burnAt && new Date(message.burnAt).getTime() <= Date.now();
}

function isPublic(message) {
  return (
    (message.status ?? 'active') === 'active' &&
    !isChannelBanned(message.threadId) &&
    !isBurned(message)
  );
}

export function createMessage(threadId, content, senderEmoji = null, options = {}) {
  if (isChannelBanned(threadId)) {
    throw new Error('Channel is banned');
  }
  const store = readStore();
  const message = {
    id: randomUUID(),
    threadId,
    content,
    timestamp: options.timestamp || new Date().toISOString(),
    deleteToken: randomUUID(),
    status: 'active',
    reportCount: 0,
    ...(senderEmoji ? { senderEmoji } : {}),
    ...(options.burnAt ? { burnAt: options.burnAt } : {}),
    ...(options.boosted ? { boosted: true } : {}),
    ...(options.deepVoid ? { deepVoid: true } : {}),
    ...(options.tier ? { tier: options.tier } : {}),
    ...(options.attachmentType ? { attachmentType: options.attachmentType } : {}),
    ...(options.attachmentUrl ? { attachmentUrl: options.attachmentUrl } : {}),
    ...(options.pinned ? { pinned: true } : {}),
    ...(options.priorityStyle ? { priorityStyle: true } : {}),
  };
  store.messages.push(message);
  pruneMessages(store);
  writeStore(store);
  const { deleteToken, ...publicMessage } = message;
  return { ...publicMessage, deleteToken };
}

export function hideMessage(messageId, reason = 'reported') {
  const store = readStore();
  const msg = store.messages.find((m) => m.id === messageId);
  if (!msg) return null;
  msg.status = 'hidden';
  msg.hiddenAt = new Date().toISOString();
  msg.hiddenReason = reason;
  msg.reportCount = (msg.reportCount || 0) + 1;
  writeStore(store);
  return msg;
}

export function restoreMessage(messageId) {
  const store = readStore();
  const msg = store.messages.find((m) => m.id === messageId);
  if (!msg) return null;
  msg.status = 'active';
  delete msg.hiddenAt;
  delete msg.hiddenReason;
  writeStore(store);
  return msg;
}

export function confirmRemoveMessage(messageId) {
  const store = readStore();
  const msg = store.messages.find((m) => m.id === messageId);
  if (!msg) return null;
  msg.status = 'removed';
  msg.removedAt = new Date().toISOString();
  writeStore(store);
  return msg;
}

export function removeMessage(messageId) {
  const store = readStore();
  const before = store.messages.length;
  store.messages = store.messages.filter((m) => m.id !== messageId);
  if (store.messages.length < before) {
    writeStore(store);
    return true;
  }
  return false;
}

export function deleteMessageByToken(messageId, deleteToken) {
  const store = readStore();
  const idx = store.messages.findIndex(
    (m) => m.id === messageId && m.deleteToken === deleteToken
  );
  if (idx === -1) return false;
  store.messages.splice(idx, 1);
  writeStore(store);
  return true;
}

export function getMessageById(messageId) {
  const store = readStore();
  return store.messages.find((m) => m.id === messageId) ?? null;
}

export function getAllMessages(limit = 100, offset = 0, includeHidden = false) {
  if (includeHidden) {
    const store = readStore();
    const sorted = [...store.messages].sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );
    return {
      messages: sorted.slice(offset, offset + limit).map((m) => stripForPublic(m)),
      total: store.messages.length,
      limit,
      offset,
    };
  }

  const list = getCachedPublicList();
  return {
    messages: list.slice(offset, offset + limit).map((m) => stripForPublic(m, { includeAttachments: false })),
    total: list.length,
    limit,
    offset,
    serverTime: new Date().toISOString(),
  };
}

/** Lightweight delta for live feed — scans newest-first without full list sort. */
export function getLiveMessages(sinceIso, limit = 20) {
  const sinceMs = sinceIso ? new Date(sinceIso).getTime() : 0;
  const safeLimit = Math.min(Math.max(limit, 1), 40);
  const store = readStore();
  const fresh = [];

  for (let i = store.messages.length - 1; i >= 0; i -= 1) {
    const m = store.messages[i];
    if (!isPublic(m) || m.deepVoid) continue;
    if (sinceMs > 0 && new Date(m.timestamp).getTime() <= sinceMs) break;
    fresh.push(m);
    if (fresh.length >= safeLimit) break;
  }

  const total = publicListCache?.length ?? store.messages.length;

  return {
    messages: fresh.map((m) => stripForPublic(m, { includeAttachments: false })),
    total,
    serverTime: new Date().toISOString(),
    delta: true,
  };
}

export function getAllMessagesAdmin(limit = 500, offset = 0) {
  const store = readStore();
  const sorted = [...store.messages].sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  );
  return {
    messages: sorted.slice(offset, offset + limit),
    total: store.messages.length,
    limit,
    offset,
  };
}

export function getThreadMessages(threadId, limit = 200) {
  if (isChannelBanned(threadId)) {
    return { threadId, messages: [], count: 0, pinnedMessageId: null, priorityChannel: false };
  }
  const meta = getThreadMeta(threadId);
  const now = Date.now();
  const cached = threadListCache.get(threadId);
  let messages;
  if (cached && now - cached.at < THREAD_CACHE_MS) {
    messages = cached.messages;
  } else {
    const store = readStore();
    messages = store.messages
      .filter((m) => m.threadId === threadId && isPublic(m))
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    threadListCache.set(threadId, { messages, at: now });
  }

  if (meta.pinnedMessageId) {
    const pinnedIdx = messages.findIndex((m) => m.id === meta.pinnedMessageId);
    if (pinnedIdx > -1) {
      const [pinned] = messages.splice(pinnedIdx, 1);
      messages = [pinned, ...messages];
    }
  }

  const sliced = messages.slice(0, limit).map(stripForPublic);
  return {
    threadId,
    messages: sliced,
    count: sliced.length,
    pinnedMessageId: meta.pinnedMessageId,
    priorityChannel: meta.priorityChannel,
  };
}

export function pinMessage(messageId) {
  const store = readStore();
  const msg = store.messages.find((m) => m.id === messageId);
  if (!msg || !isPublic(msg)) return null;
  for (const m of store.messages) {
    if (m.threadId === msg.threadId) m.pinned = false;
  }
  msg.pinned = true;
  writeStore(store);
  return msg;
}

export function getFeed(mode = 'mixed', limit = 20, previewLen = 120) {
  const all = getCachedPublicList();
  const safeLimit = Math.min(Math.max(limit, 1), 50);
  let selected = [];

  if (mode === 'recent') {
    selected = all
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, safeLimit);
  } else if (mode === 'random') {
    selected = shuffle(all).slice(0, safeLimit);
  } else {
    const half = Math.ceil(safeLimit / 2);
    const recent = all
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, half);
    const random = shuffle(all).slice(0, half);
    const seen = new Set();
    selected = [...recent, ...random]
      .filter((m) => {
        if (seen.has(m.id)) return false;
        seen.add(m.id);
        return true;
      })
      .slice(0, safeLimit);
  }

  const feed = selected.map((m) => {
    const pub = stripForPublic(m);
    return {
      ...pub,
      content:
        pub.content.length <= previewLen
          ? pub.content
          : pub.content.slice(0, previewLen).trimEnd() + '…',
      preview: pub.content.length > previewLen,
    };
  });

  return { feed, mode, limit: safeLimit };
}

export function expireBurnedMessages() {
  const store = readStore();
  let count = 0;
  const now = Date.now();
  for (const m of store.messages) {
    if (m.burnAt && new Date(m.burnAt).getTime() <= now && (m.status ?? 'active') === 'active') {
      m.status = 'removed';
      m.removedAt = new Date().toISOString();
      m.hiddenReason = 'burned';
      count++;
    }
  }
  if (count > 0) writeStore(store);
  return count;
}

export function getStats() {
  const store = readStore();
  const messages = store.messages;
  const channels = new Set(messages.map((m) => m.threadId));
  const burning = messages.filter((m) => m.burnAt && !isBurned(m) && (m.status ?? 'active') === 'active');
  const burned = messages.filter((m) => m.hiddenReason === 'burned' || (m.burnAt && isBurned(m)));
  return {
    total: messages.length,
    active: messages.filter((m) => (m.status ?? 'active') === 'active').length,
    hidden: messages.filter((m) => m.status === 'hidden').length,
    removed: messages.filter((m) => m.status === 'removed').length,
    channels: channels.size,
    burning: burning.length,
    burned: burned.length,
    boosted: messages.filter((m) => m.boosted && isPublic(m)).length,
    withAttachments: messages.filter((m) => m.attachmentUrl && isPublic(m)).length,
    pinned: messages.filter((m) => m.pinned && isPublic(m)).length,
    priorityChannels: new Set(
      messages.filter((m) => m.priorityStyle).map((m) => m.threadId)
    ).size,
  };
}

export function getChannelStats() {
  const store = readStore();
  const map = new Map();
  for (const m of store.messages) {
    if (!map.has(m.threadId)) {
      map.set(m.threadId, { threadId: m.threadId, total: 0, active: 0, hidden: 0, removed: 0 });
    }
    const c = map.get(m.threadId);
    c.total++;
    const st = m.status ?? 'active';
    if (st === 'active') c.active++;
    else if (st === 'hidden') c.hidden++;
    else if (st === 'removed') c.removed++;
  }
  return [...map.values()].sort((a, b) => b.total - a.total);
}

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const LAUNCH_SOFT_CAP = 4000;

export function initStore() {
  file.ensure();
  const store = readStore();
  let changed = false;

  for (const m of store.messages) {
    if (!m.status) {
      m.status = 'active';
      m.reportCount = m.reportCount ?? 0;
      changed = true;
    }
  }

  if (store.messages.length > LAUNCH_SOFT_CAP) {
    pruneMessages(store);
    if (store.messages.length > LAUNCH_SOFT_CAP) {
      const active = store.messages
        .filter((m) => (m.status ?? 'active') === 'active')
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      const keepIds = new Set(active.slice(0, LAUNCH_SOFT_CAP).map((m) => m.id));
      const before = store.messages.length;
      store.messages = store.messages.filter((m) => keepIds.has(m.id));
      if (store.messages.length < before) {
        console.log(`Pruned messages ${before} → ${store.messages.length} for performance`);
        changed = true;
      }
    }
  }

  if (changed) {
    invalidateCaches();
    file.write(store);
    file.flush();
  }
}