import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { createEntry } from '../services/entriesService';
import { useCurrency } from '../hooks/useCurrency';
import { useSections } from '../hooks/useSections';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineCheckCircle,
  HiExclamationCircle,
} from 'react-icons/hi2';

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
  const { sections } = useSections();

  // Flatten all active meters across all active sections
  const allMeters = sections.flatMap((s) =>
    (s.meters ?? []).map((m) => ({ ...m, sectionName: s.name, sectionUnit: s.unit }))
  );

  const [meterId, setMeterId] = useState('');
  const [startDate, setStartDate] = useState(todayISO());
  const [endDate, setEndDate] = useState(todayISO());
  const [usageAmount, setUsageAmount] = useState('');
  const [meterReading, setMeterReading] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const selectedMeter = allMeters.find((m) => m.id === meterId) ?? null;
  const entryMode = selectedMeter?.entry_mode ?? 'usage_amount';
  const isReadingMode = entryMode === 'reading';

  // Auto-calculate cost preview when usage or unit price changes
  const costPreview = useCallback(() => {
    if (isReadingMode) return null;
    const usage = parseFloat(usageAmount);
    const price = parseFloat(unitPrice);
    if (!isNaN(usage) && !isNaN(price) && usage > 0 && price >= 0) {
      return Math.round(usage * price * 100) / 100;
    }
    return null;
  }, [usageAmount, unitPrice, isReadingMode]);

  const validateField = (field, value) => {
    switch (field) {
      case 'meterId':
        if (!value) return t('addEntry.validation.meterRequired');
        return '';
      case 'startDate':
        if (!value) return t('addEntry.validation.dateRequired');
        if (isNaN(new Date(value).getTime())) return t('addEntry.validation.dateInvalid');
        return '';
      case 'endDate':
        if (!value) return t('addEntry.validation.dateRequired');
        if (isNaN(new Date(value).getTime())) return t('addEntry.validation.dateInvalid');
        if (startDate && new Date(value) < new Date(startDate))
          return t('addEntry.validation.endDateBeforeStart');
        return '';
      case 'usageAmount': {
        if (value === '' || value == null) return t('addEntry.validation.usageRequired');
        const num = parseFloat(value);
        if (isNaN(num) || num <= 0) return t('addEntry.validation.usagePositive');
        return '';
      }
      case 'meterReading': {
        if (value === '' || value == null) return t('addEntry.validation.meterReadingRequired');
        const num = parseFloat(value);
        if (isNaN(num) || num < 0) return t('addEntry.validation.meterReadingNonNegative');
        return '';
      }
      case 'unitPrice': {
        if (value === '' || value == null) return '';
        const num = parseFloat(value);
        if (isNaN(num) || num < 0) return t('addEntry.validation.unitPricePositive');
        return '';
      }
      default:
        return '';
    }
  };

  const getFieldValue = (field) => {
    const map = { meterId, startDate, endDate, usageAmount, meterReading, unitPrice };
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
    if (field === 'meterId') setMeterId(value);
    if (field === 'startDate') setStartDate(value);
    if (field === 'endDate') setEndDate(value);
    if (field === 'usageAmount') setUsageAmount(value);
    if (field === 'meterReading') setMeterReading(value);
    if (field === 'unitPrice') setUnitPrice(value);

    if (touched[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: validateField(field, value) }));
    }
  };

  const getRequiredFields = () => {
    if (isReadingMode) return ['meterId', 'startDate', 'meterReading'];
    return ['meterId', 'startDate', 'endDate', 'usageAmount'];
  };

  const validate = () => {
    const fields = getRequiredFields();
    const errors = {};
    fields.forEach((f) => {
      errors[f] = validateField(f, getFieldValue(f));
    });
    if (unitPrice !== '') {
      errors.unitPrice = validateField('unitPrice', unitPrice);
    }
    setFieldErrors(errors);
    const allTouched = {};
    fields.forEach((f) => { allTouched[f] = true; });
    setTouched(allTouched);
    return fields.every((f) => !errors[f]) && !errors.unitPrice;
  };

  const resetForm = () => {
    setMeterId('');
    setStartDate(todayISO());
    setEndDate(todayISO());
    setUsageAmount('');
    setMeterReading('');
    setUnitPrice('');
    setFieldErrors({});
    setTouched({});
    setServerError('');
    setSuccess(false);
  };

  // When meter changes, clear mode-specific fields and errors
  useEffect(() => {
    setUsageAmount('');
    setMeterReading('');
    setFieldErrors({});
    setTouched((prev) => ({ meterId: prev.meterId }));
  }, [meterId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;

    setLoading(true);
    try {
      const payload = {
        meter_id: meterId,
        start_date: startDate,
        end_date: isReadingMode ? startDate : endDate,
      };

      if (isReadingMode) {
        payload.meter_reading = parseFloat(meterReading);
      } else {
        payload.usage_amount = parseFloat(usageAmount);
      }

      if (unitPrice !== '') {
        payload.unit_price = parseFloat(unitPrice);
      }

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

  const noMeters = allMeters.length === 0;
  const cost = costPreview();

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

            {noMeters ? (
              <div className="text-center py-8 space-y-2">
                <p className="text-sm text-muted-foreground">{t('addEntry.noMeters')}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                {/* Meter selector */}
                <div className="space-y-2">
                  <Label htmlFor="meterId">{t('addEntry.meter')}</Label>
                  <select
                    id="meterId"
                    value={meterId}
                    onChange={(e) => handleFieldChange('meterId', e.target.value)}
                    onBlur={() => handleBlur('meterId')}
                    className={`flex h-11 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                      touched.meterId && fieldErrors.meterId
                        ? 'border-destructive focus-visible:ring-destructive'
                        : 'border-input'
                    }`}
                  >
                    <option value="">{t('addEntry.meterPlaceholder')}</option>
                    {sections.map((section) => (
                      section.meters?.length > 0 && (
                        <optgroup key={section.id} label={section.name}>
                          {section.meters.map((meter) => (
                            <option key={meter.id} value={meter.id}>
                              {meter.name}
                            </option>
                          ))}
                        </optgroup>
                      )
                    ))}
                  </select>
                  {touched.meterId && fieldErrors.meterId && (
                    <p className="text-xs text-destructive">{fieldErrors.meterId}</p>
                  )}
                  {selectedMeter && (
                    <p className="text-xs text-muted-foreground">
                      {selectedMeter.sectionName} &middot; {selectedMeter.sectionUnit}
                    </p>
                  )}
                </div>

                <AnimatePresence>
                  {meterId && (
                    <motion.div
                      key="entry-fields"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-5"
                    >
                      {isReadingMode ? (
                        /* Reading mode: single date + meter reading */
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="startDate">{t('addEntry.date')}</Label>
                            <Input
                              id="startDate"
                              type="date"
                              value={startDate}
                              onChange={(e) => handleFieldChange('startDate', e.target.value)}
                              onBlur={() => handleBlur('startDate')}
                              className={`h-11 ${
                                touched.startDate && fieldErrors.startDate
                                  ? 'border-destructive focus-visible:ring-destructive'
                                  : ''
                              }`}
                            />
                            {touched.startDate && fieldErrors.startDate && (
                              <p className="text-xs text-destructive">{fieldErrors.startDate}</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="meterReading">{t('addEntry.meterReading')}</Label>
                            <Input
                              id="meterReading"
                              type="number"
                              inputMode="decimal"
                              step="any"
                              min="0"
                              placeholder={t('addEntry.meterReadingPlaceholder')}
                              value={meterReading}
                              onChange={(e) => handleFieldChange('meterReading', e.target.value)}
                              onBlur={() => handleBlur('meterReading')}
                              className={`h-11 ${
                                touched.meterReading && fieldErrors.meterReading
                                  ? 'border-destructive focus-visible:ring-destructive'
                                  : ''
                              }`}
                            />
                            {touched.meterReading && fieldErrors.meterReading && (
                              <p className="text-xs text-destructive">{fieldErrors.meterReading}</p>
                            )}
                          </div>
                        </>
                      ) : (
                        /* Usage mode: start_date + end_date + usage_amount */
                        <>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label htmlFor="startDate">{t('addEntry.startDate')}</Label>
                              <Input
                                id="startDate"
                                type="date"
                                value={startDate}
                                onChange={(e) => handleFieldChange('startDate', e.target.value)}
                                onBlur={() => handleBlur('startDate')}
                                className={`h-11 ${
                                  touched.startDate && fieldErrors.startDate
                                    ? 'border-destructive focus-visible:ring-destructive'
                                    : ''
                                }`}
                              />
                              {touched.startDate && fieldErrors.startDate && (
                                <p className="text-xs text-destructive">{fieldErrors.startDate}</p>
                              )}
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="endDate">{t('addEntry.endDate')}</Label>
                              <Input
                                id="endDate"
                                type="date"
                                value={endDate}
                                onChange={(e) => handleFieldChange('endDate', e.target.value)}
                                onBlur={() => handleBlur('endDate')}
                                className={`h-11 ${
                                  touched.endDate && fieldErrors.endDate
                                    ? 'border-destructive focus-visible:ring-destructive'
                                    : ''
                                }`}
                              />
                              {touched.endDate && fieldErrors.endDate && (
                                <p className="text-xs text-destructive">{fieldErrors.endDate}</p>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="usageAmount">
                              {t('addEntry.usageAmount')}
                              {selectedMeter && (
                                <span className="ml-1 text-muted-foreground font-normal">({selectedMeter.sectionUnit})</span>
                              )}
                            </Label>
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
                        </>
                      )}

                      {/* Optional unit price */}
                      <div className="space-y-2">
                        <Label htmlFor="unitPrice">{t('addEntry.unitPrice')} <span className="text-muted-foreground font-normal text-xs">({t('addEntry.optional')})</span></Label>
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

                      {/* Cost preview */}
                      <AnimatePresence>
                        {cost !== null && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                          >
                            <div className="rounded-lg bg-accent/40 border border-border/30 px-4 py-3 flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">{t('addEntry.totalCost')}</span>
                              <span className="text-lg font-semibold text-foreground tabular-nums">
                                {formatCurrency(cost)}
                              </span>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.div whileTap={{ scale: 0.98 }}>
                  <Button
                    type="submit"
                    className="w-full h-11 font-medium"
                    disabled={loading || noMeters}
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
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
