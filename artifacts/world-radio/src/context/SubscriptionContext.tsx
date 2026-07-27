import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export interface SubscriptionInfo {
  status: string;      // 'active' | 'canceled' | 'past_due' | 'trialing' | ...
  plan: string | null; // 'monthly' | 'annual' | 'family'
  currentPeriodEnd: string | null;
  email: string;
}

interface SubscriptionContextType {
  subscription: SubscriptionInfo | null;
  isLoading: boolean;
  isPremium: boolean;
  email: string | null;
  customerId: string | null;
  setCustomerInfo: (email: string, customerId: string) => void;
  refreshSubscription: () => void;
  clearSubscription: () => void;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

const STORAGE_KEY = 'wr_subscription_v1';

function loadStoredInfo(): { email: string; customerId: string } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.email && parsed?.customerId) return parsed;
    return null;
  } catch {
    return null;
  }
}

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);

  const fetchSubscription = useCallback(async (cId: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/stripe/subscription?customerId=${encodeURIComponent(cId)}`);
      const data = await res.json();
      setSubscription(data.subscription ?? null);
    } catch {
      setSubscription(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const stored = loadStoredInfo();
    if (stored) {
      setEmail(stored.email);
      setCustomerId(stored.customerId);
      fetchSubscription(stored.customerId);
    }
  }, [fetchSubscription]);

  const setCustomerInfo = useCallback((newEmail: string, newCustomerId: string) => {
    setEmail(newEmail);
    setCustomerId(newCustomerId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ email: newEmail, customerId: newCustomerId }));
    fetchSubscription(newCustomerId);
  }, [fetchSubscription]);

  const refreshSubscription = useCallback(() => {
    if (customerId) fetchSubscription(customerId);
  }, [customerId, fetchSubscription]);

  const clearSubscription = useCallback(() => {
    setEmail(null);
    setCustomerId(null);
    setSubscription(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const isPremium =
    subscription?.status === 'active' || subscription?.status === 'trialing';

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        isLoading,
        isPremium,
        email,
        customerId,
        setCustomerInfo,
        refreshSubscription,
        clearSubscription,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error('useSubscription must be used within SubscriptionProvider');
  return ctx;
}
