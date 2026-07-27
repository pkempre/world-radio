import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, CheckCircle, Loader2, Radio } from 'lucide-react';
import { useSubscription } from '../context/SubscriptionContext';
import { Link, useSearch } from 'wouter';

export default function CheckoutSuccess() {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const sessionId = params.get('session_id');

  const { setCustomerInfo } = useSubscription();
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setIsLoading(false);
      setError('No se encontró la sesión de pago.');
      return;
    }

    fetch(`/api/stripe/checkout-session/${sessionId}`)
      .then(r => r.json())
      .then(data => {
        if (data.email && data.customerId) {
          setEmail(data.email);
          setCustomerInfo(data.email, data.customerId);
        } else {
          setError('No se pudo recuperar la información de la sesión.');
        }
      })
      .catch(() => setError('Error de conexión. Tu suscripción fue procesada correctamente.'))
      .finally(() => setIsLoading(false));
  }, [sessionId, setCustomerInfo]);

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center pb-32">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Activando tu suscripción...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center pb-32 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-radial from-primary/20 via-transparent to-transparent z-0" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] z-0" />

      <div className="relative z-10 text-center max-w-md px-4">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.1 }}
          className="w-28 h-28 bg-primary/10 border border-primary/30 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_60px_rgba(255,87,34,0.3)]"
        >
          {error ? (
            <CheckCircle className="w-14 h-14 text-primary" />
          ) : (
            <Crown className="w-14 h-14 text-primary" />
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            {error ? '¡Pago completado!' : '¡Bienvenido a Premium!'}
          </h1>

          {email && !error && (
            <p className="text-muted-foreground mb-2">
              Tu cuenta <span className="text-foreground font-medium">{email}</span> ya tiene acceso Premium.
            </p>
          )}

          {error ? (
            <p className="text-muted-foreground mb-8">
              {error} Si experimentas problemas, visita <Link href="/subscription"><span className="text-primary underline cursor-pointer">Mi Suscripción</span></Link>.
            </p>
          ) : (
            <p className="text-muted-foreground mb-8">
              Tu suscripción está activa. Disfruta de radio sin límites, sin anuncios y en alta calidad desde cualquier rincón del mundo.
            </p>
          )}

          {/* Feature highlights */}
          <div className="grid grid-cols-1 gap-3 mb-10 text-left">
            {[
              { icon: '🚫', text: 'Sin anuncios — experiencia limpia y sin interrupciones' },
              { icon: '🎵', text: 'Audio en alta calidad en todas las estaciones' },
              { icon: '❤️', text: 'Favoritos ilimitados — guarda todas las estaciones que quieras' },
            ].map(item => (
              <div key={item.text} className="flex items-start gap-3 bg-card border border-border rounded-2xl px-4 py-3">
                <span className="text-xl flex-shrink-0 mt-0.5">{item.icon}</span>
                <span className="text-sm text-muted-foreground">{item.text}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/">
              <span className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 cursor-pointer">
                <Radio className="w-5 h-5" />
                Empezar a escuchar
              </span>
            </Link>
            <Link href="/subscription">
              <span className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-secondary text-foreground font-semibold hover:bg-secondary/80 transition-all border border-border cursor-pointer">
                <Crown className="w-5 h-5 text-primary" />
                Mi suscripción
              </span>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
