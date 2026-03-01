'use client';

import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

interface CategoryChartProps {
  data: CategoryDistribution[];
}

const COLORS = [
  '#60a5fa', // blue
  '#34d399', // green
  '#f472b6', // pink
  '#fbbf24', // amber
  '#a78bfa', // violet
  '#fb923c', // orange
  '#22d3ee', // cyan
  '#f87171', // red
];

const CategoryChart = ({ data }: CategoryChartProps) => {
  if (!data || data.length === 0) {
    return (
      <p className='py-8 text-center text-sm text-customgreys-dirtyGrey'>
        No category data available yet.
      </p>
    );
  }

  return (
    <ResponsiveContainer width='100%' height={280}>
      <PieChart>
        <Pie
          data={data}
          cx='50%'
          cy='50%'
          innerRadius={60}
          outerRadius={100}
          paddingAngle={3}
          dataKey='value'
          nameKey='name'
          label={({ name, percent }) =>
            `${name ?? ''} (${((percent ?? 0) * 100).toFixed(0)}%)`
          }
          labelLine={{ stroke: '#9ca3af' }}
        >
          {data.map((_, index) => (
            <Cell
              key={`cell-${index}`}
              fill={COLORS[index % COLORS.length]}
              stroke='none'
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: '#1e1e2f',
            border: '1px solid #444',
            borderRadius: '8px',
            color: '#fff',
          }}
          formatter={(value, name) => [
            `${value ?? 0} course${(value ?? 0) !== 1 ? 's' : ''}`,
            name ?? '',
          ]}
        />
        <Legend
          wrapperStyle={{ color: '#9ca3af', fontSize: '12px' }}
          iconType='circle'
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default CategoryChart;
