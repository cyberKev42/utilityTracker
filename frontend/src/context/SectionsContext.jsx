import { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import * as sectionsService from '../services/sectionsService';
import { Button } from '../components/ui/button';
import { useTranslation } from 'react-i18next';
import { withRetry } from '../utils/withRetry';

export const SectionsContext = createContext(null);

export function SectionsProvider({ children }) {
  const { user } = useAuth();
  const { t } = useTranslation();

  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSections = useCallback(async () => {
    setError(null);
    try {
      const data = await sectionsService.getSections();
      setSections(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setSections([]);
      setError(null);
      setLoading(false);
      setInitialLoading(false);
      return;
    }
    fetchSections();
  }, [user, fetchSections]);

  // Optimistic mutations
  const createSection = useCallback(async (data) => {
    const tempId = `temp-${Date.now()}`;
    const optimistic = { id: tempId, ...data, meters: [], sort_order: sections.length };
    setSections((prev) => [...prev, optimistic]);
    try {
      const result = await withRetry(() => sectionsService.createSection(data));
      setSections((prev) => prev.map((s) => s.id === tempId ? { ...result, meters: result.meters || [] } : s));
      return result;
    } catch (err) {
      setSections((prev) => prev.filter((s) => s.id !== tempId));
      throw err;
    }
  }, [sections.length]);

  const updateSection = useCallback(async (id, data) => {
    let previous;
    setSections((prev) => {
      previous = prev.find((s) => s.id === id);
      return prev.map((s) => s.id === id ? { ...s, ...data } : s);
    });
    try {
      const result = await withRetry(() => sectionsService.updateSection(id, data));
      setSections((prev) => prev.map((s) => s.id === id ? { ...result, meters: s.meters } : s));
      return result;
    } catch (err) {
      setSections((prev) => prev.map((s) => s.id === id ? previous : s));
      throw err;
    }
  }, []);

  // Server-confirmed deletes (per D-07)
  const deleteSection = useCallback(async (id) => {
    const result = await withRetry(() => sectionsService.deleteSection(id));
    setSections((prev) => prev.filter((s) => s.id !== id));
    return result;
  }, []);

  const archiveSection = useCallback(async (id) => {
    const result = await sectionsService.archiveSection(id);
    setSections((prev) => prev.filter((s) => s.id !== id));
    return result;
  }, []);

  const unarchiveSection = useCallback(async (id) => {
    const result = await sectionsService.unarchiveSection(id);
    // Re-fetch all to get the unarchived section in the right position
    await fetchSections();
    return result;
  }, [fetchSections]);

  const createMeter = useCallback(async (sectionId, data) => {
    const tempId = `temp-${Date.now()}`;
    const optimistic = { id: tempId, ...data };
    setSections((prev) => prev.map((s) =>
      s.id === sectionId ? { ...s, meters: [...(s.meters || []), optimistic] } : s
    ));
    try {
      const result = await withRetry(() => sectionsService.createMeter(sectionId, data));
      setSections((prev) => prev.map((s) =>
        s.id === sectionId ? { ...s, meters: s.meters.map((m) => m.id === tempId ? result : m) } : s
      ));
      return result;
    } catch (err) {
      setSections((prev) => prev.map((s) =>
        s.id === sectionId ? { ...s, meters: s.meters.filter((m) => m.id !== tempId) } : s
      ));
      throw err;
    }
  }, []);

  const updateMeter = useCallback(async (sectionId, meterId, data) => {
    let previousMeter;
    setSections((prev) => prev.map((s) => {
      if (s.id !== sectionId) return s;
      previousMeter = s.meters.find((m) => m.id === meterId);
      return { ...s, meters: s.meters.map((m) => m.id === meterId ? { ...m, ...data } : m) };
    }));
    try {
      const result = await withRetry(() => sectionsService.updateMeter(sectionId, meterId, data));
      setSections((prev) => prev.map((s) =>
        s.id === sectionId ? { ...s, meters: s.meters.map((m) => m.id === meterId ? result : m) } : s
      ));
      return result;
    } catch (err) {
      setSections((prev) => prev.map((s) =>
        s.id === sectionId ? { ...s, meters: s.meters.map((m) => m.id === meterId ? previousMeter : m) } : s
      ));
      throw err;
    }
  }, []);

  const deleteMeter = useCallback(async (sectionId, meterId) => {
    const result = await withRetry(() => sectionsService.deleteMeter(sectionId, meterId));
    setSections((prev) => prev.map((s) =>
      s.id === sectionId ? { ...s, meters: s.meters.filter((m) => m.id !== meterId) } : s
    ));
    return result;
  }, []);

  // Optimistic mutations (already implemented)
  const reorderSections = useCallback(async (newOrder) => {
    const previous = sections;
    setSections(newOrder);
    try {
      await sectionsService.reorderSections(newOrder.map((s) => s.id));
    } catch (err) {
      setSections(previous);
      throw err;
    }
  }, [sections]);

  const reorderMeters = useCallback(async (sectionId, newMeters) => {
    const previous = sections;
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId ? { ...s, meters: newMeters } : s
      )
    );
    try {
      await sectionsService.reorderMeters(sectionId, newMeters.map((m) => m.id));
    } catch (err) {
      setSections(previous);
      throw err;
    }
  }, [sections]);

  // Helper lookups
  const getSectionById = useCallback((id) => {
    return sections.find((s) => s.id === id) ?? null;
  }, [sections]);

  const getMeterById = useCallback((id) => {
    for (const section of sections) {
      const meter = section.meters?.find((m) => m.id === id);
      if (meter) return meter;
    }
    return null;
  }, [sections]);

  const getSectionForMeter = useCallback((meterId) => {
    return sections.find((s) => s.meters?.some((m) => m.id === meterId)) ?? null;
  }, [sections]);

  // Fetch with archived (does NOT update context state)
  const fetchWithArchived = useCallback(() => {
    return sectionsService.getSectionsWithArchived();
  }, []);

  const value = useMemo(() => ({
    sections,
    loading,
    initialLoading,
    error,
    retry: fetchSections,
    createSection,
    updateSection,
    deleteSection,
    archiveSection,
    unarchiveSection,
    createMeter,
    updateMeter,
    deleteMeter,
    reorderSections,
    reorderMeters,
    getSectionById,
    getMeterById,
    getSectionForMeter,
    fetchWithArchived,
  }), [
    sections,
    loading,
    initialLoading,
    error,
    fetchSections,
    createSection,
    updateSection,
    deleteSection,
    archiveSection,
    unarchiveSection,
    createMeter,
    updateMeter,
    deleteMeter,
    reorderSections,
    reorderMeters,
    getSectionById,
    getMeterById,
    getSectionForMeter,
    fetchWithArchived,
  ]);

  if (initialLoading && error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4 p-8">
          <p className="text-destructive text-base">{t('sections.loadError', 'Failed to load sections.')}</p>
          <p className="text-muted-foreground text-sm">{t('sections.loadErrorHint', 'Check your connection and try again.')}</p>
          <Button onClick={fetchSections} className="min-h-[44px]">{t('sections.retry', 'Retry')}</Button>
        </div>
      </div>
    );
  }

  return (
    <SectionsContext.Provider value={value}>
      {children}
    </SectionsContext.Provider>
  );
}
