import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getEntries } from '../services/entriesService';
import { useCurrency } from '../hooks/useCurrency';
import { useSections } from '../hooks/useSections';
import { ICON_MAP } from '../components/settings/IconPickerGrid';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import {
  HiExclamationCircle,
  HiOutlineChartBar,
  HiOutlineArrowLeft,
  HiOutlineSquares2X2,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
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

const SECTION_COLORS = [
  '#f59e0b', '#0ea5e9', '#f97316', '#10b981', '#8b5cf6', '#f43f5e',
];

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

function formatMonth(monthStr) {
  const [year, month] = monthStr.split('-');
  const date = new Date(Number(year), Number(month) - 1);
  return date.toLocaleDateString(undefined, { month: 'short' });
}

function formatDay(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

function MonthlyTooltip({ active, payload, label, formatCurrency, viewMode }) {
  if (!active || !payload?.length) return null;
  const [year, month] = label.split('-');
  const date = new Date(Number(year), Number(month) - 1);
  const formatted = date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const total = payload.reduce((sum, p) => sum + (Number(p.value) || 0), 0);
  const displayValue = viewMode === 'usage'
    ? total.toLocaleString()
    : formatCurrency(total);
  return (
    <div className="bg-card border border-border/50 rounded-lg px-3.5 py-2.5 shadow-xl backdrop-blur-sm">
      <p className="text-sm text-muted-foreground mb-1">{formatted}</p>
      <p className="text-base font-semibold text-foreground tabular-nums tracking-tight">
        {displayValue}
      </p>
    </div>
  );
}

function DailyTooltip({ active, payload, label, formatCurrency, viewMode }) {
  if (!active || !payload?.length) return null;
  const formatted = new Date(label).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
  });
  const total = payload.reduce((sum, p) => sum + (Number(p.value) || 0), 0);
  const displayValue = viewMode === 'usage'
    ? total.toLocaleString()
    : formatCurrency(total);
  return (
    <div className="bg-card border border-border/50 rounded-lg px-3.5 py-2.5 shadow-xl backdrop-blur-sm">
      <p className="text-sm text-muted-foreground mb-1">{formatted}</p>
      <p className="text-base font-semibold text-foreground tabular-nums tracking-tight">
        {displayValue}
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

function deriveMonthly(entries, mode) {
  const byMonth = {};
  for (const e of entries) {
    const d = new Date(e.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!byMonth[key]) byMonth[key] = { month: key, total: 0 };
    byMonth[key].total += Number(mode === 'usage' ? e.usage_amount : e.cost_amount) || 0;
  }
  return Object.values(byMonth).sort((a, b) => a.month.localeCompare(b.month));
}

function deriveDaily(entries, year, month, mode) {
  const byDay = {};
  for (const e of entries) {
    const d = new Date(e.date);
    if (d.getFullYear() !== year || d.getMonth() + 1 !== month) continue;
    const key = e.date.slice(0, 10);
    if (!byDay[key]) byDay[key] = { date: key, total: 0 };
    byDay[key].total += Number(mode === 'usage' ? e.usage_amount : e.cost_amount) || 0;
  }
  return Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date));
}

function deriveStackedMonthly(entries, meters, mode) {
  const field = mode === 'usage' ? 'usage_amount' : 'cost_amount';
  const byMonth = {};
  for (const e of entries) {
    const d = new Date(e.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!byMonth[key]) {
      byMonth[key] = { month: key };
      meters.forEach(m => { byMonth[key][m.id] = 0; });
    }
    if (byMonth[key][e.meter_id] !== undefined) {
      byMonth[key][e.meter_id] += Number(e[field]) || 0;
    }
  }
  return Object.values(byMonth).sort((a, b) => a.month.localeCompare(b.month));
}

function deriveStackedDaily(entries, meters, year, month, mode) {
  const field = mode === 'usage' ? 'usage_amount' : 'cost_amount';
  const byDay = {};
  for (const e of entries) {
    const d = new Date(e.date);
    if (d.getFullYear() !== year || d.getMonth() + 1 !== month) continue;
    const key = e.date.slice(0, 10);
    if (!byDay[key]) {
      byDay[key] = { date: key };
      meters.forEach(m => { byDay[key][m.id] = 0; });
    }
    if (byDay[key][e.meter_id] !== undefined) {
      byDay[key][e.meter_id] += Number(e[field]) || 0;
    }
  }
  return Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date));
}

