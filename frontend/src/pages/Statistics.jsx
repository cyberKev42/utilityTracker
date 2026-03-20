import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEntriesData } from '../hooks/useEntriesData';
import { useSections } from '../hooks/useSections';
import { useCurrency } from '../hooks/useCurrency';
import { ICON_MAP } from '../components/settings/IconPickerGrid';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { motion } from 'framer-motion';
import {
  HiExclamationCircle,
  HiOutlineChartBar,
  HiOutlinePlusCircle,
  HiOutlineSquares2X2,
} from 'react-icons/hi2';
import SpendingLineChart from '../components/charts/SpendingLineChart';
import CategoryBarChart from '../components/charts/CategoryBarChart';
import DistributionPieChart from '../components/charts/DistributionPieChart';

const SECTION_COLORS = [
  { colorClass: 'text-amber-500', bgClass: 'bg-amber-500/10' },
  { colorClass: 'text-sky-500', bgClass: 'bg-sky-500/10' },
  { colorClass: 'text-orange-500', bgClass: 'bg-orange-500/10' },
  { colorClass: 'text-emerald-500', bgClass: 'bg-emerald-500/10' },
  { colorClass: 'text-violet-500', bgClass: 'bg-violet-500/10' },
  { colorClass: 'text-rose-500', bgClass: 'bg-rose-500/10' },
];

const stagger = {
  animate: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.25, 0.1, 0.25, 1] } },
};

const cardHover = {
  y: -2,
  transition: { duration: 0.15, ease: 'easeOut' },
};

function deriveMonthlyData(entries, mode) {
  const field = mode === 'usage' ? 'usage_amount' : 'cost_amount';
  const byMonth = {};
  for (const entry of entries) {
    const d = new Date(entry.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!byMonth[key]) byMonth[key] = { month: key, total_cost: 0 };
    byMonth[key].total_cost += Number(entry[field]) || 0;
  }
  return Object.values(byMonth).sort((a, b) => a.month.localeCompare(b.month));
}

function deriveWeeklyData(entries, mode) {
  const field = mode === 'usage' ? 'usage_amount' : 'cost_amount';
  const byWeek = {};
  for (const entry of entries) {
    const d = new Date(entry.date);
    const day = d.getDay() || 7;
    const monday = new Date(d);
    monday.setDate(d.getDate() - day + 1);
    const key = monday.toISOString().slice(0, 10);
    if (!byWeek[key]) byWeek[key] = { month: key, total_cost: 0 };
    byWeek[key].total_cost += Number(entry[field]) || 0;
  }
  return Object.values(byWeek).sort((a, b) => a.month.localeCompare(b.month));
}

function deriveDailyData(entries, mode) {
  const field = mode === 'usage' ? 'usage_amount' : 'cost_amount';
  const byDay = {};
  for (const entry of entries) {
    const key = entry.date?.slice(0, 10);
    if (!key) continue;
    if (!byDay[key]) byDay[key] = { month: key, total_cost: 0 };
    byDay[key].total_cost += Number(entry[field]) || 0;
  }
  return Object.values(byDay).sort((a, b) => a.month.localeCompare(b.month));
}

