import { createJsonFileStore } from './jsonFile.js';

const threadsPath = process.env.THREADS_PATH || './data/threads.json';
const file = createJsonFileStore(threadsPath, { threads: {} });

function readStore() {
  return file.read();
}

function writeStore(data) {
  file.write(data);
}

function getOrCreateThread(store, threadId) {
  if (!store.threads[threadId]) {
    store.threads[threadId] = {
      locked: false,
      participants: [],
      lockedAt: null,
      pinnedMessageId: null,
      priorityChannel: false,
    };
  }
  if (store.threads[threadId].pinnedMessageId === undefined) {
    store.threads[threadId].pinnedMessageId = null;
  }
  if (store.threads[threadId].priorityChannel === undefined) {
    store.threads[threadId].priorityChannel = false;
  }
  return store.threads[threadId];
}

export function getThreadMeta(threadId) {
  const store = readStore();
  const meta = store.threads[threadId];
  if (!meta) {
    return {
      threadId,
      locked: false,
      participants: [],
      lockedAt: null,
      pinnedMessageId: null,
      priorityChannel: false,
    };
  }
  return {
    threadId,
    locked: Boolean(meta.locked),
    participants: [...(meta.participants || [])],
    lockedAt: meta.lockedAt ?? null,
    pinnedMessageId: meta.pinnedMessageId ?? null,
    priorityChannel: Boolean(meta.priorityChannel),
  };
}

export function setThreadPriority(threadId, enabled = true) {
  const store = readStore();
  const thread = getOrCreateThread(store, threadId);
  thread.priorityChannel = Boolean(enabled);
  writeStore(store);
  return getThreadMeta(threadId);
}

export function pinThreadMessage(threadId, messageId) {
  const store = readStore();
  const thread = getOrCreateThread(store, threadId);
  thread.pinnedMessageId = messageId;
  writeStore(store);
  return getThreadMeta(threadId);
}

export function unpinThreadMessage(threadId) {
  const store = readStore();
  const thread = getOrCreateThread(store, threadId);
  thread.pinnedMessageId = null;
  writeStore(store);
  return getThreadMeta(threadId);
}

export function registerParticipant(threadId, senderEmoji) {
  if (!senderEmoji) return getThreadMeta(threadId);
  const store = readStore();
  const thread = getOrCreateThread(store, threadId);
  if (!thread.participants.includes(senderEmoji)) {
    thread.participants.push(senderEmoji);
    writeStore(store);
  }
  return getThreadMeta(threadId);
}

export function canPostToThread(threadId, senderEmoji) {
  const meta = getThreadMeta(threadId);
  if (!meta.locked) return { allowed: true, meta };
  if (!senderEmoji) {
    return { allowed: false, meta, reason: 'Channel is locked. Select your emoji to continue.' };
  }
  if (!meta.participants.includes(senderEmoji)) {
    return { allowed: false, meta, reason: 'Channel is locked. New participants cannot join.' };
  }
  return { allowed: true, meta };
}

export function lockThread(threadId, senderEmoji) {
  if (!senderEmoji) {
    throw new Error('Emoji required to lock channel');
  }
  const store = readStore();
  const thread = getOrCreateThread(store, threadId);
  if (!thread.participants.includes(senderEmoji)) {
    throw new Error('Only existing participants can lock this channel');
  }
  thread.locked = true;
  thread.lockedAt = new Date().toISOString();
  writeStore(store);
  return getThreadMeta(threadId);
}

export function unlockThread(threadId, senderEmoji) {
  if (!senderEmoji) {
    throw new Error('Emoji required to unlock channel');
  }
  const store = readStore();
  const thread = getOrCreateThread(store, threadId);
  if (!thread.participants.includes(senderEmoji)) {
    throw new Error('Only channel participants can unlock this channel');
  }
  thread.locked = false;
  thread.lockedAt = null;
  writeStore(store);
  return getThreadMeta(threadId);
}

export function syncParticipantsFromMessages(threadId, messages) {
  const emojis = [
    ...new Set(
      messages.map((m) => m.senderEmoji).filter(Boolean)
    ),
  ];
  if (emojis.length === 0) return getThreadMeta(threadId);
  const store = readStore();
  const thread = getOrCreateThread(store, threadId);
  let changed = false;
  for (const emoji of emojis) {
    if (!thread.participants.includes(emoji)) {
      thread.participants.push(emoji);
      changed = true;
    }
  }
  if (changed) writeStore(store);
  return getThreadMeta(threadId);
}