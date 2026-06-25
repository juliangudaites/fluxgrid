import { randomUUID } from 'crypto';
import { createJsonFileStore } from './jsonFile.js';

const tipsPath = process.env.TIPS_PATH || './data/tips.json';
const file = createJsonFileStore(tipsPath, { tips: [] });

function readStore() {
  return file.read();
}

function writeStore(data) {
  file.write(data);
}

export function createTipRecord(data) {
  const store = readStore();
  const tip = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    status: 'pending',
    ...data,
  };
  store.tips.unshift(tip);
  if (store.tips.length > 5000) store.tips = store.tips.slice(0, 5000);
  writeStore(store);
  return tip;
}

export function updateTipStatus(tipId, status, extra = {}) {
  const store = readStore();
  const tip = store.tips.find((t) => t.id === tipId);
  if (!tip) return null;
  tip.status = status;
  tip.updatedAt = new Date().toISOString();
  Object.assign(tip, extra);
  writeStore(store);
  return tip;
}

export function getTipById(tipId) {
  const store = readStore();
  return store.tips.find((t) => t.id === tipId) ?? null;
}

export function getTipsAdmin(limit = 100) {
  const store = readStore();
  return store.tips.slice(0, limit);
}