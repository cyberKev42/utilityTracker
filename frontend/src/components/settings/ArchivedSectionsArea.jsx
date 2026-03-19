import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import { HiOutlineChevronRight } from 'react-icons/hi2';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { useSections } from '../../hooks/useSections';

export default function ArchivedSectionsArea() {
  const { t } = useTranslation();
  const { fetchWithArchived, unarchiveSection, deleteSection } = useSections();

  const [expanded, setExpanded] = useState(false);
  const [archivedSections, setArchivedSections] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);

  async function loadArchived() {
    try {
      const all = await fetchWithArchived();
      setArchivedSections((all || []).filter((s) => s.archived_at !== null));
    } catch {
      // silently fail — empty list shown
    }
  }

  useEffect(() => {
    loadArchived();
  }, []);

  useEffect(() => {
    if (expanded) {
      loadArchived();
    }
  }, [expanded]);

  async function handleRestore(id) {
    await unarchiveSection(id);
    await loadArchived();
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    await deleteSection(deleteTarget.id);
    setDeleteTarget(null);
    await loadArchived();
  }

  if (archivedSections.length === 0) return null;

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-2 text-xs text-muted-foreground py-2"
      >
        <HiOutlineChevronRight
          className={`h-3.5 w-3.5 transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}
        />
        {t('settings.sections.archivedSections', { count: archivedSections.length })}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div className="space-y-1 pb-2">
              {archivedSections.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-3 px-3 py-2 rounded-md"
                >
                  <span className="text-sm text-muted-foreground flex-1">{s.name}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRestore(s.id)}
                  >
                    {t('settings.sections.restoreSection')}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setDeleteTarget(s)}
                  >
                    {t('settings.sections.deleteSection')}
                  </Button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('settings.sections.deleteSectionTitle')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {t('settings.sections.deleteSectionMessage')}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              {t('settings.sections.cancelEdit')}
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              {t('settings.sections.deleteSection')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
