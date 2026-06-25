import Stripe from 'stripe';
import { config } from '../config.js';

let stripeClient = null;

export function isStripeConfigured() {
  return Boolean(config.stripeSecretKey);
}

function getStripe() {
  if (!isStripeConfigured()) {
    throw new Error('Stripe not configured');
  }
  if (!stripeClient) {
    stripeClient = new Stripe(config.stripeSecretKey, {
      apiVersion: '2024-11-20.acacia',
    });
  }
  return stripeClient;
}

export function getPublicAppUrl(req) {
  if (config.publicAppUrl) return config.publicAppUrl.replace(/\/$/, '');
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'https';
  const host = req.headers['x-forwarded-host'] || req.get('host');
  return `${proto}://${host}`;
}

export async function createTierCheckoutSession({
  subscriptionId,
  tier,
  tierLabel,
  amountUsd,
  currency,
  referral,
  affiliateRef,
  successUrl,
  cancelUrl,
}) {
  const stripe = getStripe();
  const unitAmount = Math.round(amountUsd * 100);
  if (unitAmount < 50) throw new Error('Invalid tier amount');

  const metadata = {
    subscriptionId,
    tier,
    type: 'fluxgrid_tier',
  };
  if (referral) metadata.referral = String(referral).slice(0, 200);
  if (affiliateRef) metadata.affiliate_ref = String(affiliateRef).slice(0, 100);

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    automatic_payment_methods: { enabled: true },
    line_items: [
      {
        price_data: {
          currency: currency.toLowerCase(),
          unit_amount: unitAmount,
          product_data: {
            name: `FLUXGRID ${tierLabel}`,
            description: '30-day anonymous access key — no account required',
          },
        },
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    client_reference_id: referral ? String(referral).slice(0, 200) : undefined,
    metadata,
    payment_intent_data: {
      metadata,
    },
  });

  return session;
}

export async function retrieveCheckoutSession(sessionId) {
  const stripe = getStripe();
  return stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['payment_intent'],
  });
}

export function verifyWebhookSignature(rawBody, signature) {
  const stripe = getStripe();
  return stripe.webhooks.constructEvent(rawBody, signature, config.stripeWebhookSecret);
}