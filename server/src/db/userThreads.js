import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';

const storePath = process.env.USER_THREADS_PATH || './data/user-threads.json';

function ensureStore() {
  const dir = dirname(storePath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  if (!existsSync(storePath)) {
    writeFileSync(storePath, JSON.stringify({ threads: [] }, null, 2));
  }
}

function readStore() {
  ensureStore();
  return JSON.parse(readFileSync(storePath, 'utf-8'));
}

function writeStore(data) {
  ensureStore();
  writeFileSync(storePath, JSON.stringify(data, null, 2));
}

export function loadUserThreads() {
  const store = readStore();
  return new Set((store.threads || []).map((id) => String(id).trim().toUpperCase()));
}

export function saveUserThread(threadId) {
  if (!threadId) return;
  const id = String(threadId).trim().toUpperCase();
  const store = readStore();
  const threads = new Set(store.threads || []);
  if (!threads.has(id)) {
    threads.add(id);
    writeStore({ threads: [...threads] });
  }
}