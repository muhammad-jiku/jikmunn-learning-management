'use client';

import { formatPrice } from '@/lib/utils';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface RevenueChartProps {
  data: RevenueTrend[];
}

const RevenueChart = ({ data }: RevenueChartProps) => {
  if (!data || data.length === 0) {
    return (
      <p className='py-8 text-center text-sm text-customgreys-dirtyGrey'>
        No revenue data available yet.
      </p>
    );
  }

  const formatted = data.map((item) => ({
    ...item,
    label: formatMonth(item.date),
    revenueDisplay: item.revenue / 100,
  }));

  return (
    <ResponsiveContainer width='100%' height={280}>
      <AreaChart data={formatted}>
        <defs>
          <linearGradient id='revenueGradient' x1='0' y1='0' x2='0' y2='1'>
            <stop offset='5%' stopColor='#34d399' stopOpacity={0.3} />
            <stop offset='95%' stopColor='#34d399' stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray='3 3' stroke='#333' />
        <XAxis
          dataKey='label'
          tick={{ fill: '#9ca3af', fontSize: 12 }}
          axisLine={{ stroke: '#555' }}
        />
        <YAxis
          tick={{ fill: '#9ca3af', fontSize: 12 }}
          axisLine={{ stroke: '#555' }}
          tickFormatter={(value: number) => `$${value}`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1e1e2f',
            border: '1px solid #444',
            borderRadius: '8px',
            color: '#fff',
          }}
          labelStyle={{ color: '#9ca3af' }}
          formatter={(value) => [
            formatPrice(Number(value ?? 0) * 100),
            'Revenue',
          ]}
        />
        <Area
          type='monotone'
          dataKey='revenueDisplay'
          name='Revenue'
          stroke='#34d399'
          fill='url(#revenueGradient)'
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

function formatMonth(dateStr: string): string {
  const [year, month] = dateStr.split('-');
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  return `${months[parseInt(month, 10) - 1]} ${year.slice(2)}`;
}

export default RevenueChart;
