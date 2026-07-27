import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Crown, Zap, Users, Loader2, X, Star } from 'lucide-react';
import { useSubscription } from '../context/SubscriptionContext';
import { useLocation } from 'wouter';
import { cn } from '@/lib/utils';

interface Plan {
  id: string;
  name: string;
  description: string;
  priceUSD: number;
  interval: string;
  popular?: boolean;
  features: string[];
}

interface LocalPrice {
  symbol: string;
  currency: string;
  amount: string;
}

// Currency approximate rates (for display only — Stripe charges in USD)
const CURRENCY_MAP: Record<string, { symbol: string; currency: string; rate: number }> = {
  BR: { symbol: 'R$', currency: 'BRL', rate: 5.10 },
  MX: { symbol: '$', currency: 'MXN', rate: 17.50 },
  GB: { symbol: '£', currency: 'GBP', rate: 0.79 },
  EU: { symbol: '€', currency: 'EUR', rate: 0.92 },
  DE: { symbol: '€', currency: 'EUR', rate: 0.92 },
  FR: { symbol: '€', currency: 'EUR', rate: 0.92 },
  ES: { symbol: '€', currency: 'EUR', rate: 0.92 },
  IT: { symbol: '€', currency: 'EUR', rate: 0.92 },
  AR: { symbol: '$', currency: 'ARS', rate: 900 },
  CO: { symbol: '$', currency: 'COP', rate: 3950 },
  CL: { symbol: '$', currency: 'CLP', rate: 950 },
  IN: { symbol: '₹', currency: 'INR', rate: 83 },
  JP: { symbol: '¥', currency: 'JPY', rate: 150 },
  CA: { symbol: 'CA$', currency: 'CAD', rate: 1.36 },
  AU: { symbol: 'A$', currency: 'AUD', rate: 1.53 },
};

function getLocalPrice(priceUSD: number, countryCode: string | null): LocalPrice {
  if (!countryCode) return { symbol: '$', currency: 'USD', amount: priceUSD.toFixed(2) };
  const locale = CURRENCY_MAP[countryCode.toUpperCase()];
  if (!locale) return { symbol: '$', currency: 'USD', amount: priceUSD.toFixed(2) };
  const converted = priceUSD * locale.rate;
  return {
    symbol: locale.symbol,
    currency: locale.currency,
    amount: converted < 100 ? converted.toFixed(2) : Math.round(converted).toString(),
  };
}

const PLAN_ICONS: Record<string, React.FC<{ className?: string }>> = {
  monthly: Zap,
  annual: Star,
  family: Users,
};

