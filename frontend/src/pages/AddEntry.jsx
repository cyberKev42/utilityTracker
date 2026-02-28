import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { createEntry } from '../services/entriesService';
import { getUnitPrice } from '../services/settingsService';
import { useCurrency } from '../hooks/useCurrency';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineBolt,
  HiOutlineBeaker,
  HiOutlineFire,
  HiOutlineCheckCircle,
  HiExclamationCircle,
} from 'react-icons/hi2';

const TYPES = [
  { value: 'power', icon: HiOutlineBolt, defaultUnit: 'kWh' },
  { value: 'water', icon: HiOutlineBeaker, defaultUnit: 'm\u00B3' },
  { value: 'fuel', icon: HiOutlineFire, defaultUnit: 'L' },
];

const fadeUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.25, 0.1, 0.25, 1] } },
};

function todayISO() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function AddEntry() {
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();

  const [type, setType] = useState('');
  const [usageAmount, setUsageAmount] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [costAmount, setCostAmount] = useState('');
  const [manualCost, setManualCost] = useState(false);
  const [unit, setUnit] = useState('');
  const [date, setDate] = useState(todayISO());
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Auto-calculate cost when usage or unit price changes (unless manual override)
  const autoCalculate = useCallback(() => {
    if (manualCost) return;
    if (usageAmount !== '' && unitPrice !== '') {
      const calc = parseFloat(usageAmount) * parseFloat(unitPrice);
      if (!isNaN(calc)) {
        setCostAmount(String(Math.round(calc * 100) / 100));
        return;
      }
    }
    setCostAmount('');
  }, [usageAmount, unitPrice, manualCost]);

  useEffect(() => {
    autoCalculate();
  }, [autoCalculate]);

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
      case 'unitPrice': {
        if (value === '' || value == null) return t('addEntry.validation.unitPriceRequired');
        const num = parseFloat(value);
        if (isNaN(num) || num < 0) return t('addEntry.validation.unitPricePositive');
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
    const map = { type, usageAmount, unitPrice, costAmount, unit, date };
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
    if (field === 'unitPrice') {
      setUnitPrice(value);
      setManualCost(false); // Reset manual override when unit price changes
    }
    if (field === 'unit') setUnit(value);
    if (field === 'date') setDate(value);

    if (touched[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: validateField(field, value) }));
    }
  };

  const handleTypeSelect = async (value) => {
    setType(value);
    const match = TYPES.find((t) => t.value === value);
    if (match) setUnit(match.defaultUnit);
    setManualCost(false);
    if (touched.type) {
      setFieldErrors((prev) => ({ ...prev, type: validateField('type', value) }));
    }

    // Fetch saved unit price for this type
    try {
      const data = await getUnitPrice(value);
      if (data.unit_price != null) {
        setUnitPrice(String(data.unit_price));
      } else {
        setUnitPrice('');
      }
    } catch {
      // Silently ignore — user can enter manually
    }
  };

  const validate = () => {
    const fields = ['type', 'usageAmount', 'unitPrice', 'costAmount', 'unit', 'date'];
    const errors = {};
    fields.forEach((f) => {
      errors[f] = validateField(f, getFieldValue(f));
    });
    setFieldErrors(errors);
    setTouched({ type: true, usageAmount: true, unitPrice: true, costAmount: true, unit: true, date: true });
    return fields.every((f) => !errors[f]);
  };

  const resetForm = () => {
    setType('');
    setUsageAmount('');
    setUnitPrice('');
    setCostAmount('');
    setManualCost(false);
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
      const payload = {
        type,
        usage_amount: parseFloat(usageAmount),
        unit: unit.trim(),
        date,
      };

      payload.unit_price = parseFloat(unitPrice);

      await createEntry(payload);
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
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center py-8 space-y-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: 'spring', stiffness: 400, damping: 20 }}
                  className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center"
                >
                  <HiOutlineCheckCircle className="h-8 w-8 text-primary" />
                </motion.div>
                <p className="text-lg font-semibold text-foreground">
                  {t('addEntry.success')}
                </p>
                <Button onClick={resetForm} size="lg">
                  {t('addEntry.addAnother')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-foreground tracking-tight">{t('addEntry.title')}</h1>
          <p className="text-[13px] text-muted-foreground mt-1">{t('addEntry.description')}</p>
        </div>

        <Card>
          <CardContent className="p-5 sm:p-6">
            <AnimatePresence>
              {serverError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-start gap-2 p-3 mb-5 rounded-lg bg-destructive/10 border border-destructive/20">
                    <HiExclamationCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                    <p className="text-sm text-destructive">{serverError}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div className="space-y-2">
                <Label>{t('addEntry.type')}</Label>
                <div className="grid grid-cols-3 gap-2.5">
                  {TYPES.map((item) => {
                    const selected = type === item.value;
                    return (
                      <motion.button
                        key={item.value}
                        type="button"
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleTypeSelect(item.value)}
                        onBlur={() => handleBlur('type')}
                        className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-4 min-h-[80px] transition-colors duration-150 ${
                          selected
                            ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary/20'
                            : 'border-border/40 bg-card text-muted-foreground active:bg-accent sm:hover:border-border/60 sm:hover:text-foreground'
                        }`}
                      >
                        <item.icon className="h-6 w-6" />
                        <span className="text-xs font-medium">
                          {t(`addEntry.types.${item.value}`)}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
                {touched.type && fieldErrors.type && (
                  <p className="text-xs text-destructive">{fieldErrors.type}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                    className={`h-11 ${
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
                    className={`h-11 ${
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

              {unitPrice !== '' && unit && (
                <motion.div {...fadeUp}>
                  <p className="text-sm text-muted-foreground">
                    {t('addEntry.unitPricePerUnit', { price: formatCurrency(parseFloat(unitPrice)), unit })}
                  </p>
                </motion.div>
              )}

              <div className="space-y-2">
                <Label htmlFor="unitPrice">{t('addEntry.unitPrice')}</Label>
                <Input
                  id="unitPrice"
                  type="number"
                  inputMode="decimal"
                  step="any"
                  min="0"
                  placeholder={t('addEntry.unitPricePlaceholder')}
                  value={unitPrice}
                  onChange={(e) => handleFieldChange('unitPrice', e.target.value)}
                  onBlur={() => handleBlur('unitPrice')}
                  className={`h-11 ${
                    touched.unitPrice && fieldErrors.unitPrice
                      ? 'border-destructive focus-visible:ring-destructive'
                      : ''
                  }`}
                />
                {touched.unitPrice && fieldErrors.unitPrice && (
                  <p className="text-xs text-destructive">{fieldErrors.unitPrice}</p>
                )}
              </div>

              {costAmount !== '' && !isNaN(parseFloat(costAmount)) && (
                <motion.div {...fadeUp}>
                  <div className="rounded-lg bg-accent/40 border border-border/30 px-4 py-3 flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t('addEntry.totalCost')}</span>
                    <span className="text-lg font-semibold text-foreground tabular-nums">
                      {formatCurrency(parseFloat(costAmount))}
                    </span>
                  </div>
                </motion.div>
              )}

              <div className="space-y-2">
                <Label htmlFor="date">{t('addEntry.date')}</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => handleFieldChange('date', e.target.value)}
                  onBlur={() => handleBlur('date')}
                  className={`h-11 ${
                    touched.date && fieldErrors.date
                      ? 'border-destructive focus-visible:ring-destructive'
                      : ''
                  }`}
                />
                {touched.date && fieldErrors.date && (
                  <p className="text-xs text-destructive">{fieldErrors.date}</p>
                )}
              </div>

              <motion.div whileTap={{ scale: 0.98 }}>
                <Button
                  type="submit"
                  className="w-full h-11 font-medium"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      {t('addEntry.submitting')}
                    </span>
                  ) : (
                    t('addEntry.submit')
                  )}
                </Button>
              </motion.div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
