import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

export const config = {
  port: Number(process.env.PORT) || 3001,
  dbPath: process.env.DB_PATH || './data/messages.json',
  maxMessages: Number(process.env.MAX_MESSAGES) || 30_000,
  reportsPath: process.env.REPORTS_PATH || './data/reports.json',
  adminPin: process.env.ADMIN_PIN || '1373',
  bannedPath: process.env.BANNED_PATH || './data/banned.json',
  auditPath: process.env.AUDIT_PATH || './data/audit.json',
  bitcoinTipAddress: process.env.BITCOIN_TIP_ADDRESS || '',
  btcpayUrl: process.env.BTCPAY_URL || '',
  btcpayStoreId: process.env.BTCPAY_STORE_ID || '',
  btcpayApiKey: process.env.BTCPAY_API_KEY || '',
  tipSuccessUrl: process.env.TIP_SUCCESS_URL || '',
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  publicAppUrl: process.env.PUBLIC_APP_URL || process.env.RENDER_EXTERNAL_URL || '',
};