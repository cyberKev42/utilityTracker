import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getEntries, deleteEntry } from '../services/entriesService';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '../components/ui/dialog';
import {
  HiOutlineBolt,
  HiOutlineBeaker,
  HiOutlineFire,
  HiOutlinePlusCircle,
  HiOutlineTrash,
  HiOutlineFunnel,
  HiOutlineXMark,
  HiExclamationCircle,
} from 'react-icons/hi2';

const TYPE_CONFIG = {
  electricity: { icon: HiOutlineBolt, colorClass: 'text-amber-500', bgClass: 'bg-amber-500/10' },
  water: { icon: HiOutlineBeaker, colorClass: 'text-sky-500', bgClass: 'bg-sky-500/10' },
  fuel: { icon: HiOutlineFire, colorClass: 'text-orange-500', bgClass: 'bg-orange-500/10' },
};

const TYPES = ['electricity', 'water', 'fuel'];

const stagger = {
  animate: { transition: { staggerChildren: 0.04 } },
};

const fadeUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.25, 0.1, 0.25, 1] } },
};

function formatCurrency(value) {
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function Entries() {
  const { t } = useTranslation();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const hasActiveFilters = filterType || filterFrom || filterTo;

  const loadEntries = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const filters = {};
      if (filterType) filters.type = filterType;
      if (filterFrom) filters.from = filterFrom;
      if (filterTo) filters.to = filterTo;
      const data = await getEntries(filters);
      setEntries(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filterType, filterFrom, filterTo]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  function clearFilters() {
    setFilterType('');
    setFilterFrom('');
    setFilterTo('');
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteEntry(deleteTarget.id);
      setEntries((prev) => prev.filter((e) => e.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      setError(t('entries.deleteError'));
    } finally {
      setDeleting(false);
    }
  }

  if (loading && entries.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"
        />
      </div>
    );
  }

  if (error && entries.length === 0) {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground tracking-tight">{t('entries.title')}</h1>
          <p className="text-[13px] text-muted-foreground mt-1">{t('entries.description')}</p>
        </div>
        <div className="flex items-start gap-2 p-4 rounded-xl bg-destructive/10 border border-destructive/20">
          <HiExclamationCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{t('entries.loadError')}</p>
        </div>
      </motion.div>
    );
  }

  const showEmpty = !loading && entries.length === 0 && !hasActiveFilters;
  const showNoResults = !loading && entries.length === 0 && hasActiveFilters;

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-6">
      <motion.div variants={fadeUp}>
        <h1 className="text-xl font-semibold text-foreground tracking-tight">{t('entries.title')}</h1>
        <p className="text-[13px] text-muted-foreground mt-1">{t('entries.description')}</p>
      </motion.div>

      {!showEmpty && (
        <motion.div variants={fadeUp}>
          <div className="flex items-center gap-2">
            <Button
              variant={filtersOpen ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="gap-1.5 h-9"
            >
              <HiOutlineFunnel className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t('entries.filterByType')}</span>
              {hasActiveFilters && (
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              )}
            </Button>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="gap-1 text-muted-foreground h-9"
              >
                <HiOutlineXMark className="h-3.5 w-3.5" />
                {t('entries.clearFilters')}
              </Button>
            )}
            <span className="text-xs text-muted-foreground ml-auto tabular-nums">
              {t('entries.showing', { count: entries.length })}
            </span>
          </div>

          <AnimatePresence>
            {filtersOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                className="overflow-hidden"
              >
                <Card className="mt-3">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                          {t('entries.type')}
                        </label>
                        <select
                          value={filterType}
                          onChange={(e) => setFilterType(e.target.value)}
                          className="w-full h-10 rounded-lg border border-input bg-transparent px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                        >
                          <option value="">{t('entries.filterByType')}</option>
                          {TYPES.map((type) => (
                            <option key={type} value={type}>
                              {t(`entries.${type}`)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                          {t('entries.filterFrom')}
                        </label>
                        <input
                          type="date"
                          value={filterFrom}
                          onChange={(e) => setFilterFrom(e.target.value)}
                          className="w-full h-10 rounded-lg border border-input bg-transparent px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                          {t('entries.filterTo')}
                        </label>
                        <input
                          type="date"
                          value={filterTo}
                          onChange={(e) => setFilterTo(e.target.value)}
                          className="w-full h-10 rounded-lg border border-input bg-transparent px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {showEmpty && (
        <motion.div variants={fadeUp}>
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center py-10 space-y-4">
                <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
                  <HiOutlinePlusCircle className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground max-w-xs">
                  {t('entries.noEntries')}
                </p>
                <Link to="/add-entry">
                  <Button size="lg">{t('entries.addFirst')}</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {showNoResults && (
        <motion.div variants={fadeUp}>
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center py-8 space-y-3">
                <HiOutlineFunnel className="h-7 w-7 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{t('entries.noResults')}</p>
                <Button variant="outline" onClick={clearFilters}>
                  {t('entries.clearFilters')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {entries.length > 0 && (
        <>
          <motion.div variants={fadeUp} className="hidden md:block">
            <Card>
              <CardContent className="p-0">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/30">
                      <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">
                        {t('entries.type')}
                      </th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">
                        {t('entries.usage')}
                      </th>
                      <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">
                        {t('entries.cost')}
                      </th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">
                        {t('entries.date')}
                      </th>
                      <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3 w-[60px]">
                        {t('entries.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry) => {
                      const config = TYPE_CONFIG[entry.type];
                      const Icon = config.icon;
                      return (
                        <tr
                          key={entry.id}
                          className="border-b border-border/30 last:border-b-0 hover:bg-accent/40 transition-colors duration-150"
                        >
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className={`h-8 w-8 rounded-lg ${config.bgClass} flex items-center justify-center shrink-0`}>
                                <Icon className={`h-4 w-4 ${config.colorClass}`} />
                              </div>
                              <span className="text-sm font-medium text-foreground">
                                {t(`entries.${entry.type}`)}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <span className="text-sm text-foreground tabular-nums">
                              {Number(entry.usage_amount).toLocaleString()} {entry.unit}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right">
                            <span className="text-sm font-medium text-foreground tabular-nums">
                              {formatCurrency(entry.cost_amount)}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <span className="text-sm text-muted-foreground">
                              {formatDate(entry.date)}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                              onClick={() => setDeleteTarget(entry)}
                            >
                              <HiOutlineTrash className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={stagger} initial="initial" animate="animate" className="md:hidden space-y-2">
            {entries.map((entry) => {
              const config = TYPE_CONFIG[entry.type];
              const Icon = config.icon;
              return (
                <motion.div key={entry.id} variants={fadeUp}>
                  <Card className="active:bg-accent/30 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`h-10 w-10 rounded-lg ${config.bgClass} flex items-center justify-center shrink-0`}>
                          <Icon className={`h-5 w-5 ${config.colorClass}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <Badge variant="outline" className="text-[10px] px-1.5">
                              {t(`entries.${entry.type}`)}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(entry.date)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <div className="space-y-0.5">
                              <p className="text-xs text-muted-foreground">
                                {t('entries.usage')}: {Number(entry.usage_amount).toLocaleString()} {entry.unit}
                              </p>
                              <p className="text-sm font-medium text-foreground tabular-nums">
                                {formatCurrency(entry.cost_amount)}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-10 w-10 p-0 text-muted-foreground hover:text-destructive shrink-0"
                              onClick={() => setDeleteTarget(entry)}
                            >
                              <HiOutlineTrash className="h-5 w-5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </>
      )}

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('entries.deleteConfirmTitle')}</DialogTitle>
            <DialogDescription>{t('entries.deleteConfirmMessage')}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <DialogClose asChild>
              <Button variant="outline" disabled={deleting} className="h-11 sm:h-9">
                {t('entries.deleteCancel')}
              </Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
              className="h-11 sm:h-9"
            >
              {deleting ? (
                <span className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  {t('entries.deleting')}
                </span>
              ) : (
                t('entries.deleteConfirm')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
