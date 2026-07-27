import Stripe from 'stripe';
import { getStripeClient, getWebhookSecret } from './stripe';
import { storage } from './storage';
import { logger } from './logger';

async function getSubscriptionPlanName(stripe: Stripe, subscriptionId: string): Promise<string | null> {
  try {
    const sub = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['items.data.price'],
    });
    const item = sub.items.data[0];
    if (!item) return null;
    return (item.price.metadata?.plan_type as string) ?? null;
  } catch {
    return null;
  }
}

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        'Payload must be a Buffer. ' +
        'Ensure the webhook route is registered BEFORE app.use(express.json()).',
      );
    }

    const stripe = getStripeClient();
    const webhookSecret = getWebhookSecret();

    let event: Stripe.Event;

    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } else {
      // Development mode: parse without verification
      event = JSON.parse(payload.toString()) as Stripe.Event;
      logger.warn('STRIPE_WEBHOOK_SECRET not set — skipping signature verification (dev mode only)');
    }

    logger.info({ type: event.type }, 'Processing Stripe webhook event');

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== 'subscription') break;

        const email = session.customer_email ?? (session.customer_details?.email ?? null);
        const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
        const subscriptionId = typeof session.subscription === 'string'
          ? session.subscription
          : (session.subscription as Stripe.Subscription | null)?.id;

        if (!email || !customerId || !subscriptionId) break;

        const user = await storage.upsertUser(email);
        const planType = await getSubscriptionPlanName(stripe, subscriptionId);

        await storage.updateUserStripeInfo(user.email, {
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          subscriptionStatus: 'active',
          subscriptionPlan: planType,
        });

        logger.info({ email, customerId, plan: planType }, 'Checkout completed — user activated');
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
        const periodEnd = new Date(sub.current_period_end * 1000);

        await storage.updateUserByCustomerId(customerId, {
          stripeSubscriptionId: sub.id,
          subscriptionStatus: sub.status,
          currentPeriodEnd: periodEnd,
        });

        logger.info({ customerId, status: sub.status }, 'Subscription updated');
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;

        await storage.updateUserByCustomerId(customerId, {
          subscriptionStatus: 'canceled',
          stripeSubscriptionId: null,
          currentPeriodEnd: null,
        });

        logger.info({ customerId }, 'Subscription canceled');
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;

        if (customerId) {
          await storage.updateUserByCustomerId(customerId, { subscriptionStatus: 'past_due' });
          logger.warn({ customerId }, 'Payment failed — subscription marked past_due');
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;

        if (customerId && invoice.subscription) {
          const subId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription.id;
          try {
            const sub = await stripe.subscriptions.retrieve(subId);
            await storage.updateUserByCustomerId(customerId, {
              subscriptionStatus: 'active',
              currentPeriodEnd: new Date(sub.current_period_end * 1000),
            });
          } catch {
            // non-fatal
          }
        }
        break;
      }

      default:
        logger.info({ type: event.type }, 'Unhandled webhook event type');
    }
  }
}
