import { useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, Calendar, CreditCard, ArrowUpRight, RefreshCw, XCircle, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { useSubscription } from '../context/SubscriptionContext';
import { Link } from 'wouter';
import { cn } from '@/lib/utils';

const PLAN_NAMES: Record<string, string> = {
  monthly: 'Premium Mensual',
  annual: 'Premium Anual',
  family: 'Premium Familiar',
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.FC<{ className?: string }> }> = {
  active: { label: 'Activa', color: 'text-green-400 bg-green-500/10 border-green-500/20', icon: CheckCircle },
  trialing: { label: 'Período de prueba', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', icon: CheckCircle },
  past_due: { label: 'Pago pendiente', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20', icon: AlertTriangle },
  canceled: { label: 'Cancelada', color: 'text-red-400 bg-red-500/10 border-red-500/20', icon: XCircle },
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—';
  return new Intl.DateTimeFormat('es', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(dateStr));
}

export default function Subscription() {
  const { subscription, isLoading, isPremium, customerId, email, clearSubscription, refreshSubscription } = useSubscription();
  const [isPortalLoading, setIsPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);

  const handleManageSubscription = async () => {
    if (!customerId) return;
    setIsPortalLoading(true);
    setPortalError(null);

    try {
      const res = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId }),
      });
      const data = await res.json();

      if (!res.ok) {
        setPortalError(data.error ?? 'No se pudo abrir el portal de facturación.');
        return;
      }

      if (data.url) window.location.href = data.url;
    } catch {
      setPortalError('Error de conexión. Intenta de nuevo.');
    } finally {
      setIsPortalLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center pb-32">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!customerId) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center pb-32">
        <div className="text-center max-w-md px-4">
          <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
            <Crown className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="text-3xl font-bold mb-3">Sin suscripción activa</h2>
          <p className="text-muted-foreground mb-8">
            No tienes una suscripción Premium activa. Actualiza tu cuenta para disfrutar de WorldRadio sin límites.
          </p>
          <Link href="/pricing">
            <span className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 cursor-pointer">
              <Crown className="w-5 h-5" />
              Ver planes Premium
            </span>
          </Link>
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[subscription?.status ?? ''] ?? STATUS_CONFIG.canceled;
  const StatusIcon = statusConfig.icon;
  const planName = PLAN_NAMES[subscription?.plan ?? ''] ?? subscription?.plan ?? 'Premium';

  return (
    <div className="min-h-[100dvh] pb-32">
      {/* Header */}
      <section className="relative py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/8 to-transparent z-0" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 mb-2"
          >
            <div className="w-14 h-14 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center">
              <Crown className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Mi Suscripción</h1>
              <p className="text-muted-foreground text-sm mt-0.5">{email}</p>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="container mx-auto px-4 max-w-3xl space-y-6">
        {/* Status card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-3xl p-6"
        >
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Estado de la suscripción</h2>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold">{planName}</span>
                <span className={cn(
                  'inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border',
                  statusConfig.color,
                )}>
                  <StatusIcon className="w-3 h-3" />
                  {statusConfig.label}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                {subscription?.status === 'active' || subscription?.status === 'trialing' ? (
                  <span>Próxima renovación: <span className="text-foreground font-medium">{formatDate(subscription?.currentPeriodEnd ?? null)}</span></span>
                ) : (
                  <span>Finalizó: {formatDate(subscription?.currentPeriodEnd ?? null)}</span>
                )}
              </div>
            </div>

            <button
              onClick={refreshSubscription}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Actualizar
            </button>
          </div>
        </motion.div>

        {/* Manage subscription card */}
        {isPremium && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card border border-border rounded-3xl p-6"
          >
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Gestionar suscripción</h2>
            <p className="text-sm text-muted-foreground mb-6">
              A través del portal de facturación de Stripe puedes cambiar de plan, actualizar tu método de pago, cancelar la renovación y descargar facturas.
            </p>

            {portalError && (
              <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3 mb-4">
                {portalError}
                <p className="mt-1 text-xs text-muted-foreground">
                  Si el problema persiste, asegúrate de haber activado el Portal de Clientes en tu Dashboard de Stripe (Settings → Billing → Customer portal).
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={handleManageSubscription}
                disabled={isPortalLoading}
                className="flex items-center justify-center gap-2 py-3.5 px-5 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 transition-all shadow-lg shadow-primary/20"
              >
                {isPortalLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CreditCard className="w-4 h-4" />
                )}
                {isPortalLoading ? 'Abriendo portal...' : 'Gestionar suscripción'}
                {!isPortalLoading && <ArrowUpRight className="w-4 h-4 ml-auto" />}
              </button>

              <Link href="/pricing">
                <span className="flex items-center justify-center gap-2 py-3.5 px-5 rounded-2xl bg-secondary text-foreground font-semibold text-sm hover:bg-secondary/80 transition-all border border-border cursor-pointer">
                  <Crown className="w-4 h-4 text-primary" />
                  Ver todos los planes
                </span>
              </Link>
            </div>

            <div className="mt-6 p-4 bg-secondary/30 rounded-2xl border border-border/50">
              <h3 className="text-sm font-semibold mb-3">Desde el portal puedes:</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {[
                  'Ver y cambiar tu plan de suscripción',
                  'Actualizar tu método de pago',
                  'Cancelar la renovación automática',
                  'Descargar facturas y recibos',
                  'Ver historial de pagos',
                ].map(item => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}

        {/* Not premium — upgrade prompt */}
        {!isPremium && customerId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card border border-border rounded-3xl p-6 text-center"
          >
            <Crown className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-bold text-lg mb-2">Tu suscripción no está activa</h3>
            <p className="text-sm text-muted-foreground mb-5">
              {subscription?.status === 'canceled'
                ? 'Tu suscripción fue cancelada. Puedes renovarla en cualquier momento.'
                : 'Actualiza tu cuenta para disfrutar de WorldRadio Premium.'}
            </p>
            <Link href="/pricing">
              <span className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 cursor-pointer">
                <Crown className="w-4 h-4" />
                Reactivar Premium
              </span>
            </Link>
          </motion.div>
        )}

        {/* Sign out / clear session */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center"
        >
          <button
            onClick={clearSubscription}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Cerrar sesión / Usar otro correo
          </button>
        </motion.div>
      </div>
    </div>
  );
}
