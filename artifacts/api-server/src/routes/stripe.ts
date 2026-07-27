import { Router } from 'express';
import Stripe from 'stripe';
import { getStripeClient, getPublishableKey } from '../lib/stripe';
import { storage } from '../lib/storage';
import { logger } from '../lib/logger';

const router = Router();

// ── Configuration ─────────────────────────────────────────────────────────────

router.get('/config', (_req, res) => {
  res.json({
    publishableKey: getPublishableKey(),
    plans: [
      {
        id: 'monthly',
        name: 'Premium Mensual',
        description: 'Acceso completo mes a mes. Cancela cuando quieras.',
        priceUSD: 4.99,
        interval: 'month',
        features: [
          'Sin anuncios en toda la app',
          'Favoritos ilimitados',
          'Audio en alta calidad',
          'Acceso anticipado a nuevas estaciones',
        ],
      },
      {
        id: 'annual',
        name: 'Premium Anual',
        description: 'El mejor valor — ahorra un 33%. Dos meses gratis.',
        priceUSD: 39.99,
        interval: 'year',
        popular: true,
        features: [
          'Todo lo de Premium Mensual',
          '2 meses gratis incluidos',
          'Soporte prioritario',
          'Playlists exclusivas de radio',
          'Historial de escucha extendido',
        ],
      },
      {
        id: 'family',
        name: 'Premium Familiar',
        description: 'Hasta 6 miembros. La radio para toda la familia.',
        priceUSD: 8.99,
        interval: 'month',
        features: [
          'Hasta 6 cuentas Premium',
          'Controles parentales',
          'Favoritos compartidos en familia',
          'Playlists colaborativas',
          'Soporte prioritario',
        ],
      },
    ],
  });
});

// ── User management ───────────────────────────────────────────────────────────

router.post('/user', async (req, res) => {
  const { email } = req.body as { email?: string };
  if (!email) return res.status(400).json({ error: 'email is required' });

  try {
    const user = await storage.upsertUser(email);
    res.json({ user: { id: user.id, email: user.email, stripeCustomerId: user.stripeCustomerId } });
  } catch (err) {
    logger.error({ err }, 'Error upserting user');
    res.status(500).json({ error: 'Failed to get or create user' });
  }
});

// ── Subscription status ───────────────────────────────────────────────────────

router.get('/subscription', async (req, res) => {
  const { customerId } = req.query as { customerId?: string };
  if (!customerId) return res.status(400).json({ error: 'customerId is required' });

  try {
    const user = await storage.getUserByCustomerId(customerId);
    if (!user) return res.json({ subscription: null });

    res.json({
      subscription: {
        status: user.subscriptionStatus,
        plan: user.subscriptionPlan,
        currentPeriodEnd: user.currentPeriodEnd,
        email: user.email,
      },
    });
  } catch (err) {
    logger.error({ err }, 'Error fetching subscription');
    res.status(500).json({ error: 'Failed to fetch subscription' });
  }
});

router.get('/subscription/by-email', async (req, res) => {
  const { email } = req.query as { email?: string };
  if (!email) return res.status(400).json({ error: 'email is required' });

  try {
    const user = await storage.getUserByEmail(email);
    if (!user) return res.json({ subscription: null });

    res.json({
      subscription: {
        status: user.subscriptionStatus,
        plan: user.subscriptionPlan,
        currentPeriodEnd: user.currentPeriodEnd,
        customerId: user.stripeCustomerId,
        email: user.email,
      },
    });
  } catch (err) {
    logger.error({ err }, 'Error fetching subscription by email');
    res.status(500).json({ error: 'Failed to fetch subscription' });
  }
});

// ── Checkout session ──────────────────────────────────────────────────────────

router.post('/create-checkout-session', async (req, res) => {
  const { email, planId } = req.body as { email?: string; planId?: string };

  if (!email || !planId) {
    return res.status(400).json({ error: 'email and planId are required' });
  }

  try {
    const stripe = getStripeClient();

    // Get or create user + Stripe customer
    const user = await storage.upsertUser(email);
    let customerId = user.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({ email, metadata: { userId: user.id } });
      customerId = customer.id;
      await storage.updateUserStripeInfo(email, { stripeCustomerId: customerId });
    }

    // Look up the matching price by plan_type metadata
    const prices = await stripe.prices.search({
      query: `metadata['plan_type']:'${planId}' AND active:'true'`,
    });

    if (prices.data.length === 0) {
      return res.status(404).json({
        error: `No active price found for plan "${planId}". The server will create products on startup — please retry in a moment.`,
      });
    }

    const price = prices.data[0];
    const host = process.env.REPLIT_DEV_DOMAIN
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : `${req.protocol}://${req.get('host')}`;
    const basePath = (process.env.BASE_PATH ?? '').replace(/\/$/, '');

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{ price: price.id, quantity: 1 }],
      mode: 'subscription',
      success_url: `${host}${basePath}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${host}${basePath}/pricing`,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      customer_update: { address: 'auto' },
      locale: 'auto',
      payment_method_types: ['card'],
    });

    res.json({ url: session.url });
  } catch (err: any) {
    logger.error({ err }, 'Error creating checkout session');
    res.status(500).json({ error: err.message ?? 'Failed to create checkout session' });
  }
});

// ── Customer portal session ───────────────────────────────────────────────────

router.post('/create-portal-session', async (req, res) => {
  const { customerId } = req.body as { customerId?: string };
  if (!customerId) return res.status(400).json({ error: 'customerId is required' });

  try {
    const stripe = getStripeClient();
    const host = process.env.REPLIT_DEV_DOMAIN
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : `${req.protocol}://${req.get('host')}`;
    const basePath = (process.env.BASE_PATH ?? '').replace(/\/$/, '');

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${host}${basePath}/subscription`,
    });

    res.json({ url: session.url });
  } catch (err: any) {
    logger.error({ err }, 'Error creating portal session');
    res.status(500).json({ error: err.message ?? 'Failed to create portal session' });
  }
});

// ── Checkout session details (for success page) ───────────────────────────────

router.get('/checkout-session/:sessionId', async (req, res) => {
  const { sessionId } = req.params;

  try {
    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['customer'],
    });

    const customer = session.customer as Stripe.Customer | null;
    const customerId = typeof session.customer === 'string' ? session.customer : customer?.id;

    res.json({
      email: session.customer_email ?? customer?.email ?? null,
      customerId,
      status: session.status,
    });
  } catch (err: any) {
    logger.error({ err }, 'Error fetching checkout session');
    res.status(500).json({ error: 'Failed to fetch checkout session' });
  }
});

export default router;
