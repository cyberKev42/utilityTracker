import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getEntries, deleteEntry } from '../services/entriesService';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error && entries.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('entries.title')}</h1>
          <p className="text-muted-foreground mt-1">{t('entries.description')}</p>
        </div>
        <div className="flex items-start gap-2 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
          <HiExclamationCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{t('entries.loadError')}</p>
        </div>
      </div>
    );
  }

  const showEmpty = !loading && entries.length === 0 && !hasActiveFilters;
  const showNoResults = !loading && entries.length === 0 && hasActiveFilters;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('entries.title')}</h1>
        <p className="text-muted-foreground mt-1">{t('entries.description')}</p>
      </div>

      {!showEmpty && (
        <>
          <div className="flex items-center gap-2">
            <Button
              variant={filtersOpen ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="gap-1.5 h-11"
            >
              <HiOutlineFunnel className="h-4 w-4" />
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
                className="gap-1 text-muted-foreground h-11"
              >
                <HiOutlineXMark className="h-4 w-4" />
                {t('entries.clearFilters')}
              </Button>
            )}
            <span className="text-xs text-muted-foreground ml-auto tabular-nums">
              {t('entries.showing', { count: entries.length })}
            </span>
          </div>

          {filtersOpen && (
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                      {t('entries.type')}
                    </label>
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="w-full h-12 rounded-md border border-input bg-secondary px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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
                      className="w-full h-12 rounded-md border border-input bg-secondary px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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
                      className="w-full h-12 rounded-md border border-input bg-secondary px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {showEmpty && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center py-10 space-y-4">
              <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
                <HiOutlinePlusCircle className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground max-w-xs">
                {t('entries.noEntries')}
              </p>
              <Link to="/add-entry">
                <Button className="h-11 px-6">{t('entries.addFirst')}</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {showNoResults && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center py-8 space-y-3">
              <HiOutlineFunnel className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{t('entries.noResults')}</p>
              <Button variant="outline" className="h-11 px-6" onClick={clearFilters}>
                {t('entries.clearFilters')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {entries.length > 0 && (
        <>
          <div className="hidden md:block">
            <Card>
              <CardContent className="p-0">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">
                        {t('entries.type')}
                      </th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">
                        {t('entries.usage')}
                      </th>
                      <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">
                        {t('entries.cost')}
                      </th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">
                        {t('entries.date')}
                      </th>
                      <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3 w-[60px]">
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
                          className="border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className={`h-8 w-8 rounded-lg ${config.bgClass} flex items-center justify-center shrink-0`}>
                                <Icon className={`h-4 w-4 ${config.colorClass}`} />
                              </div>
                              <span className="text-sm font-medium text-foreground">
                                {t(`entries.${entry.type}`)}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-foreground tabular-nums">
                              {Number(entry.usage_amount).toLocaleString()} {entry.unit}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm font-semibold text-foreground tabular-nums">
                              {formatCurrency(entry.cost_amount)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-muted-foreground">
                              {formatDate(entry.date)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
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
          </div>

          <div className="md:hidden space-y-2">
            {entries.map((entry) => {
              const config = TYPE_CONFIG[entry.type];
              const Icon = config.icon;
              return (
                <Card key={entry.id}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start gap-3">
                      <div className={`h-10 w-10 rounded-lg ${config.bgClass} flex items-center justify-center shrink-0 mt-0.5`}>
                        <Icon className={`h-5 w-5 ${config.colorClass}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <Badge variant="outline" className="text-[11px] px-1.5 py-0">
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
                            <p className="text-sm font-semibold text-foreground tabular-nums">
                              {formatCurrency(entry.cost_amount)}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-11 w-11 p-0 text-muted-foreground hover:text-destructive shrink-0"
                            onClick={() => setDeleteTarget(entry)}
                          >
                            <HiOutlineTrash className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('entries.deleteConfirmTitle')}</DialogTitle>
            <DialogDescription>{t('entries.deleteConfirmMessage')}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <DialogClose asChild>
              <Button variant="outline" disabled={deleting} className="h-11">
                {t('entries.deleteCancel')}
              </Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
              className="h-11"
            >
              {deleting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  {t('entries.deleting')}
                </span>
              ) : (
                t('entries.deleteConfirm')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
