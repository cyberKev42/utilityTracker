import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getStats } from '../services/entriesService';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
  HiExclamationCircle,
  HiOutlineChartBar,
  HiOutlinePlusCircle,
} from 'react-icons/hi2';
import SpendingLineChart from '../components/charts/SpendingLineChart';
import CategoryBarChart from '../components/charts/CategoryBarChart';
import DistributionPieChart from '../components/charts/DistributionPieChart';

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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-start gap-2 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
        <HiExclamationCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
        <p className="text-sm text-destructive">{t('dashboard.loadingError')}</p>
      </div>
    );
  }

  const isEmpty = !stats?.totals || stats.totals.entry_count === 0;

  if (isEmpty) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('statistics.title')}</h1>
          <p className="text-muted-foreground mt-1">{t('statistics.description')}</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center py-10 space-y-4">
              <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
                <HiOutlineChartBar className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground max-w-xs">
                {t('statistics.noData')}
              </p>
              <Link to="/add-entry">
                <Button className="h-11 px-6">{t('statistics.addEntries')}</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('statistics.title')}</h1>
        <p className="text-muted-foreground mt-1">{t('statistics.description')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card className="lg:col-span-2">
          <CardContent className="pt-5 px-3 sm:px-6">
            <h2 className="text-base font-semibold text-foreground mb-1">
              {t('statistics.spendingOverTime')}
            </h2>
            <p className="text-xs text-muted-foreground mb-4">
              {t('statistics.spendingOverTimeDesc')}
            </p>
            <SpendingLineChart data={stats.monthly} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 px-3 sm:px-6">
            <h2 className="text-base font-semibold text-foreground mb-1">
              {t('statistics.spendingByCategory')}
            </h2>
            <p className="text-xs text-muted-foreground mb-4">
              {t('statistics.spendingByCategoryDesc')}
            </p>
            <CategoryBarChart data={stats.byType} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 px-3 sm:px-6">
            <h2 className="text-base font-semibold text-foreground mb-1">
              {t('statistics.costDistribution')}
            </h2>
            <p className="text-xs text-muted-foreground mb-4">
              {t('statistics.costDistributionDesc')}
            </p>
            <DistributionPieChart data={stats.byType} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
