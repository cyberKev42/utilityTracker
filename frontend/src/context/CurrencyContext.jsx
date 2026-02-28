import { createContext, useState, useCallback, useEffect, useRef } from 'react';
import { getCurrency, updateCurrency as updateCurrencyAPI } from '../services/userPreferencesService';
import { useAuth } from '../hooks/useAuth';

export const CurrencyContext = createContext(null);

const SUPPORTED_CURRENCIES = [
  { code: 'EUR', symbol: '\u20ac', label: 'Euro' },
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'GBP', symbol: '\u00a3', label: 'British Pound' },
  { code: 'CHF', symbol: 'CHF', label: 'Swiss Franc' },
  { code: 'PLN', symbol: 'z\u0142', label: 'Polish Zloty' },
  { code: 'CZK', symbol: 'K\u010d', label: 'Czech Koruna' },
  { code: 'SEK', symbol: 'kr', label: 'Swedish Krona' },
  { code: 'NOK', symbol: 'kr', label: 'Norwegian Krone' },
  { code: 'DKK', symbol: 'kr', label: 'Danish Krone' },
  { code: 'HUF', symbol: 'Ft', label: 'Hungarian Forint' },
];

const RATES_CACHE_KEY = 'ut_exchange_rates';
const RATES_MAX_AGE_MS = 4 * 60 * 60 * 1000; // 4 hours

function loadCachedRates() {
  try {
    const raw = localStorage.getItem(RATES_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.fetchedAt < RATES_MAX_AGE_MS) {
      return parsed;
    }
  } catch { /* ignore */ }
  return null;
}

function saveCachedRates(rates, fetchedAt) {
  try {
    localStorage.setItem(RATES_CACHE_KEY, JSON.stringify({ rates, fetchedAt }));
  } catch { /* ignore */ }
}

export function CurrencyProvider({ children }) {
  const { user } = useAuth();
  const [currency, setCurrency] = useState('EUR');
  const [rates, setRates] = useState(() => loadCachedRates()?.rates || {});
  const fetchedRef = useRef(false);

  // Load user currency preference from backend
  useEffect(() => {
    if (!user) return;
    getCurrency()
      .then((data) => setCurrency(data.currency || 'EUR'))
      .catch(() => { /* default EUR */ });
  }, [user]);

  // Fetch exchange rates (once, with localStorage cache)
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const cached = loadCachedRates();
    if (cached) {
      setRates(cached.rates);
      return;
    }

    fetch('https://api.frankfurter.dev/latest?base=EUR')
      .then((res) => res.json())
      .then((data) => {
        if (data.rates) {
          setRates(data.rates);
          saveCachedRates(data.rates, Date.now());
        }
      })
      .catch(() => { /* keep existing rates */ });
  }, []);

  const changeCurrency = useCallback(async (newCurrency) => {
    setCurrency(newCurrency);
    if (user) {
      try {
        await updateCurrencyAPI(newCurrency);
      } catch { /* optimistic update */ }
    }
  }, [user]);

  const convertFromEUR = useCallback((amountEUR) => {
    if (currency === 'EUR') return amountEUR;
    const rate = rates[currency];
    if (!rate) return amountEUR;
    return amountEUR * rate;
  }, [currency, rates]);

  const formatCurrency = useCallback((amountEUR) => {
    const converted = convertFromEUR(amountEUR || 0);
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(converted);
  }, [convertFromEUR, currency]);

  return (
    <CurrencyContext.Provider value={{
      currency,
      changeCurrency,
      supportedCurrencies: SUPPORTED_CURRENCIES,
      convertFromEUR,
      formatCurrency,
    }}>
      {children}
    </CurrencyContext.Provider>
  );
}
