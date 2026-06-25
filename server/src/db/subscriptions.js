import { randomUUID, randomBytes } from 'crypto';
import { createJsonFileStore } from './jsonFile.js';

const subsPath = process.env.SUBSCRIPTIONS_PATH || './data/subscriptions.json';
const file = createJsonFileStore(subsPath, { subscriptions: [] });

const SUBSCRIPTION_DAYS = 30;

function readStore() {
  return file.read();
}

function writeStore(data) {
  file.write(data);
}

export function generateAccessCode(tier) {
  const tag = String(tier).toUpperCase().slice(0, 4).padEnd(4, 'X');
  const a = randomBytes(2).toString('hex').toUpperCase();
  const b = randomBytes(2).toString('hex').toUpperCase();
  const c = randomBytes(2).toString('hex').toUpperCase();
  return `FG-${tag}-${a}-${b}-${c}`;
}

export function createSubscription(data) {
  const store = readStore();
  const sub = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    status: 'pending',
    accessCode: null,
    paidAt: null,
    expiresAt: null,
    ...data,
  };
  store.subscriptions.unshift(sub);
  if (store.subscriptions.length > 10_000) {
    store.subscriptions = store.subscriptions.slice(0, 10_000);
  }
  writeStore(store);
  return sub;
}

export function getSubscriptionById(id) {
  const store = readStore();
  return store.subscriptions.find((s) => s.id === id) ?? null;
}

export function getActiveSubscriptionByCode(code) {
  if (!code) return null;
  const normalized = String(code).trim().toUpperCase();
  const store = readStore();
  const sub = store.subscriptions.find(
    (s) => s.accessCode === normalized && s.status === 'paid'
  );
  if (!sub) return null;
  if (sub.expiresAt && new Date(sub.expiresAt).getTime() <= Date.now()) {
    sub.status = 'expired';
    writeStore(store);
    return null;
  }
  return sub;
}

export function markSubscriptionPaid(subId, extra = {}) {
  const store = readStore();
  const sub = store.subscriptions.find((s) => s.id === subId);
  if (!sub) return null;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SUBSCRIPTION_DAYS * 24 * 60 * 60 * 1000);
  sub.status = 'paid';
  sub.paidAt = now.toISOString();
  sub.expiresAt = expiresAt.toISOString();
  sub.accessCode = sub.accessCode || generateAccessCode(sub.tier);
  Object.assign(sub, extra);
  writeStore(store);
  return sub;
}

export function updateSubscription(subId, patch) {
  const store = readStore();
  const sub = store.subscriptions.find((s) => s.id === subId);
  if (!sub) return null;
  Object.assign(sub, patch);
  sub.updatedAt = new Date().toISOString();
  writeStore(store);
  return sub;
}

export function getSubscriptionsAdmin(limit = 100) {
  const store = readStore();
  return store.subscriptions.slice(0, limit);
}