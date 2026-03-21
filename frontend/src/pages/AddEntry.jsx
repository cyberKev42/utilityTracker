import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { normalizeDecimal } from '../utils/normalizeDecimal';
import { getSectionDisplayName } from '../utils/sectionName';
import { createEntry } from '../services/entriesService';
import { useCurrency } from '../hooks/useCurrency';
import { useSections } from '../hooks/useSections';
import { api } from '../api';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineCheckCircle,
  HiExclamationCircle,
  HiInformationCircle,
} from 'react-icons/hi2';

function todayISO() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const STORAGE_KEY = 'addEntry.lastUsed';

export default function AddEntry() {
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();
  const { sections } = useSections();

  const [sectionId, setSectionId] = useState('');
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

  const [lastReading, setLastReading] = useState(null);
  const [lastReadingLoaded, setLastReadingLoaded] = useState(false);

  const hasLoadedFromStorage = useRef(false);

  const selectedSection = sections.find(s => s.id === sectionId) ?? null;
  const availableMeters = selectedSection?.meters ?? [];
  const selectedMeter = availableMeters.find(m => m.id === meterId) ?? null;
  const entryMode = selectedMeter?.entry_mode ?? 'usage_amount';
  const isReadingMode = entryMode === 'reading';

  const showFirstReadingBanner = isReadingMode && lastReadingLoaded && lastReading === null;

  // Load last-used section+meter from localStorage on mount only
  useEffect(() => {
    if (hasLoadedFromStorage.current || sections.length === 0) return;
    hasLoadedFromStorage.current = true;
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
      if (saved?.sectionId && saved?.meterId) {
        const sec = sections.find(s => s.id === saved.sectionId);
        const met = sec?.meters?.find(m => m.id === saved.meterId);
        if (sec && met) {
          setSectionId(saved.sectionId);
          setMeterId(saved.meterId);
        }
      }
    } catch { /* ignore corrupt storage */ }
  }, [sections]);

  // Save to localStorage when user changes selection
  useEffect(() => {
    if (sectionId && meterId) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ sectionId, meterId }));
    }
  }, [sectionId, meterId]);

  // Fetch last reading when meter changes
  useEffect(() => {
    if (!meterId) {
      setLastReading(null);
      setLastReadingLoaded(false);
      return;
    }
    setLastReadingLoaded(false);
    api.get(`/api/sections/meters/${meterId}/last-reading`)
      .then(data => { setLastReading(data); setLastReadingLoaded(true); })
      .catch(() => {
        // 404 means no entries exist for this meter — not an error
        setLastReading(null);
        setLastReadingLoaded(true);
      });
  }, [meterId]);

  // When meter changes, clear mode-specific fields and errors
  useEffect(() => {
    setUsageAmount('');
    setMeterReading('');
    setFieldErrors({});
    setTouched((prev) => ({ sectionId: prev.sectionId, meterId: prev.meterId }));
  }, [meterId]);

  const splitPreview = useMemo(() => {
    if (isReadingMode) return null;
    if (!startDate || !endDate || startDate === endDate) return null;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) return null;
    const days = Math.round((end - start) / 86400000) + 1;
    const usage = parseFloat(normalizeDecimal(usageAmount));
    if (isNaN(usage) || usage <= 0) return null;
    const perDay = Math.round((usage / days) * 100) / 100;
    return { days, perDay };
  }, [startDate, endDate, usageAmount, isReadingMode]);

  // Auto-calculate cost preview when usage or unit price changes
  const costPreview = useCallback(() => {
    if (isReadingMode) return null;
    const usage = parseFloat(normalizeDecimal(usageAmount));
    const price = parseFloat(normalizeDecimal(unitPrice));
    if (!isNaN(usage) && !isNaN(price) && usage > 0 && price >= 0) {
      return Math.round(usage * price * 100) / 100;
    }
    return null;
  }, [usageAmount, unitPrice, isReadingMode]);

  const handleSectionChange = (newSectionId) => {
    setSectionId(newSectionId);
    setMeterId('');
    setUsageAmount('');
    setMeterReading('');
    setFieldErrors({});
    setTouched(prev => ({ sectionId: true }));
    setLastReading(null);
    setLastReadingLoaded(false);
  };

  const validateField = (field, value) => {
    switch (field) {
      case 'sectionId':
        if (!value) return t('addEntry.validation.sectionRequired');
        return '';
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
        const num = parseFloat(normalizeDecimal(value));
        if (isNaN(num) || num <= 0) return t('addEntry.validation.usagePositive');
        return '';
      }
      case 'meterReading': {
        if (value === '' || value == null) return t('addEntry.validation.meterReadingRequired');
        const num = parseFloat(normalizeDecimal(value));
        if (isNaN(num) || num < 0) return t('addEntry.validation.meterReadingNonNegative');
        return '';
      }
      case 'unitPrice': {
        if (value === '' || value == null) return '';
        const num = parseFloat(normalizeDecimal(value));
        if (isNaN(num) || num < 0) return t('addEntry.validation.unitPricePositive');
        return '';
      }
      default:
        return '';
    }
  };

  const getFieldValue = (field) => {
    const map = { sectionId, meterId, startDate, endDate, usageAmount, meterReading, unitPrice };
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
    if (isReadingMode) return ['sectionId', 'meterId', 'startDate', 'meterReading'];
    return ['sectionId', 'meterId', 'startDate', 'endDate', 'usageAmount'];
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
    setSectionId('');
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
    setLastReading(null);
    setLastReadingLoaded(false);
  };

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
        payload.meter_reading = parseFloat(normalizeDecimal(meterReading));
      } else {
        payload.usage_amount = parseFloat(normalizeDecimal(usageAmount));
      }

      if (unitPrice !== '') {
        payload.unit_price = parseFloat(normalizeDecimal(unitPrice));
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

  const noMeters = sections.length === 0 || sections.every(s => !s.meters || s.meters.length === 0);
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
                {/* Section selector */}
                <div className="space-y-2">
                  <Label htmlFor="sectionId">{t('addEntry.section')}</Label>
                  <select
                    id="sectionId"
                    value={sectionId}
                    onChange={(e) => handleSectionChange(e.target.value)}
                    onBlur={() => handleBlur('sectionId')}
                    className={`flex h-11 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                      touched.sectionId && fieldErrors.sectionId ? 'border-destructive focus-visible:ring-destructive' : 'border-input'
                    }`}
                  >
                    <option value="">{t('addEntry.sectionPlaceholder')}</option>
                    {sections.map((s) => (
                      <option key={s.id} value={s.id}>{getSectionDisplayName(s, t)}</option>
                    ))}
                  </select>
                  {touched.sectionId && fieldErrors.sectionId && (
                    <p className="text-xs text-destructive">{fieldErrors.sectionId}</p>
                  )}
                </div>

                {/* Meter selector — only when section selected */}
                {sectionId && (
                  <div className="space-y-2">
                    <Label htmlFor="meterId">{t('addEntry.meter')}</Label>
                    {availableMeters.length === 0 ? (
                      <p className="text-sm text-muted-foreground">{t('addEntry.noMetersInSection')}</p>
                    ) : (
                      <>
                        <select
                          id="meterId"
                          value={meterId}
                          onChange={(e) => handleFieldChange('meterId', e.target.value)}
                          onBlur={() => handleBlur('meterId')}
                          className={`flex h-11 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                            touched.meterId && fieldErrors.meterId ? 'border-destructive focus-visible:ring-destructive' : 'border-input'
                          }`}
                        >
                          <option value="">{t('addEntry.meterPlaceholder')}</option>
                          {availableMeters.map((m) => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                          ))}
                        </select>
                        {touched.meterId && fieldErrors.meterId && (
                          <p className="text-xs text-destructive">{fieldErrors.meterId}</p>
                        )}
                      </>
                    )}
                    {/* Last reading / last usage display */}
                    {selectedMeter && lastReadingLoaded && lastReading && (
                      <p className="text-[13px] text-muted-foreground">
                        {t(isReadingMode ? 'addEntry.lastReading' : 'addEntry.lastUsage', {
                          value: isReadingMode ? lastReading.meter_reading : lastReading.usage_amount,
                          unit: selectedSection?.unit,
                          date: new Date(lastReading.entry_date).toLocaleDateString(),
                        })}
                      </p>
                    )}
                    {/* Unit display */}
                    {selectedMeter && selectedSection && (
                      <p className="text-xs text-muted-foreground">
                        {selectedSection.name} &middot; {selectedSection.unit}
                      </p>
                    )}
                  </div>
                )}

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
                      {/* First-reading info banner */}
                      {showFirstReadingBanner && (
                        <div className="flex items-start gap-2 p-3 rounded-lg bg-muted border border-border/50">
                          <HiInformationCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                          <p className="text-sm text-muted-foreground">{t('addEntry.firstReadingInfo')}</p>
                        </div>
                      )}

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
                              type="text"
                              inputMode="decimal"
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
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                          {/* Split preview */}
                          <AnimatePresence>
                            {splitPreview !== null && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="rounded-lg bg-accent/40 border border-border/30 px-4 py-3">
                                  <span className="text-sm text-muted-foreground">
                                    {t('addEntry.splitPreview', {
                                      total: usageAmount,
                                      unit: selectedSection?.unit,
                                      days: splitPreview.days,
                                      perDay: splitPreview.perDay,
                                    })}
                                  </span>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <div className="space-y-2">
                            <Label htmlFor="usageAmount">
                              {t('addEntry.usageAmount')}
                              {selectedMeter && (
                                <span className="ml-1 text-muted-foreground font-normal">({selectedSection?.unit})</span>
                              )}
                            </Label>
                            <Input
                              id="usageAmount"
                              type="text"
                              inputMode="decimal"
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
                          type="text"
                          inputMode="decimal"
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
