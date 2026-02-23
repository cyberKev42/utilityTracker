import { useTranslation } from 'react-i18next';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
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
    <div className="bg-popover border border-border/60 rounded-lg px-3 py-2 shadow-lg">
      <p className="text-[11px] font-medium text-foreground">{name}</p>
      <p className="text-sm font-semibold text-foreground tabular-nums">
        {Number(value).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </p>
      <p className="text-[11px] text-muted-foreground tabular-nums">
        {(percent * 100).toFixed(1)}%
      </p>
    </div>
  );
}

function CustomLegend({ payload }) {
  return (
    <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 mt-3">
      {payload.map((entry) => (
        <div key={entry.value} className="flex items-center gap-2 min-h-[28px]">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs text-muted-foreground">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function DistributionPieChart({ data }) {
  const { t } = useTranslation();

  if (!data || data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        {t('statistics.noCategoryData')}
      </p>
    );
  }

  const total = data.reduce((sum, d) => sum + d.total_cost, 0);
  if (total === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
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
    <div className="w-full h-[260px] sm:h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="42%"
            innerRadius="40%"
            outerRadius="68%"
            paddingAngle={3}
            strokeWidth={0}
            animationDuration={600}
            animationEasing="ease-out"
          >
            {chartData.map((entry) => (
              <Cell
                key={entry.type}
                fill={TYPE_COLORS[entry.type] || '#6b7280'}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
