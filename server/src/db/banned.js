import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { config } from '../config.js';

function ensure() {
  const dir = dirname(config.bannedPath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  if (!existsSync(config.bannedPath)) {
    writeFileSync(config.bannedPath, JSON.stringify({ channels: [] }, null, 2));
  }
}

function read() {
  ensure();
  return JSON.parse(readFileSync(config.bannedPath, 'utf-8'));
}

function write(data) {
  ensure();
  writeFileSync(config.bannedPath, JSON.stringify(data, null, 2));
}

export function isChannelBanned(threadId) {
  const data = read();
  return data.channels.some((c) => c.threadId === threadId && c.active);
}

export function getBannedChannels() {
  return read().channels;
}

export function banChannel(threadId, reason = '') {
  const data = read();
  const existing = data.channels.find((c) => c.threadId === threadId);
  if (existing) {
    existing.active = true;
    existing.reason = reason;
    existing.bannedAt = new Date().toISOString();
  } else {
    data.channels.push({
      threadId,
      reason,
      active: true,
      bannedAt: new Date().toISOString(),
    });
  }
  write(data);
  return threadId;
}

export function unbanChannel(threadId) {
  const data = read();
  const ch = data.channels.find((c) => c.threadId === threadId);
  if (ch) {
    ch.active = false;
    ch.unbannedAt = new Date().toISOString();
    write(data);
    return true;
  }
  return false;
}