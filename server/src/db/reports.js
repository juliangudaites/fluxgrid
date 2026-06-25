import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { randomUUID } from 'crypto';
import { config } from '../config.js';
import { hideMessage, getMessageById } from './store.js';

const reportsPath = config.reportsPath;

function ensureReports() {
  const dir = dirname(reportsPath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  if (!existsSync(reportsPath)) {
    writeFileSync(reportsPath, JSON.stringify({ reports: [] }, null, 2));
  }
}

function readReports() {
  ensureReports();
  return JSON.parse(readFileSync(reportsPath, 'utf-8'));
}

function writeReports(data) {
  ensureReports();
  writeFileSync(reportsPath, JSON.stringify(data, null, 2));
}

export function createReport({ messageId, threadId, category }) {
  const store = readReports();
  const message = getMessageById(messageId);

  const report = {
    id: randomUUID(),
    messageId,
    threadId,
    category,
    status: 'pending',
    timestamp: new Date().toISOString(),
    messageContent: message?.content?.slice(0, 500) ?? '[message not found]',
    messageSnapshot: message
      ? {
          content: message.content,
          timestamp: message.timestamp,
          status: message.status,
        }
      : null,
  };

  hideMessage(messageId, `report:${category}`);
  report.action = 'hidden_pending_review';
  report.status = 'pending';

  store.reports.unshift(report);
  writeReports(store);
  return report;
}

export function getReports(status) {
  const all = readReports().reports;
  if (!status) return all;
  return all.filter((r) => r.status === status);
}

export function getReportById(id) {
  return readReports().reports.find((r) => r.id === id) ?? null;
}

export function updateReport(id, updates) {
  const store = readReports();
  const idx = store.reports.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  store.reports[idx] = { ...store.reports[idx], ...updates, reviewedAt: new Date().toISOString() };
  writeReports(store);
  return store.reports[idx];
}

export function getReportStats() {
  const all = readReports().reports;
  return {
    total: all.length,
    pending: all.filter((r) => r.status === 'pending').length,
    confirmed: all.filter((r) => r.status === 'confirmed').length,
    dismissed: all.filter((r) => r.status === 'dismissed').length,
  };
}