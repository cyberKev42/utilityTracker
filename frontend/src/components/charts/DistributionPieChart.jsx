import { useTranslation } from 'react-i18next';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';

const TYPE_COLORS = {
  electricity: '#f59e0b',
  water: '#0ea5e9',
  fuel: '#f97316',
};

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { name, value, percent } = payload[0];
  return (
    <div className="bg-card border border-border/50 rounded-lg px-3.5 py-2.5 shadow-xl backdrop-blur-sm">
      <p className="text-[11px] text-muted-foreground mb-1">{name}</p>
      <p className="text-[15px] font-semibold text-foreground tabular-nums tracking-tight">
        {Number(value).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </p>
      <p className="text-[11px] text-muted-foreground tabular-nums mt-1">
        {(percent * 100).toFixed(1)}%
      </p>
    </div>
  );
}

export default function DistributionPieChart({ data }) {
  const { t } = useTranslation();

  if (!data || data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-10">
        {t('statistics.noCategoryData')}
      </p>
    );
  }

  const total = data.reduce((sum, d) => sum + d.total_cost, 0);
  if (total === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-10">
        {t('statistics.noCategoryData')}
      </p>
    );
  }

  const chartData = data
    .filter((item) => item.total_cost > 0)
    .map((item) => ({
      name: t(`statistics.${item.type}`),
      value: item.total_cost,
      type: item.type,
      percent: item.total_cost / total,
    }));

  return (
    <div className="w-full h-[220px] sm:h-[280px]">
      <div className="relative w-full h-[160px] sm:h-[210px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius="42%"
              outerRadius="72%"
              paddingAngle={3}
              strokeWidth={0}
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
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-[11px] text-muted-foreground">Total</p>
            <p className="text-base font-semibold text-foreground tabular-nums tracking-tight">
              {total.toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
            </p>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-x-5 gap-y-1.5 mt-2">
        {chartData.map((entry) => (
          <div key={entry.type} className="flex items-center gap-2">
            <span
              className="inline-block h-2 w-2 rounded-full shrink-0"
              style={{ backgroundColor: TYPE_COLORS[entry.type], opacity: 0.85 }}
            />
            <span className="text-[11px] text-muted-foreground">
              {entry.name}
            </span>
            <span className="text-[11px] font-medium text-foreground tabular-nums">
              {(entry.percent * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
