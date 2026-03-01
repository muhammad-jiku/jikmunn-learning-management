'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface EnrollmentChartProps {
  data: EnrollmentTrend[];
}

const EnrollmentChart = ({ data }: EnrollmentChartProps) => {
  if (!data || data.length === 0) {
    return (
      <p className='py-8 text-center text-sm text-customgreys-dirtyGrey'>
        No enrollment data available yet.
      </p>
    );
  }

  const formatted = data.map((item) => ({
    ...item,
    label: formatMonth(item.date),
  }));

  return (
    <ResponsiveContainer width='100%' height={280}>
      <AreaChart data={formatted}>
        <defs>
          <linearGradient id='enrollGradient' x1='0' y1='0' x2='0' y2='1'>
            <stop offset='5%' stopColor='#60a5fa' stopOpacity={0.3} />
            <stop offset='95%' stopColor='#60a5fa' stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray='3 3' stroke='#333' />
        <XAxis
          dataKey='label'
          tick={{ fill: '#9ca3af', fontSize: 12 }}
          axisLine={{ stroke: '#555' }}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fill: '#9ca3af', fontSize: 12 }}
          axisLine={{ stroke: '#555' }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1e1e2f',
            border: '1px solid #444',
            borderRadius: '8px',
            color: '#fff',
          }}
          labelStyle={{ color: '#9ca3af' }}
        />
        <Area
          type='monotone'
          dataKey='count'
          name='Enrollments'
          stroke='#60a5fa'
          fill='url(#enrollGradient)'
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

export default EnrollmentChart;
