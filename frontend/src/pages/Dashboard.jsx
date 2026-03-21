import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEntriesData } from '../hooks/useEntriesData';
import { useCurrency } from '../hooks/useCurrency';
import { useSections } from '../hooks/useSections';
import { ICON_MAP } from '../components/settings/IconPickerGrid';
import { getSectionDisplayName } from '../utils/sectionName';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import Sparkline from '../components/charts/Sparkline';
import { motion } from 'framer-motion';
import {
  HiOutlineBanknotes,
  HiExclamationCircle,
  HiOutlinePlusCircle,
  HiOutlineSquares2X2,
} from 'react-icons/hi2';

const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.25, 0.1, 0.25, 1] } },
};

const cardHover = {
  y: -2,
  transition: { duration: 0.15, ease: 'easeOut' },
};

const SECTION_COLORS = [
  { colorClass: 'text-amber-500', bgClass: 'bg-amber-500/10' },
  { colorClass: 'text-sky-500', bgClass: 'bg-sky-500/10' },
  { colorClass: 'text-orange-500', bgClass: 'bg-orange-500/10' },
  { colorClass: 'text-emerald-500', bgClass: 'bg-emerald-500/10' },
  { colorClass: 'text-violet-500', bgClass: 'bg-violet-500/10' },
  { colorClass: 'text-rose-500', bgClass: 'bg-rose-500/10' },
];

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function Dashboard() {
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();
  const { sections: contextSections } = useSections();
  const { stats, entries, recentEntries, trend, loading, error } = useEntriesData();

  const [displayMode, setDisplayMode] = useState(
    () => localStorage.getItem('dashboard_display_mode') || 'usage'
  );

  const sparklineDataBySection = useMemo(() => {
    const bySectionName = {};
    for (const entry of entries) {
      if (!bySectionName[entry.section_name]) bySectionName[entry.section_name] = [];
      bySectionName[entry.section_name].push(entry);
    }
    const result = {};
    for (const [name, sectionEntries] of Object.entries(bySectionName)) {
      const byWeek = {};
      for (const e of sectionEntries) {
        const d = new Date(e.date);
        const day = d.getDay() || 7;
        const monday = new Date(d);
        monday.setDate(d.getDate() - day + 1);
        const key = monday.toISOString().slice(0, 10);
        if (!byWeek[key]) byWeek[key] = 0;
        byWeek[key] += Number(e.usage_amount) || 0;
      }
      result[name] = Object.entries(byWeek)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-7)
        .map(([, val]) => ({ value: val }));
    }
    return result;
  }, [entries]);

  // Build section lookup from context for icons
  const sectionLookup = {};
  for (const s of contextSections) {
    sectionLookup[s.name] = s;
  }

  const statsSections = stats?.sections ?? [];
  const totalCost = statsSections.reduce((sum, s) => sum + (s.total_cost || 0), 0);
  const totalCount = statsSections.reduce((sum, s) => sum + (s.entry_count || 0), 0);

  const renderTrend = () => {
    if (!trend) return null;

    if (trend.trendPercent == null) {
      return (
        <p className="text-xs text-muted-foreground mt-1">
          {t('dashboard.trendNoData')}
        </p>
      );
    }

    if (trend.trendPercent > 0) {
      return (
        <p className="text-xs font-medium text-red-500 mt-1">
          ↑ +{Math.abs(trend.trendPercent).toFixed(1)}% {t('dashboard.trendVsPrevious')}
        </p>
      );
    }

    if (trend.trendPercent < 0) {
      return (
        <p className="text-xs font-medium text-emerald-500 mt-1">
          ↓ {Math.abs(trend.trendPercent).toFixed(1)}% {t('dashboard.trendVsPrevious')}
        </p>
      );
    }

    // trendPercent === 0
    return (
      <p className="text-xs text-muted-foreground mt-1">
        0% {t('dashboard.trendVsPrevious')}
      </p>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-6 w-32 bg-card animate-pulse rounded" />
          <div className="h-4 w-48 bg-card animate-pulse rounded mt-2" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-card animate-pulse rounded-lg h-[140px]" />
          <div className="bg-card animate-pulse rounded-lg h-[140px]" />
          <div className="bg-card animate-pulse rounded-lg h-[140px]" />
          <div className="bg-card animate-pulse rounded-lg h-[140px]" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-2 p-4 rounded-xl bg-destructive/10 border border-destructive/20"
      >
        <HiExclamationCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
        <p className="text-sm text-destructive">{t('dashboard.loadingError')}</p>
      </motion.div>
    );
  }

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-6">
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground tracking-tight">{t('dashboard.title')}</h1>
          <p className="text-[13px] text-muted-foreground mt-1">{t('dashboard.description')}</p>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-lg bg-muted w-fit">
          {['cost', 'usage'].map((mode) => (
            <motion.button
              key={mode}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setDisplayMode(mode);
                localStorage.setItem('dashboard_display_mode', mode);
              }}
              className={[
                'px-3 py-1.5 rounded-md text-xs font-medium transition-colors duration-150',
                displayMode === mode
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              ].join(' ')}
            >
              {t(mode === 'cost' ? 'dashboard.toggleCost' : 'dashboard.toggleUsage')}
            </motion.button>
          ))}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <motion.div variants={fadeUp} whileHover={cardHover} className="sm:col-span-2 lg:col-span-1">
          <Card className="h-full hover:border-border/60 transition-colors duration-200">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <HiOutlineBanknotes className="h-[18px] w-[18px] text-primary" />
                </div>
                <span className="text-[13px] font-medium text-muted-foreground">
                  {t('dashboard.totalSpending')}
                </span>
              </div>
              <p className="text-2xl font-semibold text-foreground tabular-nums tracking-tight">
                {formatCurrency(totalCost)}
              </p>
              {renderTrend()}
              <p className="text-xs text-muted-foreground mt-1">
                {totalCount > 0
                  ? t('dashboard.entries', { count: totalCount })
                  : t('dashboard.noEntries')}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {statsSections.map((section, idx) => {
          const ctxSection = sectionLookup[section.name];
          const iconName = ctxSection?.icon;
          const Icon = (iconName && ICON_MAP[iconName]) || HiOutlineSquares2X2;
          const colors = SECTION_COLORS[idx % SECTION_COLORS.length];
          return (
            <motion.div key={section.id} variants={fadeUp} whileHover={cardHover}>
              <Card className="h-full hover:border-border/60 transition-colors duration-200">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`h-9 w-9 rounded-lg ${colors.bgClass} flex items-center justify-center`}>
                        <Icon className={`h-[18px] w-[18px] ${colors.colorClass}`} />
                      </div>
                      <span className="text-[13px] font-medium text-muted-foreground">
                        {getSectionDisplayName(section, t)}
                      </span>
                    </div>
                    <Link
                      to={`/statistics/${section.id}`}
                      aria-label={`View ${getSectionDisplayName(section, t)} statistics`}
                      className="rounded-md p-1 hover:ring-1 hover:ring-primary/40 active:opacity-80 transition-all cursor-pointer"
                    >
                      <Sparkline data={sparklineDataBySection[section.name] || []} />
                    </Link>
                  </div>
                  <p className="text-2xl font-semibold text-foreground tabular-nums tracking-tight">
                    {displayMode === 'cost'
                      ? formatCurrency(section.total_cost)
                      : `${Number(section.total_usage || 0).toLocaleString()} ${ctxSection?.unit || ''}`}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {section.entry_count > 0
                      ? t('dashboard.entries', { count: section.entry_count })
                      : t('dashboard.noEntries')}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <motion.div variants={fadeUp}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-foreground">
            {t('dashboard.recentEntries')}
          </h2>
          {recentEntries.length > 0 && (
            <Link to="/entries">
              <Button variant="ghost" size="sm" className="text-muted-foreground text-xs">
                {t('dashboard.viewAll')}
              </Button>
            </Link>
          )}
        </div>

        {recentEntries.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center py-8 space-y-4">
                <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
                  <HiOutlinePlusCircle className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground max-w-xs">
                  {t('dashboard.noRecentEntries')}
                </p>
                <Link to="/add-entry">
                  <Button size="lg">{t('dashboard.addFirst')}</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-border/30">
                {recentEntries.map((entry) => {
                  const ctxSection = sectionLookup[entry.section_name];
                  const iconName = ctxSection?.icon;
                  const Icon = (iconName && ICON_MAP[iconName]) || HiOutlineSquares2X2;
                  const sectionIdx = contextSections.findIndex((s) => s.name === entry.section_name);
                  const colors = SECTION_COLORS[(sectionIdx >= 0 ? sectionIdx : 0) % SECTION_COLORS.length];
                  return (
                    <div
                      key={entry.id}
                      className="flex items-center gap-3 min-h-[52px] py-3 px-4 sm:px-5 active:bg-accent/40 sm:hover:bg-accent/40 transition-colors duration-150"
                    >
                      <div className={`h-8 w-8 rounded-lg ${colors.bgClass} flex items-center justify-center shrink-0`}>
                        <Icon className={`h-4 w-4 ${colors.colorClass}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] px-1.5">
                            {entry.section_name}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(entry.date)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {t('dashboard.usage')}: {Number(entry.usage_amount).toLocaleString()} {entry.unit}
                        </p>
                      </div>
                      <p className="text-sm font-medium text-foreground tabular-nums whitespace-nowrap">
                        {formatCurrency(entry.cost_amount)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </motion.div>
  );
}
