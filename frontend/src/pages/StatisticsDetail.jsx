import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getBreakdown } from '../services/entriesService';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { motion } from 'framer-motion';
import {
  HiExclamationCircle,
  HiOutlineChartBar,
  HiOutlineArrowLeft,
} from 'react-icons/hi2';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

const TYPE_COLORS = {
  electricity: '#f59e0b',
  water: '#0ea5e9',
  fuel: '#f97316',
};

const CHART_COLORS = {
  muted: 'hsl(0, 0%, 45%)',
  grid: 'hsl(0, 0%, 12%)',
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

function formatCurrency(value) {
  return Number(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatMonth(monthStr) {
  const [year, month] = monthStr.split('-');
  const date = new Date(Number(year), Number(month) - 1);
  return date.toLocaleDateString(undefined, { month: 'short' });
}

function formatDay(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

function MonthlyTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const [year, month] = label.split('-');
  const date = new Date(Number(year), Number(month) - 1);
  const formatted = date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  return (
    <div className="bg-card border border-border/50 rounded-lg px-3.5 py-2.5 shadow-xl backdrop-blur-sm">
      <p className="text-[11px] text-muted-foreground mb-1">{formatted}</p>
      <p className="text-[15px] font-semibold text-foreground tabular-nums tracking-tight">
        {formatCurrency(payload[0].value)}
      </p>
    </div>
  );
}

function DailyTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const formatted = new Date(label).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
  });
  return (
    <div className="bg-card border border-border/50 rounded-lg px-3.5 py-2.5 shadow-xl backdrop-blur-sm">
      <p className="text-[11px] text-muted-foreground mb-1">{formatted}</p>
      <p className="text-[15px] font-semibold text-foreground tabular-nums tracking-tight">
        {formatCurrency(payload[0].value)}
      </p>
    </div>
  );
}

const gridGenerator = ({ yAxis }) => {
  const { domain, height, y } = yAxis;
  if (!domain || domain[0] === domain[1]) return [];
  const count = 4;
  return Array.from({ length: count }, (_, i) =>
    y + height - (height / count) * (i + 1)
  );
};

export default function StatisticsDetail() {
  const { t } = useTranslation();
  const { type } = useParams();

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [year] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const color = TYPE_COLORS[type] || '#6b7280';

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');
      try {
        const result = await getBreakdown(type, year, selectedMonth);
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [type, year, selectedMonth]);

  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(year, i);
    return {
      value: i + 1,
      label: d.toLocaleDateString(undefined, { month: 'long' }),
    };
  });

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
        <p className="text-sm text-destructive">{error}</p>
      </motion.div>
    );
  }

  const hasMonthly = data?.monthly?.length > 0;
  const hasDaily = data?.daily?.length > 0;
  const isEmpty = !hasMonthly && !hasDaily;

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-6">
      <motion.div variants={fadeUp}>
        <Link to="/statistics">
          <Button variant="ghost" size="sm" className="text-muted-foreground text-xs mb-2 -ml-2">
            <HiOutlineArrowLeft className="h-3.5 w-3.5 mr-1" />
            {t('statisticsDetail.back')}
          </Button>
        </Link>
        <h1 className="text-xl font-semibold text-foreground tracking-tight">
          {t(`statisticsDetail.title`, { type: t(`statistics.${type}`) })}
        </h1>
        <p className="text-[13px] text-muted-foreground mt-1">
          {t('statisticsDetail.description', { year })}
        </p>
      </motion.div>

      {isEmpty ? (
        <motion.div variants={fadeUp}>
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center py-8 space-y-4">
                <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
                  <HiOutlineChartBar className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground max-w-xs">
                  {t('statisticsDetail.noData')}
                </p>
                <Link to="/add-entry">
                  <Button size="lg">{t('statistics.addEntries')}</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <>
          {/* Monthly Overview */}
          <motion.div variants={fadeUp} whileHover={cardHover}>
            <Card>
              <CardContent className="p-5 px-3 sm:px-5">
                <h2 className="text-sm font-semibold text-foreground mb-0.5">
                  {t('statisticsDetail.monthlyOverview')}
                </h2>
                <p className="text-xs text-muted-foreground mb-4">
                  {t('statisticsDetail.monthlyOverviewDesc', { year })}
                </p>
                {hasMonthly ? (
                  <div className="w-full h-[220px] sm:h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.monthly} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                        <CartesianGrid
                          stroke={CHART_COLORS.grid}
                          strokeOpacity={0.6}
                          vertical={false}
                          horizontalCoordinatesGenerator={gridGenerator}
                        />
                        <XAxis
                          dataKey="month"
                          tickFormatter={formatMonth}
                          tick={{ fontSize: 11, fill: CHART_COLORS.muted }}
                          tickLine={false}
                          axisLine={false}
                          dy={10}
                          tickMargin={0}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: CHART_COLORS.muted }}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(v) => v.toLocaleString()}
                          width={48}
                          tickCount={5}
                        />
                        <Tooltip
                          content={<MonthlyTooltip />}
                          cursor={{ fill: 'hsl(0, 0%, 12%)', fillOpacity: 0.5, radius: 4 }}
                        />
                        <Bar
                          dataKey="total"
                          fill={color}
                          fillOpacity={0.85}
                          radius={[6, 6, 0, 0]}
                          maxBarSize={52}
                          animationDuration={800}
                          animationEasing="ease-out"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-10">
                    {t('statisticsDetail.noData')}
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Daily Breakdown */}
          <motion.div variants={fadeUp} whileHover={cardHover}>
            <Card>
              <CardContent className="p-5 px-3 sm:px-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-sm font-semibold text-foreground mb-0.5">
                      {t('statisticsDetail.dailyBreakdown')}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {t('statisticsDetail.dailyBreakdownDesc')}
                    </p>
                  </div>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="h-9 rounded-lg border border-border/40 bg-card px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
                  >
                    {months.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
                {hasDaily ? (
                  <div className="w-full h-[220px] sm:h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data.daily} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id={`dailyGradient-${type}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={color} stopOpacity={0.15} />
                            <stop offset="100%" stopColor={color} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          stroke={CHART_COLORS.grid}
                          strokeOpacity={0.6}
                          vertical={false}
                          horizontalCoordinatesGenerator={gridGenerator}
                        />
                        <XAxis
                          dataKey="date"
                          tickFormatter={formatDay}
                          tick={{ fontSize: 11, fill: CHART_COLORS.muted }}
                          tickLine={false}
                          axisLine={false}
                          dy={10}
                          interval="preserveStartEnd"
                          tickMargin={0}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: CHART_COLORS.muted }}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(v) => v.toLocaleString()}
                          width={48}
                          tickCount={5}
                        />
                        <Tooltip
                          content={<DailyTooltip />}
                          cursor={{
                            stroke: color,
                            strokeWidth: 1,
                            strokeOpacity: 0.3,
                            strokeDasharray: '4 4',
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="total"
                          stroke={color}
                          strokeWidth={2}
                          fill={`url(#dailyGradient-${type})`}
                          dot={false}
                          activeDot={{
                            r: 5,
                            strokeWidth: 2,
                            stroke: color,
                            fill: 'hsl(0, 0%, 3.5%)',
                          }}
                          animationDuration={800}
                          animationEasing="ease-out"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-10">
                    {t('statisticsDetail.noData')}
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </motion.div>
  );
}
