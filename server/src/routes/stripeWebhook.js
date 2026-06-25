import { Router } from 'express';
import { verifyWebhookSignature } from '../services/stripe.js';
import { markSubscriptionPaid, getSubscriptionById } from '../db/subscriptions.js';

const router = Router();

router.post('/', async (req, res) => {
  const signature = req.headers['stripe-signature'];
  if (!signature) {
    return res.status(400).send('Missing stripe-signature');
  }

  let event;
  try {
    event = verifyWebhookSignature(req.body, signature);
  } catch (err) {
    console.error('Stripe webhook signature error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      if (session.payment_status === 'paid') {
        await fulfillStripeSession(session);
      }
    }
  } catch (err) {
    console.error('Stripe webhook handler error:', err);
    return res.status(500).send('Webhook handler failed');
  }

  res.json({ received: true });
});

async function fulfillStripeSession(session) {
  const subscriptionId = session.metadata?.subscriptionId;
  if (!subscriptionId) return;

  const sub = getSubscriptionById(subscriptionId);
  if (!sub || sub.status === 'paid') return;

  markSubscriptionPaid(subscriptionId, {
    mode: 'stripe',
    stripeSessionId: session.id,
    stripePaymentIntentId: session.payment_intent?.id || session.payment_intent || null,
    endorselyReferral: session.metadata?.endorsely_referral || session.client_reference_id || null,
    affiliateRef: session.metadata?.affiliate_ref || null,
  });
}

export default router;