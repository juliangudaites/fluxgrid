import { useEffect, useState } from 'react';
import { fetchTierPaymentConfig } from '../api';

export interface PaymentMethodsState {
  bitcoin: boolean;
  stripe: boolean;
  loaded: boolean;
}

const DEFAULT: PaymentMethodsState = { bitcoin: true, stripe: false, loaded: false };

let cached: PaymentMethodsState | null = null;
let inflight: Promise<PaymentMethodsState> | null = null;

function loadPaymentMethods(): Promise<PaymentMethodsState> {
  if (cached) return Promise.resolve(cached);
  if (inflight) return inflight;
  inflight = fetchTierPaymentConfig()
    .then((cfg) => {
      const state: PaymentMethodsState = {
        bitcoin: cfg.paymentMethods.bitcoin,
        stripe: cfg.paymentMethods.stripe,
        loaded: true,
      };
      cached = state;
      return state;
    })
    .catch(() => DEFAULT)
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

export function refreshPaymentMethods(): Promise<PaymentMethodsState> {
  cached = null;
  return loadPaymentMethods();
}

export function usePaymentMethods(active = true): PaymentMethodsState {
  const [methods, setMethods] = useState<PaymentMethodsState>(cached ?? DEFAULT);

  useEffect(() => {
    if (!active) return;
    loadPaymentMethods().then(setMethods);
  }, [active]);

  return methods;
}