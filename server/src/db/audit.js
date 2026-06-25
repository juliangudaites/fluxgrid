import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { randomUUID } from 'crypto';
import { config } from '../config.js';

function ensure() {
  const dir = dirname(config.auditPath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  if (!existsSync(config.auditPath)) {
    writeFileSync(config.auditPath, JSON.stringify({ logs: [] }, null, 2));
  }
}

function read() {
  ensure();
  return JSON.parse(readFileSync(config.auditPath, 'utf-8'));
}

function write(data) {
  ensure();
  const trimmed = { logs: data.logs.slice(-500) };
  writeFileSync(config.auditPath, JSON.stringify(trimmed, null, 2));
}

export function logAction(action, details = {}) {
  const data = read();
  data.logs.push({
    id: randomUUID(),
    action,
    details,
    timestamp: new Date().toISOString(),
  });
  write(data);
  return data.logs[data.logs.length - 1];
}

export function getAuditLogs(limit = 100) {
  const data = read();
  return data.logs.slice(-limit).reverse();
}