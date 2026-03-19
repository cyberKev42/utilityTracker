import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { AnimatePresence, motion } from 'framer-motion';
import {
  HiOutlinePencilSquare,
  HiOutlineArchiveBox,
  HiOutlineBars3,
  HiOutlineChevronDown,
  HiOutlinePlus,
} from 'react-icons/hi2';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { ICON_MAP } from './IconPickerGrid';
import MeterRow from './MeterRow';
import SectionEditDialog from './SectionEditDialog';
import { useSections } from '../../hooks/useSections';

export default function SectionCard({ section }) {
  const { t } = useTranslation();
  const { archiveSection, createMeter, reorderMeters } = useSections();

  const [isExpanded, setIsExpanded] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [newMeterId, setNewMeterId] = useState(null);
  const [reorderError, setReorderError] = useState(null);
  const reorderErrorTimerRef = useRef(null);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    boxShadow: isDragging ? '0 8px 24px rgba(0,0,0,0.25)' : undefined,
  };

  const meterSensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    return () => {
      if (reorderErrorTimerRef.current) clearTimeout(reorderErrorTimerRef.current);
    };
  }, []);

  function showReorderError(msg) {
    setReorderError(msg);
    if (reorderErrorTimerRef.current) clearTimeout(reorderErrorTimerRef.current);
    reorderErrorTimerRef.current = setTimeout(() => setReorderError(null), 4000);
  }

  async function handleMeterDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = section.meters.findIndex((m) => m.id === active.id);
    const newIndex = section.meters.findIndex((m) => m.id === over.id);
    const newOrder = arrayMove(section.meters, oldIndex, newIndex);
    try {
      await reorderMeters(section.id, newOrder);
    } catch {
      showReorderError(t('settings.sections.reorderError'));
    }
  }

  async function handleAddMeter() {
    try {
      const newMeter = await createMeter(section.id, { name: 'New Meter' });
      if (newMeter?.id) {
        setNewMeterId(newMeter.id);
      }
    } catch {
      // silently fail — meter list will not update
    }
  }

  const IconComponent = ICON_MAP[section.icon] || null;

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="hover:bg-muted/50 transition-colors duration-150">
        {/* Collapsed header */}
        <div
          className="flex items-center gap-3 px-4 py-3 min-h-[44px] cursor-pointer"
          onClick={() => setIsExpanded((v) => !v)}
        >
          {/* Section icon */}
          {IconComponent && (
            <IconComponent className="h-5 w-5 text-primary shrink-0" />
          )}

          {/* Section name + unit */}
          <span className="text-sm font-semibold text-foreground flex-1">{section.name}</span>
          <span className="text-xs text-muted-foreground">{section.unit}</span>

          {/* Chevron */}
          <HiOutlineChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          />

          {/* Right actions — stopPropagation to avoid toggle */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setEditOpen(true); }}
            className="flex items-center justify-center text-muted-foreground hover:text-foreground p-1"
            aria-label={t('settings.sections.editSectionLabel')}
          >
            <HiOutlinePencilSquare className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); archiveSection(section.id); }}
            className="flex items-center justify-center text-muted-foreground hover:text-foreground p-1"
            aria-label={t('settings.sections.archiveSection')}
          >
            <HiOutlineArchiveBox className="h-4 w-4" />
          </button>

          {/* Drag handle — listeners spread only here */}
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="flex items-center justify-center text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing p-1"
            aria-label={t('settings.sections.reorderHint')}
            onClick={(e) => e.stopPropagation()}
          >
            <HiOutlineBars3 className="h-4 w-4" />
          </button>
        </div>

        {/* Expanded meters area */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
              style={{ overflow: 'hidden' }}
            >
              <div className="px-4 pb-3">
                <DndContext
                  sensors={meterSensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleMeterDragEnd}
                >
                  <SortableContext
                    items={(section.meters || []).map((m) => m.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {(section.meters || []).map((m) => (
                      <MeterRow
                        key={m.id}
                        meter={m}
                        sectionId={section.id}
                        isNew={m.id === newMeterId}
                      />
                    ))}
                  </SortableContext>
                </DndContext>

                {reorderError && (
                  <p className="text-xs text-destructive mt-1">{reorderError}</p>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-xs"
                  onClick={handleAddMeter}
                >
                  <HiOutlinePlus className="h-3.5 w-3.5 mr-1" />
                  {t('settings.sections.addMeter')}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      <SectionEditDialog open={editOpen} onOpenChange={setEditOpen} section={section} />
    </div>
  );
}