export default function Statistics() {
  const { t } = useTranslation();
  const { sections: contextSections } = useSections();
  const { formatCurrency } = useCurrency();
  const { stats, entries: rawEntries, loading, error } = useEntriesData();
  const [viewMode, setViewMode] = useState('usage');
  const [granularity, setGranularity] = useState('weekly');

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-6 w-32 bg-card animate-pulse rounded" />
          <div className="h-4 w-48 bg-card animate-pulse rounded mt-2" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card animate-pulse rounded-lg h-[72px]" />
          <div className="bg-card animate-pulse rounded-lg h-[72px]" />
          <div className="bg-card animate-pulse rounded-lg h-[72px]" />
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

  const statsSections = stats?.sections ?? [];
  const totalEntries = statsSections.reduce((sum, s) => sum + (s.entry_count || 0), 0);
  const isEmpty = totalEntries === 0;

  if (isEmpty) {
    return (
      <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-6">
        <motion.div variants={fadeUp}>
          <h1 className="text-xl font-semibold text-foreground tracking-tight">{t('statistics.title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('statistics.description')}</p>
        </motion.div>
        <motion.div variants={fadeUp}>
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center py-8 space-y-4">
                <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
                  <HiOutlineChartBar className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground max-w-xs">
                  {t('statistics.noData')}
                </p>
                <Link to="/add-entry">
                  <Button size="lg">{t('statistics.addEntries')}</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    );
  }

  // Build section lookup for icons and units
  const sectionLookup = {};
  for (const s of contextSections) {
    sectionLookup[s.name] = s;
  }

  // Derive chart data based on granularity and viewMode
  const chartData = granularity === 'monthly'
    ? deriveMonthlyData(rawEntries, viewMode)
    : granularity === 'weekly'
      ? deriveWeeklyData(rawEntries, viewMode)
      : deriveDailyData(rawEntries, viewMode);

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-6">
      <motion.div variants={fadeUp}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground tracking-tight">{t('statistics.title')}</h1>
            <p className="text-sm text-muted-foreground mt-1">{t('statistics.description')}</p>
          </div>
          <div className="flex rounded-lg border border-border/40 overflow-hidden text-xs font-medium">
            {[{ value: 'usage', label: t('statistics.usage') }, { value: 'cost', label: t('statistics.cost') }].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setViewMode(value)}
                className={`px-3 py-1.5 transition-colors ${viewMode === value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-3 gap-3">
        {statsSections.map((section, idx) => {
          const ctxSection = sectionLookup[section.name];
          const iconName = ctxSection?.icon;
          const Icon = (iconName && ICON_MAP[iconName]) || HiOutlineSquares2X2;
          const colors = SECTION_COLORS[idx % SECTION_COLORS.length];
          return (
            <motion.div key={section.id} variants={fadeUp} whileHover={cardHover}>
              <Link to={`/statistics/${section.id}`} className="block">
                <Card className="hover:border-border/60 transition-colors duration-200 cursor-pointer">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className={`h-9 w-9 rounded-lg ${colors.bgClass} flex items-center justify-center shrink-0`}>
                      <Icon className={`h-[18px] w-[18px] ${colors.colorClass}`} />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-foreground">
                        {section.name}
                      </span>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {viewMode === 'usage'
                          ? `${Number(section.total_usage || 0).toLocaleString()} ${ctxSection?.unit || ''}`
                          : formatCurrency(Number(section.total_cost || 0))
                        }
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <motion.div variants={fadeUp} whileHover={cardHover} className="lg:col-span-2">
          <Card>
            <CardContent className="p-5 px-3 sm:px-5">
              <h2 className="text-sm font-semibold text-foreground mb-0.5">
                {t('statistics.spendingOverTime')}
              </h2>
              <p className="text-xs text-muted-foreground mb-4">
                {t('statistics.spendingOverTimeDesc')}
              </p>
              <SpendingLineChart
                data={chartData}
                granularity={granularity}
                onGranularityChange={setGranularity}
                viewMode={viewMode}
              />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp} whileHover={cardHover}>
          <Card>
            <CardContent className="p-5 px-3 sm:px-5">
              <h2 className="text-sm font-semibold text-foreground mb-0.5">
                {t('statistics.spendingByCategory')}
              </h2>
              <p className="text-xs text-muted-foreground mb-4">
                {t('statistics.spendingByCategoryDesc')}
              </p>
              <CategoryBarChart data={statsSections} />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp} whileHover={cardHover}>
          <Card>
            <CardContent className="p-5 px-3 sm:px-5">
              <h2 className="text-sm font-semibold text-foreground mb-0.5">
                {t('statistics.costDistribution')}
              </h2>
              <p className="text-xs text-muted-foreground mb-4">
                {t('statistics.costDistributionDesc')}
              </p>
              <DistributionPieChart data={statsSections} />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
