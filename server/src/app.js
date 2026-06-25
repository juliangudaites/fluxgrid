import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import stripeWebhookRouter from './routes/stripeWebhook.js';
import healthRouter from './routes/health.js';
import messagesRouter from './routes/messages.js';
import reportsRouter from './routes/reports.js';
import deleteRouter from './routes/delete.js';
import adminRouter from './routes/admin.js';
import threadsRouter from './routes/threads.js';
import tiersRouter from './routes/tiers.js';
import tipsRouter from './routes/tips.js';
import { errorHandler } from './middleware/errorHandler.js';
import { globalLimiter } from './middleware/security.js';

const app = express();

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));
app.use(cors({
  origin: process.env.CORS_ORIGIN?.trim() ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim()) : true,
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Admin-Pin', 'X-Fluxgrid-Code', 'X-Fluxgrid-Device'],
}));
app.use(
  '/api/stripe/webhook',
  express.raw({ type: 'application/json' }),
  stripeWebhookRouter
);
app.use(express.json({ limit: '6mb' }));
app.use('/api', globalLimiter);

app.use('/api/health', healthRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/threads', threadsRouter);
app.use('/api/tiers', tiersRouter);
app.use('/api/tips', tipsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/delete', deleteRouter);
app.use('/api/admin', adminRouter);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.resolve(__dirname, '../../client/dist');
if (existsSync(clientDist)) {
  app.use(express.static(clientDist, { maxAge: process.env.NODE_ENV === 'production' ? '1h' : 0 }));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.use(errorHandler);

export default app;