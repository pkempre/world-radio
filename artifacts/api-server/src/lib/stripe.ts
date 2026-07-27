import Stripe from 'stripe';

/** Returns an authenticated Stripe client using STRIPE_SECRET_KEY env var. */
export function getStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY environment variable is required');
  }
  return new Stripe(secretKey);
}

/** Returns the Stripe publishable key for the frontend. */
export function getPublishableKey(): string {
  const key = process.env.STRIPE_PUBLISHABLE_KEY;
  if (!key) {
    throw new Error('STRIPE_PUBLISHABLE_KEY environment variable is required');
  }
  return key;
}

/** Returns the webhook signing secret (optional; skips verification if not set). */
export function getWebhookSecret(): string | null {
  return process.env.STRIPE_WEBHOOK_SECRET || null;
}
