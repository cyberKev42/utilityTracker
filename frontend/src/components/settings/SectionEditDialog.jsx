import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import IconPickerGrid from './IconPickerGrid';
import { useSections } from '../../hooks/useSections';

const PRESET_UNITS = ['kWh', 'MWh', 'm³', 'L', 'gal', 'therms', 'kg', 't'];

function getInitialState(section) {
  if (!section) {
    return { name: '', unit: 'kWh', icon: 'HiOutlineBolt', unitMode: 'preset', customUnit: '' };
  }
  const isPreset = PRESET_UNITS.includes(section.unit);
  return {
    name: section.name,
    unit: isPreset ? section.unit : 'custom',
    icon: section.icon || 'HiOutlineBolt',
    unitMode: isPreset ? 'preset' : 'custom',
    customUnit: isPreset ? '' : section.unit,
  };
}

export default function SectionEditDialog({ open, onOpenChange, section }) {
  const { t } = useTranslation();
  const { createSection, updateSection } = useSections();

  const [name, setName] = useState('');
  const [unit, setUnit] = useState('kWh');
  const [icon, setIcon] = useState('HiOutlineBolt');
  const [unitMode, setUnitMode] = useState('preset');
  const [customUnit, setCustomUnit] = useState('');
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      const init = getInitialState(section);
      setName(init.name);
      setUnit(init.unit);
      setIcon(init.icon);
      setUnitMode(init.unitMode);
      setCustomUnit(init.customUnit);
      setError(null);
    }
  }, [open, section]);

  function handleUnitChange(e) {
    const val = e.target.value;
    setUnit(val);
    if (val === 'custom') {
      setUnitMode('custom');
    } else {
      setUnitMode('preset');
    }
  }

  const isSubmitDisabled =
    !name.trim() || (unitMode === 'custom' && !customUnit.trim()) || saving;

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const finalUnit = unitMode === 'custom' ? customUnit.trim() : unit;
    try {
      if (section) {
        await updateSection(section.id, { name: name.trim(), unit: finalUnit, icon });
      } else {
        await createSection({ name: name.trim(), unit: finalUnit, icon });
      }
      onOpenChange(false);
    } catch {
      setError(t('settings.sections.saveError'));
    } finally {
      setSaving(false);
    }
  }

  function handleClose() {
    onOpenChange(false);
  }

  const isEdit = Boolean(section);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t('settings.sections.editSection') : t('settings.sections.createSection')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-foreground">{t('settings.sections.name')}</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('settings.sections.namePlaceholder')}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-foreground">{t('settings.sections.unit')}</label>
            <select
              value={unit}
              onChange={handleUnitChange}
              className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {PRESET_UNITS.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
              <option value="custom">{t('settings.sections.unitCustom')}</option>
            </select>
            {unitMode === 'custom' && (
              <Input
                value={customUnit}
                onChange={(e) => setCustomUnit(e.target.value)}
                placeholder={t('settings.sections.unitCustomPlaceholder')}
              />
            )}
          </div>

          <IconPickerGrid selectedIcon={icon} onSelect={setIcon} />

          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              {isEdit ? t('settings.sections.cancelEdit') : t('settings.sections.cancelCreate')}
            </Button>
            <Button type="submit" disabled={isSubmitDisabled}>
              {isEdit ? t('settings.sections.saveSectionChanges') : t('settings.sections.createSectionSubmit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
