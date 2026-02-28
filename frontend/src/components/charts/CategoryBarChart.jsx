import { useTranslation } from 'react-i18next';
import { useCurrency } from '../../hooks/useCurrency';
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

const COLORS = {
  muted: 'hsl(0, 0%, 45%)',
  grid: 'hsl(0, 0%, 12%)',
};

function CustomTooltip({ active, payload, formatCurrency }) {
  if (!active || !payload?.length) return null;
  const { translatedName, total_cost, entry_count, avg_cost } = payload[0].payload;
  return (
    <div className="bg-card border border-border/50 rounded-lg px-3.5 py-2.5 shadow-xl backdrop-blur-sm">
      <p className="text-[11px] text-muted-foreground mb-1">{translatedName}</p>
      <p className="text-[15px] font-semibold text-foreground tabular-nums tracking-tight">
        {formatCurrency(total_cost)}
      </p>
      <p className="text-[11px] text-muted-foreground tabular-nums mt-1">
        {entry_count} entries &middot; avg {formatCurrency(avg_cost)}
      </p>
    </div>
  );
}

export default function CategoryBarChart({ data }) {
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();

  if (!data || data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-10">
        {t('statistics.noCategoryData')}
      </p>
    );
  }

  const chartData = data.map((item) => ({
    ...item,
    translatedName: t(`statistics.${item.type}`),
  }));

  return (
    <div className="w-full h-[220px] sm:h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barGap={12}>
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
            dataKey="translatedName"
            tick={{ fontSize: 11, fill: COLORS.muted }}
            tickLine={false}
            axisLine={false}
            dy={10}
            tickMargin={0}
          />
          <YAxis
            tick={{ fontSize: 11, fill: COLORS.muted }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => v.toLocaleString()}
            width={48}
            tickCount={5}
          />
          <Tooltip
            content={<CustomTooltip formatCurrency={formatCurrency} />}
            cursor={{
              fill: 'hsl(0, 0%, 12%)',
              fillOpacity: 0.5,
              radius: 4,
            }}
          />
          <Bar
            dataKey="total_cost"
            radius={[6, 6, 0, 0]}
            maxBarSize={52}
            animationDuration={800}
            animationEasing="ease-out"
          >
            {chartData.map((entry) => (
              <Cell
                key={entry.type}
                fill={TYPE_COLORS[entry.type] || '#6b7280'}
                fillOpacity={0.85}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