export default function StatisticsDetail() {
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();
  const { sectionId } = useParams();
  const { sections, getSectionById } = useSections();

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [viewMode, setViewMode] = useState('usage'); // 'usage' | 'cost'
  const [activeMeter, setActiveMeter] = useState('all'); // 'all' | meter.id
  const [year, setYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const section = getSectionById(sectionId);
  const sectionIdx = sections.findIndex((s) => s.id === sectionId);
  const color = SECTION_COLORS[(sectionIdx >= 0 ? sectionIdx : 0) % SECTION_COLORS.length];
  const iconName = section?.icon;
  const Icon = (iconName && ICON_MAP[iconName]) || HiOutlineSquares2X2;

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');
      try {
        const data = await getEntries({ section_id: sectionId, year, limit: 500 });
        setEntries(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [sectionId, year]);

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
        <p className="text-sm text-destructive">{t('statisticsDetail.errorLoad')}</p>
      </motion.div>
    );
  }

  // Client-side meter filtering
  const filteredEntries = activeMeter === 'all'
    ? entries
    : entries.filter(e => e.meter_id === activeMeter);

  const meters = section?.meters || [];
  const isAllTab = activeMeter === 'all';
  const useStacked = isAllTab && meters.length > 1;

  // Derive chart data
  const monthly = useStacked
    ? deriveStackedMonthly(entries, meters, viewMode)
    : deriveMonthly(filteredEntries, viewMode);

  const daily = useStacked
    ? deriveStackedDaily(entries, meters, year, selectedMonth, viewMode)
    : deriveDaily(filteredEntries, year, selectedMonth, viewMode);

  const hasMonthly = monthly.length > 0;
  const hasDaily = daily.length > 0;
  const isEmpty = filteredEntries.length === 0;

  const sectionName = section?.name || t('statistics.unknownSection', 'Section');

  // Summary stats
  const totalUsage = filteredEntries.reduce((sum, e) => sum + (Number(e.usage_amount) || 0), 0);
  const totalCost = filteredEntries.reduce((sum, e) => sum + (Number(e.cost_amount) || 0), 0);
  const uniqueDays = new Set(filteredEntries.map(e => e.date?.slice(0, 10))).size;
  const avgPerDay = uniqueDays > 0
    ? (viewMode === 'usage' ? totalUsage / uniqueDays : totalCost / uniqueDays)
    : 0;

  // Y-axis label for usage mode
  const yAxisLabel = viewMode === 'usage' && section?.unit
    ? { value: section.unit, angle: -90, position: 'insideLeft', style: { fontSize: 14, fill: CHART_COLORS.muted }, dx: 12 }
    : undefined;

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-6">
      {/* Header row */}
      <motion.div variants={fadeUp}>
        <Link to="/statistics">
          <Button variant="ghost" size="sm" className="text-muted-foreground text-xs mb-2 -ml-2">
            <HiOutlineArrowLeft className="h-3.5 w-3.5 mr-1" />
            {t('statisticsDetail.back')}
          </Button>
        </Link>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + '1a' }}>
              <Icon className="h-5 w-5" style={{ color }} />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground tracking-tight">
                {sectionName}
              </h1>
              <p className="text-[13px] text-muted-foreground mt-0.5">
                {t('statisticsDetail.description', { year })}
              </p>
            </div>
          </div>
          {/* Year selector + Usage/Cost toggle */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setYear(y => y - 1)}
                className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <HiOutlineChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-medium tabular-nums w-12 text-center">{year}</span>
              <button
                onClick={() => setYear(y => y + 1)}
                disabled={year >= new Date().getFullYear()}
                className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30"
              >
                <HiOutlineChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className="flex rounded-lg border border-border/40 overflow-hidden text-xs font-medium">
              {[
                { value: 'usage', label: t('statistics.usage') },
                { value: 'cost', label: t('statistics.cost') },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setViewMode(value)}
                  className={cn(
                    'px-3 py-1.5 transition-colors',
                    viewMode === value
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Summary stat cards */}
      {!isEmpty && (
        <motion.div variants={fadeUp} className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-1">{t('statisticsDetail.totalUsage')}</p>
              <p className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">
                {totalUsage.toLocaleString()}
                {section?.unit && (
                  <span className="text-sm font-normal text-muted-foreground ml-1">{section.unit}</span>
                )}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-1">{t('statisticsDetail.totalCost')}</p>
              <p className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">
                {formatCurrency(totalCost)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-1">{t('statisticsDetail.dailyAvg')}</p>
              <p className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">
                {viewMode === 'usage' ? (
                  <>
                    {avgPerDay.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                    {section?.unit && (
                      <span className="text-sm font-normal text-muted-foreground ml-1">{section.unit}</span>
                    )}
                  </>
                ) : formatCurrency(avgPerDay)}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Meter tab bar */}
      {meters.length > 1 && (
        <motion.div variants={fadeUp}>
          <div className="flex gap-1 overflow-x-auto">
            {[{ id: 'all', name: t('statisticsDetail.allMeters') }, ...meters].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveMeter(tab.id)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors',
                  activeMeter === tab.id
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {tab.name}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {isEmpty ? (
        <motion.div variants={fadeUp}>
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center py-8 space-y-3" style={{ minHeight: 160 }}>
                <HiOutlineChartBar className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {activeMeter === 'all'
                      ? t('statisticsDetail.emptySection.heading')
                      : t('statisticsDetail.emptyMeter.heading')}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {activeMeter === 'all'
                      ? t('statisticsDetail.emptySection.body')
                      : t('statisticsDetail.emptyMeter.body')}
                  </p>
                </div>
                {activeMeter === 'all' && (
                  <Link to="/add-entry">
                    <Button size="lg">{t('statistics.addEntries')}</Button>
                  </Link>
                )}
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
                      <BarChart data={monthly} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                        <CartesianGrid
                          stroke={CHART_COLORS.grid}
                          strokeOpacity={0.6}
                          vertical={false}
                          horizontalCoordinatesGenerator={gridGenerator}
                        />
                        <XAxis
                          dataKey="month"
                          tickFormatter={formatMonth}
                          tick={{ fontSize: 14, fill: CHART_COLORS.muted }}
                          tickLine={false}
                          axisLine={false}
                          dy={10}
                          tickMargin={0}
                        />
                        <YAxis
                          tick={{ fontSize: 14, fill: CHART_COLORS.muted }}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(v) => v.toLocaleString()}
                          width={48}
                          tickCount={5}
                          label={yAxisLabel}
                        />
                        <Tooltip
                          content={<MonthlyTooltip formatCurrency={formatCurrency} viewMode={viewMode} />}
                          cursor={{ fill: 'hsl(0, 0%, 12%)', fillOpacity: 0.5, radius: 4 }}
                        />
                        {useStacked ? (
                          meters.map((m, idx) => (
                            <Bar
                              key={m.id}
                              dataKey={m.id}
                              name={m.name}
                              stackId="meters"
                              fill={SECTION_COLORS[idx % SECTION_COLORS.length]}
                              fillOpacity={0.85}
                              radius={idx === meters.length - 1 ? [6, 6, 0, 0] : [0, 0, 0, 0]}
                              maxBarSize={52}
                              animationDuration={800}
                              animationEasing="ease-out"
                            />
                          ))
                        ) : (
                          <Bar
                            dataKey="total"
                            fill={color}
                            fillOpacity={0.85}
                            radius={[6, 6, 0, 0]}
                            maxBarSize={52}
                            animationDuration={800}
                            animationEasing="ease-out"
                          />
                        )}
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
                      <AreaChart data={daily} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                        <defs>
                          {useStacked ? (
                            meters.map((m, idx) => (
                              <linearGradient key={m.id} id={`dailyGradient-${m.id}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={SECTION_COLORS[idx % SECTION_COLORS.length]} stopOpacity={0.3} />
                                <stop offset="100%" stopColor={SECTION_COLORS[idx % SECTION_COLORS.length]} stopOpacity={0} />
                              </linearGradient>
                            ))
                          ) : (
                            <linearGradient id={`dailyGradient-${sectionId}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={color} stopOpacity={0.15} />
                              <stop offset="100%" stopColor={color} stopOpacity={0} />
                            </linearGradient>
                          )}
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
                          tick={{ fontSize: 14, fill: CHART_COLORS.muted }}
                          tickLine={false}
                          axisLine={false}
                          dy={10}
                          interval="preserveStartEnd"
                          tickMargin={0}
                        />
                        <YAxis
                          tick={{ fontSize: 14, fill: CHART_COLORS.muted }}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(v) => v.toLocaleString()}
                          width={48}
                          tickCount={5}
                          label={yAxisLabel}
                        />
                        <Tooltip
                          content={<DailyTooltip formatCurrency={formatCurrency} viewMode={viewMode} />}
                          cursor={{
                            stroke: color,
                            strokeWidth: 1,
                            strokeOpacity: 0.3,
                            strokeDasharray: '4 4',
                          }}
                        />
                        {useStacked ? (
                          meters.map((m, idx) => (
                            <Area
                              key={m.id}
                              type="monotone"
                              dataKey={m.id}
                              name={m.name}
                              stackId="meters"
                              stroke={SECTION_COLORS[idx % SECTION_COLORS.length]}
                              strokeWidth={1.5}
                              fill={`url(#dailyGradient-${m.id})`}
                              fillOpacity={0.6}
                              dot={false}
                              animationDuration={800}
                              animationEasing="ease-out"
                            />
                          ))
                        ) : (
                          <Area
                            type="monotone"
                            dataKey="total"
                            stroke={color}
                            strokeWidth={2}
                            fill={`url(#dailyGradient-${sectionId})`}
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
                        )}
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
