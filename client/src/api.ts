import { fetchJson } from './api/fetch';
import { tierHeaders } from './api/tierHeaders';
import type { TierCaps, TierId } from './tiers/tiers';
import type { FeedResponse, Message, ThreadMeta, ThreadResponse, TransmitOptions } from './types';

export type ReportCategory =
  | 'csam'
  | 'grooming'
  | 'threat'
  | 'illegal'
  | 'harassment'
  | 'spam';

export interface PostMessageResult {
  message: Message & { deleteToken?: string };
  threadMeta?: ThreadMeta;
}

export async function fetchFeed(limit = 40): Promise<FeedResponse> {
  return fetchJson<FeedResponse>(`/api/messages/feed?mode=recent&limit=${limit}`);
}

export interface FeedSnapshot {
  messages: Message[];
  total: number;
  serverTime?: string;
}

export async function fetchRecentMessages(limit = 100): Promise<FeedSnapshot> {
  return fetchJson<FeedSnapshot>(`/api/messages?limit=${limit}`);
}

export async function fetchLiveMessages(since: string, limit = 20): Promise<FeedSnapshot & { delta?: boolean }> {
  const params = new URLSearchParams({ since, limit: String(limit) });
  return fetchJson<FeedSnapshot & { delta?: boolean }>(`/api/messages/live?${params}`, { timeoutMs: 6_000 });
}

export async function fetchThread(threadId: string): Promise<ThreadResponse> {
  return fetchJson<ThreadResponse>(`/api/messages/thread/${encodeURIComponent(threadId)}`);
}

export async function fetchThreadMeta(threadId: string): Promise<ThreadMeta> {
  return fetchJson<ThreadMeta>(`/api/threads/${encodeURIComponent(threadId)}`);
}

export async function lockThread(threadId: string, senderEmoji: string): Promise<ThreadMeta> {
  return fetchJson<ThreadMeta>(`/api/threads/${encodeURIComponent(threadId)}/lock`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ senderEmoji }),
  });
}

export async function unlockThread(threadId: string, senderEmoji: string): Promise<ThreadMeta> {
  return fetchJson<ThreadMeta>(`/api/threads/${encodeURIComponent(threadId)}/unlock`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ senderEmoji }),
  });
}

export async function postMessage(
  threadId: string,
  content: string,
  senderEmoji?: string | null,
  options?: TransmitOptions
): Promise<PostMessageResult> {
  return fetchJson<PostMessageResult>('/api/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...tierHeaders() },
    body: JSON.stringify({
      threadId,
      content,
      ...(senderEmoji ? { senderEmoji } : {}),
      ...(options?.burnAfterSeconds ? { burnAfterSeconds: options.burnAfterSeconds } : {}),
      ...(options?.pinMessage ? { pinMessage: true } : {}),
      ...(options?.attachmentData
        ? { attachmentData: options.attachmentData, attachmentType: options.attachmentType ?? 'image' }
        : {}),
      ...(options?.priorityStyle ? { priorityStyle: true } : {}),
    }),
    timeoutMs: 30_000,
  });
}

export interface TierCatalogTier {
  id: TierId;
  name: string;
  priceUsd: number;
  priceBrl: number;
  price: string;
  tagline: string;
  featured?: boolean;
  caps: TierCaps;
}

export interface TierRedeemResult {
  tier: TierId;
  caps: TierCaps;
  accessCode: string;
  expiresAt?: string | null;
  label: string;
}

export interface DeviceSessionInfo {
  deviceId: string;
  label: string;
  lastSeen: string;
  isCurrent?: boolean;
}

export async function redeemTierAccess(code: string): Promise<
  TierRedeemResult & { sessions?: DeviceSessionInfo[]; maxDevices?: number }
> {
  return fetchJson('/api/tiers/redeem', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...tierHeaders() },
    body: JSON.stringify({ code }),
    timeoutMs: 8_000,
  });
}

export async function fetchTierSessions(): Promise<{
  sessions: DeviceSessionInfo[];
  maxDevices: number;
}> {
  return fetchJson('/api/tiers/sessions', { headers: tierHeaders(), timeoutMs: 8_000 });
}

export async function revokeTierSession(deviceId: string): Promise<
  TierRedeemResult & {
    sessions: DeviceSessionInfo[];
    maxDevices?: number;
    registered?: boolean;
    disconnected?: string;
  }
> {
  const code = tierHeaders()['X-Fluxgrid-Code'];
  return fetchJson('/api/tiers/sessions/revoke', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...tierHeaders() },
    body: JSON.stringify({ deviceId, ...(code ? { accessCode: code } : {}) }),
    timeoutMs: 8_000,
  });
}

