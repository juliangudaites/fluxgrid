import Stripe from 'stripe';
import { config } from '../config.js';

let stripeClient = null;

export function isStripeConfigured() {
  return Boolean(config.stripeSecretKey?.trim());
}

function getStripe() {
  if (!isStripeConfigured()) {
    throw new Error('Stripe not configured');
  }
  if (!stripeClient) {
    stripeClient = new Stripe(config.stripeSecretKey.trim());
  }
  return stripeClient;
}

export function getPublicAppUrl(req) {
  if (config.publicAppUrl) return config.publicAppUrl.replace(/\/$/, '');
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'https';
  const host = req.headers['x-forwarded-host'] || req.get('host');
  return `${proto}://${host}`;
}

export function formatStripeError(err) {
  if (err?.type === 'StripeInvalidRequestError') {
    return err.message || 'Stripe request invalid';
  }
  if (err?.type === 'StripeAuthenticationError') {
    return 'Stripe API key is invalid — check STRIPE_SECRET_KEY on Render';
  }
  return err?.message || 'Stripe checkout failed';
}

export async function createTierCheckoutSession({
  subscriptionId,
  tier,
  tierLabel,
  amountUsd,
  currency,
  endorselyReferral,
  affiliateRef,
  successUrl,
  cancelUrl,
}) {
  const stripe = getStripe();
  const unitAmount = Math.round(Number(amountUsd) * 100);
  if (!Number.isFinite(unitAmount) || unitAmount < 50) {
    throw new Error('Invalid tier amount');
  }

  const metadata = {
    subscriptionId: String(subscriptionId),
    tier: String(tier),
    type: 'fluxgrid_tier',
  };
  if (endorselyReferral) metadata.endorsely_referral = String(endorselyReferral).slice(0, 200);
  if (affiliateRef) metadata.affiliate_ref = String(affiliateRef).slice(0, 100);

  const sessionParams = {
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: currency.toLowerCase(),
          unit_amount: unitAmount,
          product_data: {
            name: `FLUXGRID ${tierLabel}`,
            description: '30-day anonymous access key',
          },
        },
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata,
  };

  const ref = endorselyReferral ? String(endorselyReferral).slice(0, 200) : '';
  if (ref) sessionParams.client_reference_id = ref;

  const session = await stripe.checkout.sessions.create(sessionParams);
  return session;
}

export async function retrieveCheckoutSession(sessionId) {
  const stripe = getStripe();
  return stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['payment_intent'],
  });
}

export function verifyWebhookSignature(rawBody, signature) {
  if (!config.stripeWebhookSecret?.trim()) {
    throw new Error('STRIPE_WEBHOOK_SECRET not configured');
  }
  const stripe = getStripe();
  return stripe.webhooks.constructEvent(rawBody, signature, config.stripeWebhookSecret.trim());
}