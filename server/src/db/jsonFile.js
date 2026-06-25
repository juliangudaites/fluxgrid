import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';

const caches = new Map();

export function createJsonFileStore(filePath, defaultData, flushMs = 150) {
  if (caches.has(filePath)) return caches.get(filePath);

  let memory = null;
  let flushTimer = null;

  function ensure() {
    const dir = dirname(filePath);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    if (!existsSync(filePath)) {
      writeFileSync(filePath, JSON.stringify(defaultData));
    }
  }

  function read() {
    if (!memory) {
      ensure();
      memory = JSON.parse(readFileSync(filePath, 'utf-8'));
    }
    return memory;
  }

  function write(data) {
    memory = data;
    if (flushTimer) clearTimeout(flushTimer);
    flushTimer = setTimeout(() => {
      writeFileSync(filePath, JSON.stringify(memory));
      flushTimer = null;
    }, flushMs);
  }

  function flush() {
    if (flushTimer) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }
    if (memory) {
      writeFileSync(filePath, JSON.stringify(memory));
    }
  }

  const store = { read, write, flush, ensure };
  caches.set(filePath, store);
  return store;
}