export async function fetchTierMe(): Promise<TierRedeemResult & { source: string }> {
  return fetchJson('/api/tiers/me', { headers: tierHeaders(), timeoutMs: 8_000 });
}

export interface TierPaymentConfig {
  enabled: boolean;
  paymentMethods: { bitcoin: boolean; stripe: boolean };
  subscriptionDays: number;
}

export interface TierInvoice {
  mode: 'btcpay' | 'static' | 'stripe';
  subscriptionId: string;
  tier: TierId;
  tierLabel: string;
  address?: string;
  amountBtc?: string;
  amountUsd: number;
  amountBrl: number;
  paymentUri?: string;
  checkoutUrl?: string;
  invoiceId?: string;
  stripeSessionId?: string;
  currency: string;
  message?: string;
}

export async function fetchTierPaymentConfig(): Promise<TierPaymentConfig> {
  return fetchJson<TierPaymentConfig>('/api/tiers/config', { timeoutMs: 8_000 });
}

export async function createTierInvoice(tier: TierId, currency: 'USD' | 'BRL' = 'USD'): Promise<TierInvoice> {
  return fetchJson<TierInvoice>('/api/tiers/invoice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tier, currency }),
    timeoutMs: 12_000,
  });
}

export async function createStripeTierCheckout(
  tier: TierId,
  currency: 'USD' | 'BRL' = 'USD',
  opts?: { endorselyReferral?: string; affiliateRef?: string }
): Promise<TierInvoice> {
  return fetchJson<TierInvoice>('/api/tiers/stripe/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tier,
      currency,
      endorselyReferral: opts?.endorselyReferral,
      affiliateRef: opts?.affiliateRef,
    }),
    timeoutMs: 12_000,
  });
}

export async function completeStripeTierCheckout(sessionId: string): Promise<{
  paid: boolean;
  status: string;
  accessCode?: string;
  tier?: TierId;
  tierLabel?: string;
  expiresAt?: string;
  caps?: TierCaps;
}> {
  return fetchJson(`/api/tiers/stripe/complete?session_id=${encodeURIComponent(sessionId)}`, {
    timeoutMs: 12_000,
  });
}

export async function pollTierPaymentStatus(subscriptionId: string): Promise<{
  paid: boolean;
  status: string;
  accessCode?: string;
  tier?: TierId;
  tierLabel?: string;
  expiresAt?: string;
  caps?: TierCaps;
}> {
  return fetchJson(`/api/tiers/invoice/${encodeURIComponent(subscriptionId)}/status`, {
    timeoutMs: 10_000,
  });
}

export async function submitReport(
  messageId: string,
  threadId: string,
  category: ReportCategory
): Promise<void> {
  await fetchJson('/api/reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messageId, threadId, category }),
  });
}

export interface TipConfig {
  enabled: boolean;
  mode: 'btcpay' | 'static' | 'disabled';
  hasAddress: boolean;
  btcpay: boolean;
  currencies: string[];
  minUsd: number;
  maxUsd: number;
  minBrl: number;
  maxBrl: number;
  presetUsd: number[];
}

export interface TipRates {
  usd: number;
  brl: number;
  updatedAt: string | null;
  fallback?: boolean;
}

export interface TipInvoice {
  mode: 'btcpay' | 'static';
  tipId: string;
  invoiceId?: string;
  checkoutUrl?: string;
  address?: string;
  amountBtc: string;
  amountUsd: number;
  amountBrl: number;
  paymentUri?: string;
  currency: string;
}

export async function fetchTipConfig(): Promise<TipConfig> {
  return fetchJson<TipConfig>('/api/tips/config', { timeoutMs: 8_000 });
}

export async function fetchTipRates(): Promise<TipRates> {
  return fetchJson<TipRates>('/api/tips/rates', { timeoutMs: 8_000 });
}

export async function createTipInvoice(body: {
  amountUsd?: number;
  amountBrl?: number;
}): Promise<TipInvoice> {
  return fetchJson<TipInvoice>('/api/tips/invoice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    timeoutMs: 12_000,
  });
}

export async function pollTipStatus(tipId: string): Promise<{ paid: boolean; status: string }> {
  return fetchJson<{ paid: boolean; status: string }>(
    `/api/tips/invoice/${encodeURIComponent(tipId)}/status`,
    { timeoutMs: 8_000 }
  );
}

export { generateThreadId } from './channelId';