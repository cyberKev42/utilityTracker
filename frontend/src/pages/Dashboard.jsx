import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getStats, getEntries } from '../services/entriesService';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { motion } from 'framer-motion';
import {
  HiOutlineBanknotes,
  HiOutlineBolt,
  HiOutlineBeaker,
  HiOutlineFire,
  HiExclamationCircle,
  HiOutlinePlusCircle,
} from 'react-icons/hi2';

const TYPE_CONFIG = {
  electricity: { icon: HiOutlineBolt, colorClass: 'text-amber-500', bgClass: 'bg-amber-500/10' },
  water: { icon: HiOutlineBeaker, colorClass: 'text-sky-500', bgClass: 'bg-sky-500/10' },
  fuel: { icon: HiOutlineFire, colorClass: 'text-orange-500', bgClass: 'bg-orange-500/10' },
};

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

export default function Dashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [recentEntries, setRecentEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [statsData, entriesData] = await Promise.all([
          getStats(),
          getEntries(),
        ]);
        setStats(statsData);
        setRecentEntries(entriesData.slice(0, 5));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const getStatByType = (type) => stats?.byType?.find((s) => s.type === type);
  const totalCost = stats?.totals?.total_cost || 0;
  const totalCount = stats?.totals?.entry_count || 0;

  if (loading) {
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
    <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-8">
      <motion.div variants={fadeUp}>
        <h1 className="text-xl font-semibold text-foreground tracking-tight">{t('dashboard.title')}</h1>
        <p className="text-[13px] text-muted-foreground mt-1">{t('dashboard.description')}</p>
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
              <p className="text-xs text-muted-foreground mt-1">
                {totalCount > 0
                  ? t('dashboard.entries', { count: totalCount })
                  : t('dashboard.noEntries')}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {['electricity', 'water', 'fuel'].map((type) => {
          const stat = getStatByType(type);
          const config = TYPE_CONFIG[type];
          const Icon = config.icon;
          return (
            <motion.div key={type} variants={fadeUp} whileHover={cardHover}>
              <Card className="h-full hover:border-border/60 transition-colors duration-200">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`h-9 w-9 rounded-lg ${config.bgClass} flex items-center justify-center`}>
                      <Icon className={`h-[18px] w-[18px] ${config.colorClass}`} />
                    </div>
                    <span className="text-[13px] font-medium text-muted-foreground">
                      {t(`dashboard.${type}`)}
                    </span>
                  </div>
                  <p className="text-2xl font-semibold text-foreground tabular-nums tracking-tight">
                    {formatCurrency(stat?.total_cost)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat
                      ? t('dashboard.entries', { count: stat.entry_count })
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
                  const config = TYPE_CONFIG[entry.type];
                  const Icon = config.icon;
                  return (
                    <div
                      key={entry.id}
                      className="flex items-center gap-3 min-h-[52px] py-3 px-4 sm:px-5 active:bg-accent/40 sm:hover:bg-accent/40 transition-colors duration-150"
                    >
                      <div className={`h-8 w-8 rounded-lg ${config.bgClass} flex items-center justify-center shrink-0`}>
                        <Icon className={`h-4 w-4 ${config.colorClass}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] px-1.5">
                            {t(`addEntry.types.${entry.type}`)}
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
