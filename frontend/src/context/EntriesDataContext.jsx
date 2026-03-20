import { createContext, useState, useCallback, useEffect, useMemo } from 'react';
import { getStats, getEntries, getTrend } from '../services/entriesService';
import { useAuth } from '../hooks/useAuth';

export const EntriesDataContext = createContext(null);

export function EntriesDataProvider({ children }) {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [entries, setEntries] = useState([]);
  const [trend, setTrend] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      const [statsData, entriesData, trendData] = await Promise.all([
        getStats(),
        getEntries({ limit: 500 }),
        getTrend(),
      ]);
      setStats(statsData);
      setEntries(entriesData);
      setTrend(trendData);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const revalidate = useCallback(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (!user) {
      setStats(null);
      setEntries([]);
      setTrend(null);
      setLoading(true);
      setError(null);
      return;
    }
    fetchAll();
  }, [user, fetchAll]);

  const recentEntries = useMemo(() => entries.slice(0, 5), [entries]);

  const value = useMemo(
    () => ({ stats, entries, recentEntries, trend, loading, error, revalidate }),
    [stats, entries, recentEntries, trend, loading, error, revalidate]
  );

  return (
    <EntriesDataContext.Provider value={value}>
      {children}
    </EntriesDataContext.Provider>
  );
}
