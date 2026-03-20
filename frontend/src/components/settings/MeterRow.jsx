import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { HiOutlineBars3, HiOutlineTrash, HiOutlineCalculator, HiOutlineSignal } from 'react-icons/hi2';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { useSections } from '../../hooks/useSections';

export default function MeterRow({ meter, sectionId, isNew = false }) {
  const { t } = useTranslation();
  const { updateMeter, deleteMeter } = useSections();

  const [editing, setEditing] = useState(isNew);
  const [value, setValue] = useState(meter.name);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);
  const errorTimerRef = useRef(null);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: meter.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  useEffect(() => {
    return () => {
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    };
  }, []);

  function showError(msg) {
    setError(msg);
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    errorTimerRef.current = setTimeout(() => setError(null), 4000);
  }

  async function handleSave() {
    const trimmed = value.trim();
    if (!trimmed) {
      setValue(meter.name);
      setEditing(false);
      return;
    }
    if (trimmed === meter.name) {
      setEditing(false);
      return;
    }
    try {
      await updateMeter(sectionId, meter.id, { name: trimmed });
      setEditing(false);
    } catch {
      setValue(meter.name);
      setEditing(false);
      showError(t('settings.sections.renameError'));
    }
  }

  async function handleDeleteConfirm() {
    setDeleting(true);
    try {
      await deleteMeter(sectionId, meter.id);
      setDeleteOpen(false);
    } catch {
      setDeleteOpen(false);
      showError(t('settings.sections.saveError'));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div ref={setNodeRef} style={style}>
      <div className="group flex items-center gap-2 px-3 py-2 rounded-md min-h-[44px] hover:bg-muted/50">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="flex items-center justify-center text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
          aria-label={t('settings.sections.reorderHint')}
        >
          <HiOutlineBars3 className="h-4 w-4" />
        </button>

        {editing ? (
          <Input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            className="flex-1 h-8 text-sm"
          />
        ) : (
          <span
            onClick={() => setEditing(true)}
            className="text-sm text-foreground cursor-pointer flex-1"
          >
            {meter.name}
          </span>
        )}

        <button
          type="button"
          onClick={async () => {
            const newMode = meter.entry_mode === 'reading' ? 'usage' : 'reading';
            try {
              await updateMeter(sectionId, meter.id, { entry_mode: newMode });
            } catch {
              showError(t('settings.sections.saveError'));
            }
          }}
          className="flex items-center justify-center text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
          title={meter.entry_mode === 'reading'
            ? t('settings.sections.modeReading', 'Meter reading mode — click to switch to usage')
            : t('settings.sections.modeUsage', 'Usage amount mode — click to switch to meter reading')}
        >
          {meter.entry_mode === 'reading'
            ? <HiOutlineSignal className="h-4 w-4" />
            : <HiOutlineCalculator className="h-4 w-4" />}
        </button>

        <button
          type="button"
          onClick={() => setDeleteOpen(true)}
          className="flex items-center justify-center text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label={t('settings.sections.deleteMeter')}
        >
          <HiOutlineTrash className="h-4 w-4" />
        </button>
      </div>

      {error && (
        <p className="text-xs text-destructive px-3 pb-1">{error}</p>
      )}

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('settings.sections.deleteMeterTitle')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {t('settings.sections.deleteMeterMessage', { name: meter.name })}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              {t('settings.sections.cancelEdit')}
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deleting}>
              {deleting
                ? <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ repeat: Infinity, duration: 1 }}>Deleting...</motion.span>
                : t('settings.sections.deleteMeter')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