export default function Pricing() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');
  const [countryCode, setCountryCode] = useState<string | null>(null);
  const [checkoutEmail, setCheckoutEmail] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const { isPremium, subscription, customerId } = useSubscription();
  const [, navigate] = useLocation();

  // Detect country via locale as a fallback
  useEffect(() => {
    const locale = navigator.language; // e.g. "pt-BR"
    const parts = locale.split('-');
    if (parts.length > 1) {
      setCountryCode(parts[1]);
    }
    // Try to fetch real country via free IP geolocation
    fetch('https://ipapi.co/json/')
      .then(r => r.json())
      .then(data => { if (data?.country_code) setCountryCode(data.country_code); })
      .catch(() => {});
  }, []);

  // Load plans from API
  useEffect(() => {
    fetch('/api/stripe/config')
      .then(r => r.json())
      .then(data => { setPlans(data.plans ?? []); })
      .catch(() => {})
      .finally(() => setIsLoadingPlans(false));
  }, []);

  const visiblePlans = plans.filter(p =>
    billingInterval === 'year' ? p.interval === 'year' : p.interval === 'month',
  );
  // Always show all 3 plans but highlight the billing interval
  const allPlans = plans;

  const handleSelectPlan = (plan: Plan) => {
    if (isPremium) {
      navigate('/subscription');
      return;
    }
    setSelectedPlan(plan);
    setCheckoutError(null);
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan || !checkoutEmail) return;

    setIsCheckingOut(true);
    setCheckoutError(null);

    try {
      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: checkoutEmail, planId: selectedPlan.id }),
      });
      const data = await res.json();

      if (!res.ok) {
        setCheckoutError(data.error ?? 'Error al crear la sesión de pago.');
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setCheckoutError('Error de conexión. Intenta de nuevo.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  const renderPlanCard = (plan: Plan, idx: number) => {
    const Icon = PLAN_ICONS[plan.id] ?? Crown;
    const localPrice = getLocalPrice(plan.priceUSD, countryCode);
    const isHighlighted = billingInterval === 'year' ? plan.id === 'annual' : plan.popular;

    return (
      <motion.div
        key={plan.id}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: idx * 0.1 }}
        className={cn(
          'relative flex flex-col rounded-3xl border p-8 transition-all',
          isHighlighted
            ? 'border-primary bg-primary/5 shadow-[0_0_40px_rgba(255,87,34,0.12)] scale-[1.02]'
            : 'border-border bg-card hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5',
        )}
      >
        {isHighlighted && (
          <div className="absolute -top-4 left-1/2 -translate-x-1/2">
            <span className="bg-primary text-primary-foreground text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-lg shadow-primary/30">
              Más popular
            </span>
          </div>
        )}

        <div className="mb-6">
          <div className={cn(
            'w-12 h-12 rounded-2xl flex items-center justify-center mb-4',
            isHighlighted ? 'bg-primary text-primary-foreground' : 'bg-secondary text-primary',
          )}>
            <Icon className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-1">{plan.name}</h3>
          <p className="text-sm text-muted-foreground">{plan.description}</p>
        </div>

        <div className="mb-6">
          <div className="flex items-end gap-1">
            <span className="text-4xl font-extrabold text-foreground">
              {localPrice.symbol}{localPrice.amount}
            </span>
            <span className="text-muted-foreground mb-1.5 text-sm">
              {localPrice.currency !== 'USD' ? ` ${localPrice.currency}` : ''}
              /{plan.interval === 'month' ? 'mes' : 'año'}
            </span>
          </div>
          {localPrice.currency !== 'USD' && (
            <p className="text-xs text-muted-foreground mt-1">
              ≈ ${plan.priceUSD} USD · El cobro se procesa en USD
            </p>
          )}
          {plan.id === 'annual' && (
            <div className="mt-2 inline-flex items-center gap-1.5 bg-green-500/10 text-green-400 text-xs font-semibold px-3 py-1 rounded-full border border-green-500/20">
              <Check className="w-3 h-3" />
              Ahorra ${((4.99 * 12) - 39.99).toFixed(2)} al año
            </div>
          )}
        </div>

        <ul className="space-y-3 mb-8 flex-1">
          {plan.features.map(feature => (
            <li key={feature} className="flex items-start gap-3 text-sm">
              <div className={cn(
                'w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
                isHighlighted ? 'bg-primary/20 text-primary' : 'bg-secondary text-primary',
              )}>
                <Check className="w-3 h-3" />
              </div>
              <span className="text-muted-foreground">{feature}</span>
            </li>
          ))}
        </ul>

        <button
          onClick={() => handleSelectPlan(plan)}
          className={cn(
            'w-full py-3.5 rounded-2xl font-semibold text-sm transition-all',
            isPremium && subscription?.plan === plan.id
              ? 'bg-green-500/10 text-green-400 border border-green-500/30 cursor-default'
              : isHighlighted
                ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25'
                : 'bg-secondary text-foreground hover:bg-secondary/80 border border-border',
          )}
        >
          {isPremium && subscription?.plan === plan.id
            ? '✓ Plan actual'
            : isPremium
              ? 'Cambiar a este plan'
              : 'Comenzar ahora'}
        </button>
      </motion.div>
    );
  };

  return (
    <div className="min-h-[100dvh] pb-32">
      {/* Hero */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent z-0" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/15 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/3 z-0" />

        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 rounded-full px-4 py-2 text-sm font-medium mb-6">
              <Crown className="w-4 h-4" />
              WorldRadio Premium
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter mb-6">
              Radio sin límites.
              <br />
              <span className="text-primary italic font-serif font-normal">Sin interrupciones.</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              Desbloquea la experiencia completa de WorldRadio. Sin anuncios, audio en alta calidad y acceso a funciones exclusivas en todo el mundo.
            </p>

            {/* Billing toggle */}
            <div className="inline-flex items-center bg-secondary/50 border border-border rounded-full p-1">
              <button
                onClick={() => setBillingInterval('month')}
                className={cn(
                  'px-5 py-2 rounded-full text-sm font-medium transition-all',
                  billingInterval === 'month'
                    ? 'bg-foreground text-background shadow'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                Mensual
              </button>
              <button
                onClick={() => setBillingInterval('year')}
                className={cn(
                  'px-5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2',
                  billingInterval === 'year'
                    ? 'bg-foreground text-background shadow'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                Anual
                <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                  −33%
                </span>
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Plans */}
      <section className="container mx-auto px-4 pb-16">
        {isLoadingPlans ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {allPlans.map((plan, idx) => renderPlanCard(plan, idx))}
          </div>
        )}

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center text-sm text-muted-foreground mt-8"
        >
          Sin contratos. Cancela cuando quieras. Pagos seguros procesados por{' '}
          <span className="text-foreground font-medium">Stripe</span>.
        </motion.p>
      </section>

      {/* Payment methods */}
      <section className="container mx-auto px-4 pb-16">
        <div className="max-w-5xl mx-auto bg-card border border-border rounded-3xl p-8">
          <h2 className="text-2xl font-bold text-center mb-6">Métodos de pago aceptados</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {[
              { name: 'Visa', emoji: '💳' },
              { name: 'Mastercard', emoji: '💳' },
              { name: 'Amex', emoji: '💳' },
              { name: 'Google Pay', emoji: '📱' },
              { name: 'Apple Pay', emoji: '🍎' },
              { name: 'Link', emoji: '🔗' },
              { name: 'Pix', emoji: '🇧🇷' },
              { name: 'Y más...', emoji: '🌍' },
            ].map(m => (
              <div key={m.name} className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-secondary/30 border border-border/50">
                <span className="text-2xl">{m.emoji}</span>
                <span className="text-sm font-medium text-muted-foreground">{m.name}</span>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground mt-6">
            Stripe detecta automáticamente el método de pago disponible en tu país.
            Nunca almacenamos datos de tu tarjeta — todo se procesa directamente por Stripe.
          </p>
        </div>
      </section>

      {/* Email checkout modal */}
      <AnimatePresence>
        {selectedPlan && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
            onClick={() => setSelectedPlan(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="w-full max-w-md bg-card border border-border rounded-3xl p-8 shadow-2xl shadow-primary/10"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold">{selectedPlan.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    ${selectedPlan.priceUSD}/{selectedPlan.interval === 'month' ? 'mes' : 'año'}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedPlan(null)}
                  className="p-2 rounded-full hover:bg-secondary transition-colors text-muted-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCheckout} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Tu correo electrónico</label>
                  <input
                    type="email"
                    required
                    value={checkoutEmail}
                    onChange={e => setCheckoutEmail(e.target.value)}
                    placeholder="tu@email.com"
                    className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-2xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Usamos tu email para asociar tu suscripción. No compartimos tu información.
                  </p>
                </div>

                {checkoutError && (
                  <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3">
                    {checkoutError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isCheckingOut || !checkoutEmail}
                  className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/25"
                >
                  {isCheckingOut ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Redirigiendo a Stripe...
                    </>
                  ) : (
                    <>
                      <Crown className="w-4 h-4" />
                      Continuar al pago seguro
                    </>
                  )}
                </button>

                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <span>🔒 Pago seguro con Stripe</span>
                  <span>·</span>
                  <span>Cancela cuando quieras</span>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
