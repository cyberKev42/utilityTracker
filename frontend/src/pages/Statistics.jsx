import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getStats } from '../services/entriesService';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { motion } from 'framer-motion';
import {
  HiExclamationCircle,
  HiOutlineChartBar,
  HiOutlinePlusCircle,
  HiOutlineBolt,
  HiOutlineBeaker,
  HiOutlineFire,
} from 'react-icons/hi2';
import SpendingLineChart from '../components/charts/SpendingLineChart';
import CategoryBarChart from '../components/charts/CategoryBarChart';
import DistributionPieChart from '../components/charts/DistributionPieChart';

const TYPE_CONFIG = {
  electricity: { icon: HiOutlineBolt, colorClass: 'text-amber-500', bgClass: 'bg-amber-500/10' },
  water: { icon: HiOutlineBeaker, colorClass: 'text-sky-500', bgClass: 'bg-sky-500/10' },
  fuel: { icon: HiOutlineFire, colorClass: 'text-orange-500', bgClass: 'bg-orange-500/10' },
};

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

export default function Statistics() {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const data = await getStats();
        setStats(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

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

  const isEmpty = !stats?.totals || stats.totals.entry_count === 0;

  if (isEmpty) {
    return (
      <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-6">
        <motion.div variants={fadeUp}>
          <h1 className="text-xl font-semibold text-foreground tracking-tight">{t('statistics.title')}</h1>
          <p className="text-[13px] text-muted-foreground mt-1">{t('statistics.description')}</p>
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

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-6">
      <motion.div variants={fadeUp}>
        <h1 className="text-xl font-semibold text-foreground tracking-tight">{t('statistics.title')}</h1>
        <p className="text-[13px] text-muted-foreground mt-1">{t('statistics.description')}</p>
      </motion.div>

      <div className="grid grid-cols-3 gap-3">
        {['electricity', 'water', 'fuel'].map((type) => {
          const config = TYPE_CONFIG[type];
          const Icon = config.icon;
          return (
            <motion.div key={type} variants={fadeUp} whileHover={cardHover}>
              <Link to={`/statistics/${type}`} className="block">
                <Card className="hover:border-border/60 transition-colors duration-200 cursor-pointer">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className={`h-9 w-9 rounded-lg ${config.bgClass} flex items-center justify-center shrink-0`}>
                      <Icon className={`h-[18px] w-[18px] ${config.colorClass}`} />
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {t(`statistics.${type}`)}
                    </span>
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
              <SpendingLineChart data={stats.monthly} />
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
              <CategoryBarChart data={stats.byType} />
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
              <DistributionPieChart data={stats.byType} />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
