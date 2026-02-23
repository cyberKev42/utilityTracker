import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createEntry } from '../services/entriesService';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import {
  HiOutlineBolt,
  HiOutlineBeaker,
  HiOutlineFire,
  HiOutlineCheckCircle,
  HiExclamationCircle,
} from 'react-icons/hi2';

const TYPES = [
  { value: 'electricity', icon: HiOutlineBolt, defaultUnit: 'kWh' },
  { value: 'water', icon: HiOutlineBeaker, defaultUnit: 'm³' },
  { value: 'fuel', icon: HiOutlineFire, defaultUnit: 'L' },
];

function todayISO() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function AddEntry() {
  const { t } = useTranslation();

  const [type, setType] = useState('');
  const [usageAmount, setUsageAmount] = useState('');
  const [costAmount, setCostAmount] = useState('');
  const [unit, setUnit] = useState('');
  const [date, setDate] = useState(todayISO());
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validateField = (field, value) => {
    switch (field) {
      case 'type':
        if (!value) return t('addEntry.validation.typeRequired');
        return '';
      case 'usageAmount': {
        if (value === '' || value == null) return t('addEntry.validation.usageRequired');
        const num = parseFloat(value);
        if (isNaN(num) || num < 0) return t('addEntry.validation.usagePositive');
        return '';
      }
      case 'costAmount': {
        if (value === '' || value == null) return t('addEntry.validation.costRequired');
        const num = parseFloat(value);
        if (isNaN(num) || num < 0) return t('addEntry.validation.costPositive');
        return '';
      }
      case 'unit':
        if (!value || !value.trim()) return t('addEntry.validation.unitRequired');
        return '';
      case 'date':
        if (!value) return t('addEntry.validation.dateRequired');
        if (isNaN(new Date(value).getTime())) return t('addEntry.validation.dateInvalid');
        return '';
      default:
        return '';
    }
  };

  const getFieldValue = (field) => {
    const map = { type, usageAmount, costAmount, unit, date };
    return map[field] ?? '';
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setFieldErrors((prev) => ({
      ...prev,
      [field]: validateField(field, getFieldValue(field)),
    }));
  };

  const handleFieldChange = (field, value) => {
    if (field === 'type') setType(value);
    if (field === 'usageAmount') setUsageAmount(value);
    if (field === 'costAmount') setCostAmount(value);
    if (field === 'unit') setUnit(value);
    if (field === 'date') setDate(value);

    if (touched[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: validateField(field, value) }));
    }
  };

  const handleTypeSelect = (value) => {
    setType(value);
    const match = TYPES.find((t) => t.value === value);
    if (match) setUnit(match.defaultUnit);
    if (touched.type) {
      setFieldErrors((prev) => ({ ...prev, type: validateField('type', value) }));
    }
  };

  const validate = () => {
    const fields = ['type', 'usageAmount', 'costAmount', 'unit', 'date'];
    const errors = {};
    fields.forEach((f) => {
      errors[f] = validateField(f, getFieldValue(f));
    });
    setFieldErrors(errors);
    setTouched({ type: true, usageAmount: true, costAmount: true, unit: true, date: true });
    return fields.every((f) => !errors[f]);
  };

  const resetForm = () => {
    setType('');
    setUsageAmount('');
    setCostAmount('');
    setUnit('');
    setDate(todayISO());
    setFieldErrors({});
    setTouched({});
    setServerError('');
    setSuccess(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;

    setLoading(true);
    try {
      await createEntry({
        type,
        usage_amount: parseFloat(usageAmount),
        cost_amount: parseFloat(costAmount),
        unit: unit.trim(),
        date,
      });
      setSuccess(true);
    } catch (err) {
      setServerError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-lg mx-auto">
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center py-8 space-y-4">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <HiOutlineCheckCircle className="h-10 w-10 text-primary" />
              </div>
              <p className="text-lg font-semibold text-foreground">
                {t('addEntry.success')}
              </p>
              <Button onClick={resetForm} className="h-12 px-8 text-base">
                {t('addEntry.addAnother')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">{t('addEntry.title')}</h1>
        <p className="text-sm text-muted-foreground mt-1.5">{t('addEntry.description')}</p>
      </div>

      <Card>
        <CardContent className="p-5 sm:p-6">
          {serverError && (
            <div className="flex items-start gap-2 p-3 mb-5 rounded-lg bg-destructive/10 border border-destructive/20">
              <HiExclamationCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{serverError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div className="space-y-2.5">
              <Label>{t('addEntry.type')}</Label>
              <div className="grid grid-cols-3 gap-2.5">
                {TYPES.map((item) => {
                  const selected = type === item.value;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => handleTypeSelect(item.value)}
                      onBlur={() => handleBlur('type')}
                      className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-4 min-h-[84px] transition-all duration-200 active:scale-[0.97] ${
                        selected
                          ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary/20'
                          : 'border-border/50 bg-secondary text-muted-foreground active:bg-accent sm:hover:border-border sm:hover:text-foreground'
                      }`}
                    >
                      <item.icon className="h-6 w-6" />
                      <span className="text-xs font-medium">
                        {t(`addEntry.types.${item.value}`)}
                      </span>
                    </button>
                  );
                })}
              </div>
              {touched.type && fieldErrors.type && (
                <p className="text-xs text-destructive">{fieldErrors.type}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="usageAmount">{t('addEntry.usageAmount')}</Label>
                <Input
                  id="usageAmount"
                  type="number"
                  inputMode="decimal"
                  step="any"
                  min="0"
                  placeholder={t('addEntry.usageAmountPlaceholder')}
                  value={usageAmount}
                  onChange={(e) => handleFieldChange('usageAmount', e.target.value)}
                  onBlur={() => handleBlur('usageAmount')}
                  className={`h-12 text-base ${
                    touched.usageAmount && fieldErrors.usageAmount
                      ? 'border-destructive focus-visible:ring-destructive'
                      : ''
                  }`}
                />
                {touched.usageAmount && fieldErrors.usageAmount && (
                  <p className="text-xs text-destructive">{fieldErrors.usageAmount}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit">{t('addEntry.unit')}</Label>
                <Input
                  id="unit"
                  type="text"
                  placeholder={t('addEntry.unitPlaceholder')}
                  value={unit}
                  onChange={(e) => handleFieldChange('unit', e.target.value)}
                  onBlur={() => handleBlur('unit')}
                  className={`h-12 text-base ${
                    touched.unit && fieldErrors.unit
                      ? 'border-destructive focus-visible:ring-destructive'
                      : ''
                  }`}
                />
                {touched.unit && fieldErrors.unit && (
                  <p className="text-xs text-destructive">{fieldErrors.unit}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="costAmount">{t('addEntry.costAmount')}</Label>
              <Input
                id="costAmount"
                type="number"
                inputMode="decimal"
                step="any"
                min="0"
                placeholder={t('addEntry.costAmountPlaceholder')}
                value={costAmount}
                onChange={(e) => handleFieldChange('costAmount', e.target.value)}
                onBlur={() => handleBlur('costAmount')}
                className={`h-12 text-base ${
                  touched.costAmount && fieldErrors.costAmount
                    ? 'border-destructive focus-visible:ring-destructive'
                    : ''
                }`}
              />
              {touched.costAmount && fieldErrors.costAmount && (
                <p className="text-xs text-destructive">{fieldErrors.costAmount}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">{t('addEntry.date')}</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => handleFieldChange('date', e.target.value)}
                onBlur={() => handleBlur('date')}
                className={`h-12 text-base ${
                  touched.date && fieldErrors.date
                    ? 'border-destructive focus-visible:ring-destructive'
                    : ''
                }`}
              />
              {touched.date && fieldErrors.date && (
                <p className="text-xs text-destructive">{fieldErrors.date}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-medium"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  {t('addEntry.submitting')}
                </span>
              ) : (
                t('addEntry.submit')
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
