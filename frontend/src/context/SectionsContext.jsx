import { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import * as sectionsService from '../services/sectionsService';
import { Button } from '../components/ui/button';
import { useTranslation } from 'react-i18next';

export const SectionsContext = createContext(null);

export function SectionsProvider({ children }) {
  const { user } = useAuth();
  const { t } = useTranslation();

  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSections = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await sectionsService.getSections();
      setSections(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setSections([]);
      setError(null);
      setLoading(false);
      return;
    }
    fetchSections();
  }, [user, fetchSections]);

  // Server-wait mutations
  const createSection = useCallback(async (data) => {
    const result = await sectionsService.createSection(data);
    await fetchSections();
    return result;
  }, [fetchSections]);

  const updateSection = useCallback(async (id, data) => {
    const result = await sectionsService.updateSection(id, data);
    await fetchSections();
    return result;
  }, [fetchSections]);

  const deleteSection = useCallback(async (id) => {
    const result = await sectionsService.deleteSection(id);
    await fetchSections();
    return result;
  }, [fetchSections]);

  const archiveSection = useCallback(async (id) => {
    const result = await sectionsService.archiveSection(id);
    await fetchSections();
    return result;
  }, [fetchSections]);

  const unarchiveSection = useCallback(async (id) => {
    const result = await sectionsService.unarchiveSection(id);
    await fetchSections();
    return result;
  }, [fetchSections]);

  const createMeter = useCallback(async (sectionId, data) => {
    const result = await sectionsService.createMeter(sectionId, data);
    await fetchSections();
    return result;
  }, [fetchSections]);

  const updateMeter = useCallback(async (sectionId, meterId, data) => {
    const result = await sectionsService.updateMeter(sectionId, meterId, data);
    await fetchSections();
    return result;
  }, [fetchSections]);

  const deleteMeter = useCallback(async (sectionId, meterId) => {
    const result = await sectionsService.deleteMeter(sectionId, meterId);
    await fetchSections();
    return result;
  }, [fetchSections]);

  // Optimistic mutations
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error) {
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
