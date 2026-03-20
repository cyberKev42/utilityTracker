import { useTranslation } from 'react-i18next';
import { useCurrency } from '../../hooks/useCurrency';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

const COLORS = {
  primary: 'hsl(217, 91%, 60%)',
  muted: 'hsl(0, 0%, 45%)',
  grid: 'hsl(0, 0%, 12%)',
};

function formatMonth(monthStr) {
  const [year, month] = monthStr.split('-');
  const date = new Date(Number(year), Number(month) - 1);
  return date.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
}

function formatTick(value, granularity) {
  if (granularity === 'monthly') {
    const [year, month] = value.split('-');
    return new Date(Number(year), Number(month) - 1).toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
  }
  // weekly and daily: YYYY-MM-DD
  const d = new Date(value);
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

function CustomTooltip({ active, payload, label, formatCurrency, viewMode, granularity, unit }) {
  if (!active || !payload?.length) return null;
  const value = payload[0].value;
  const formattedDate = granularity === 'monthly'
    ? formatMonth(label)
    : new Date(label).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  const displayValue = viewMode === 'cost'
    ? formatCurrency(value)
    : `${value.toLocaleString()}${unit ? ` ${unit}` : ''}`;
  return (
    <div className="bg-card border border-border/50 rounded-lg px-3.5 py-2.5 shadow-xl backdrop-blur-sm">
      <p className="text-sm text-muted-foreground mb-1">{formattedDate}</p>
      <p className="text-base font-semibold text-foreground tabular-nums tracking-tight">
        {displayValue}
      </p>
    </div>
  );
}

export default function SpendingLineChart({ data, granularity = 'weekly', onGranularityChange, viewMode = 'cost', unit }) {
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();

  if (!data || data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-10">
        {t('statistics.noMonthlyData')}
      </p>
    );
  }

  const sorted = [...data].sort((a, b) => a.month.localeCompare(b.month));

  return (
    <div>
      <div className="flex justify-end mb-3">
        <div className="flex rounded-lg border border-border/40 overflow-hidden text-xs font-medium">
          {[
            { value: 'daily', label: t('statistics.granularity.daily') },
            { value: 'weekly', label: t('statistics.granularity.weekly') },
            { value: 'monthly', label: t('statistics.granularity.monthly') },
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => onGranularityChange?.(value)}
              className={`px-3 py-1.5 transition-colors ${granularity === value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="w-full h-[220px] sm:h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={sorted} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLORS.primary} stopOpacity={0.15} />
                <stop offset="100%" stopColor={COLORS.primary} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              stroke={COLORS.grid}
              strokeOpacity={0.6}
              vertical={false}
              horizontalCoordinatesGenerator={({ yAxis }) => {
                const { domain, height, y } = yAxis;
                if (!domain || domain[0] === domain[1]) return [];
                const count = 4;
                return Array.from({ length: count }, (_, i) =>
                  y + height - (height / count) * (i + 1)
                );
              }}
            />
            <XAxis
              dataKey="month"
              tickFormatter={(v) => formatTick(v, granularity)}
              tick={{ fontSize: 14, fill: COLORS.muted }}
              tickLine={false}
              axisLine={false}
              dy={10}
              interval="preserveStartEnd"
              tickMargin={0}
            />
            <YAxis
              tick={{ fontSize: 14, fill: COLORS.muted }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => v.toLocaleString()}
              width={48}
              tickCount={5}
            />
            <Tooltip
              content={<CustomTooltip formatCurrency={formatCurrency} viewMode={viewMode} granularity={granularity} unit={unit} />}
              cursor={{
                stroke: COLORS.primary,
                strokeWidth: 1,
                strokeOpacity: 0.3,
                strokeDasharray: '4 4',
              }}
            />
            <Area
              type="monotone"
              dataKey="total_cost"
              stroke={COLORS.primary}
              strokeWidth={2}
              fill="url(#areaGradient)"
              dot={false}
              activeDot={{
                r: 5,
                strokeWidth: 2,
                stroke: COLORS.primary,
                fill: 'hsl(0, 0%, 3.5%)',
              }}
              animationDuration={800}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
