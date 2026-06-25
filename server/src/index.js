import app from './app.js';
import { config } from './config.js';
import { initStore } from './models/message.js';
import { expireBurnedMessages } from './db/store.js';
import { createJsonFileStore } from './db/jsonFile.js';
import { startSimulator } from './simulator.js';
import { getBtcRates } from './services/rates.js';

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
  console.log(`Paid tiers: ${tipsOn ? 'LIVE (SIGNAL/PULSE/FLUX via Bitcoin access keys)' : 'disabled — set BITCOIN_TIP_ADDRESS in .env'}`);
  if (config.adminPin === '1373') {
    console.warn('WARNING: Change ADMIN_PIN in .env before going live!');
  }
  startSimulator();
  setInterval(() => expireBurnedMessages(), 30_000);
});