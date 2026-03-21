import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { HiOutlineCog6Tooth, HiOutlinePlus } from 'react-icons/hi2';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { useSections } from '../../hooks/useSections';
import SectionCard from './SectionCard';
import SectionEditDialog from './SectionEditDialog';
import ArchivedSectionsArea from './ArchivedSectionsArea';

export default function SectionsManagementCard() {
  const { t } = useTranslation();
  const { sections, reorderSections } = useSections();

  const [createOpen, setCreateOpen] = useState(false);
  const [reorderError, setReorderError] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  async function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sections.findIndex((s) => s.id === active.id);
    const newIndex = sections.findIndex((s) => s.id === over.id);
    const newOrder = arrayMove(sections, oldIndex, newIndex);
    try {
      await reorderSections(newOrder);
    } catch {
      setReorderError(t('settings.sections.reorderError'));
      setTimeout(() => setReorderError(null), 4000);
    }
  }

  return (
    <Card>
      <CardContent className="p-5">
        {/* Card header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <HiOutlineCog6Tooth className="h-[18px] w-[18px] text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-medium text-foreground">{t('settings.sections.title')}</h2>
            <p className="text-xs text-muted-foreground">{t('settings.sections.description')}</p>
          </div>
        </div>

        {/* Empty state */}
        {sections.length === 0 && (
          <div className="py-8 text-center">
            <p className="text-sm text-muted-foreground">{t('settings.sections.noSections')}</p>
            <p className="text-xs text-muted-foreground mt-1">{t('settings.sections.noSectionsHint')}</p>
          </div>
        )}

        {/* Section list */}
        {sections.length > 0 && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sections.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {sections.map((s) => (
                  <SectionCard key={s.id} section={s} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {reorderError && (
          <p className="text-xs text-destructive mt-2">{reorderError}</p>
        )}

        {/* Add Section button */}
        <Button
          variant="outline"
          className="w-full mt-4"
          onClick={() => setCreateOpen(true)}
        >
          <HiOutlinePlus className="h-4 w-4 mr-2" />
          {t('settings.sections.addSection')}
        </Button>

        {/* Create dialog */}
        <SectionEditDialog open={createOpen} onOpenChange={setCreateOpen} section={null} />

        {/* Archived area */}
        <div className="mt-6">
          <ArchivedSectionsArea />
        </div>
      </CardContent>
    </Card>
  );
}
