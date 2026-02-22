import { useTranslation } from 'react-i18next';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';

const TYPE_COLORS = {
  electricity: '#f59e0b',
  water: '#0ea5e9',
  fuel: '#f97316',
};

const MUTED = 'hsl(var(--muted-foreground))';
const BORDER = 'hsl(var(--border))';

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { translatedName, total_cost, entry_count, avg_cost } = payload[0].payload;
  return (
    <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-md space-y-1">
      <p className="text-xs font-medium text-foreground">{translatedName}</p>
      <p className="text-sm font-semibold text-foreground tabular-nums">
        {Number(total_cost).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </p>
      <p className="text-xs text-muted-foreground tabular-nums">
        {entry_count} entries &middot; avg{' '}
        {Number(avg_cost).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </p>
    </div>
  );
}

export default function CategoryBarChart({ data }) {
  const { t } = useTranslation();

  if (!data || data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        {t('statistics.noCategoryData')}
      </p>
    );
  }

  const chartData = data.map((item) => ({
    ...item,
    translatedName: t(`statistics.${item.type}`),
  }));

  return (
    <div className="w-full h-[260px] sm:h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={BORDER}
            vertical={false}
          />
          <XAxis
            dataKey="translatedName"
            tick={{ fontSize: 12, fill: MUTED }}
            tickLine={false}
            axisLine={false}
            dy={8}
          />
          <YAxis
            tick={{ fontSize: 11, fill: MUTED }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => v.toLocaleString()}
            width={50}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted) / 0.3)' }} />
          <Bar dataKey="total_cost" radius={[6, 6, 0, 0]} maxBarSize={64}>
            {chartData.map((entry) => (
              <Cell
                key={entry.type}
                fill={TYPE_COLORS[entry.type] || '#6b7280'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
