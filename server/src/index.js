import app from './app.js';
import { config } from './config.js';
import { initStore } from './models/message.js';
import { expireBurnedMessages } from './db/store.js';
import { createJsonFileStore } from './db/jsonFile.js';
import { startSimulator } from './simulator.js';
import { getBtcRates } from './services/rates.js';
import { isStripeConfigured } from './services/stripe.js';

initStore();
void getBtcRates().catch(() => {});

function flushAllStores() {
  createJsonFileStore(config.dbPath, { messages: [] }).flush();
  createJsonFileStore(process.env.THREADS_PATH || './data/threads.json', { threads: {} }).flush();
}

process.on('SIGINT', () => { flushAllStores(); process.exit(0); });
process.on('SIGTERM', () => { flushAllStores(); process.exit(0); });

const tipsOn = Boolean(config.bitcoinTipAddress) || Boolean(config.btcpayUrl && config.btcpayStoreId);
app.listen(config.port, () => {
  console.log(`FLUXGRID API running on http://localhost:${config.port}`);
  console.log(`Production: serve built client from same port when client/dist exists`);
  console.log(`Admin portal: /admin`);
  console.log(`Bitcoin tips: ${tipsOn ? 'ENABLED' : 'disabled — set BITCOIN_TIP_ADDRESS in .env'}`);
  const stripeOn = isStripeConfigured();
  console.log(`Paid tiers: ${tipsOn || stripeOn ? 'LIVE' : 'disabled'}`);
  console.log(`  Bitcoin: ${tipsOn ? 'ENABLED' : 'disabled — set BITCOIN_TIP_ADDRESS'}`);
  console.log(`  Stripe (card/Apple Pay): ${stripeOn ? 'ENABLED' : 'disabled — set STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET'}`);
  if (config.adminPin === '1373') {
    console.warn('WARNING: Change ADMIN_PIN in .env before going live!');
  }
  startSimulator();
  setInterval(() => expireBurnedMessages(), 30_000);
});