'use client';

import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useTheme } from '@/app/providers';

const performanceData = [
  { name: 'Jan', SEO: 65, Performance: 72, NextJS: 68 },
  { name: 'Feb', SEO: 72, Performance: 78, NextJS: 75 },
  { name: 'Mar', SEO: 78, Performance: 82, NextJS: 80 },
  { name: 'Apr', SEO: 85, Performance: 87, NextJS: 86 },
  { name: 'May', SEO: 88, Performance: 91, NextJS: 89 },
  { name: 'Jun', SEO: 92, Performance: 94, NextJS: 93 },
];

const auditStatsData = [
  { name: 'SEO Issues', value: 35, color: '#3b82f6' },
  { name: 'Performance', value: 25, color: '#f97316' },
  { name: 'Best Practices', value: 20, color: '#8b5cf6' },
  { name: 'Optimized', value: 20, color: '#10b981' },
];

export default function AnalyticsSection() {
  const { isDarkMode } = useTheme();

  const chartGridStroke = isDarkMode ? '#374151' : '#e5e7eb';
  const chartAxisStroke = isDarkMode ? '#6b7280' : '#9ca3af';
  const chartTickFill = isDarkMode ? '#9ca3af' : '#4b5563';
  const chartTooltipBg = isDarkMode ? '#111827' : '#ffffff';
  const chartTooltipBorder = isDarkMode ? '#374151' : '#e5e7eb';
  const chartTooltipText = isDarkMode ? '#f9fafb' : '#111827';
  const chartLegendText = isDarkMode ? '#e5e7eb' : '#374151';

  return (
    <section
      id="charts"
      className="px-4 py-32 sm:px-6 lg:px-8 bg-linear-to-b from-white to-blue-50/30 dark:from-gray-950 dark:to-gray-900/50 relative overflow-hidden"
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-160 h-160 bg-indigo-100/20 dark:bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="mx-auto max-w-7xl relative">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Performance{' '}
            <span className="bg-linear-to-br from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Insights
            </span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Watch your scores improve over time with actionable recommendations
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-8">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
              Score Progression
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: chartTickFill }}
                  axisLine={{ stroke: chartAxisStroke }}
                  tickLine={{ stroke: chartAxisStroke }}
                />
                <YAxis
                  tick={{ fill: chartTickFill }}
                  axisLine={{ stroke: chartAxisStroke }}
                  tickLine={{ stroke: chartAxisStroke }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: chartTooltipBg,
                    border: `1px solid ${chartTooltipBorder}`,
                    borderRadius: '8px',
                    color: chartTooltipText,
                  }}
                  labelStyle={{ color: chartTooltipText }}
                  itemStyle={{ color: chartTooltipText }}
                />
                <Legend wrapperStyle={{ color: chartLegendText }} />
                <Line
                  type="monotone"
                  dataKey="SEO"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6' }}
                />
                <Line
                  type="monotone"
                  dataKey="Performance"
                  stroke="#f97316"
                  strokeWidth={2}
                  dot={{ fill: '#f97316' }}
                />
                <Line
                  type="monotone"
                  dataKey="NextJS"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={{ fill: '#8b5cf6' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-8">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
              Audit Breakdown
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={auditStatsData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ x, y, name, value, textAnchor }) => (
                    <text
                      x={x}
                      y={y}
                      textAnchor={textAnchor}
                      dominantBaseline="central"
                      fill={chartLegendText}
                      fontSize={12}
                    >
                      {`${name}: ${value}%`}
                    </text>
                  )}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {auditStatsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: chartTooltipBg,
                    border: `1px solid ${chartTooltipBorder}`,
                    borderRadius: '8px',
                    color: chartTooltipText,
                  }}
                  labelStyle={{ color: chartTooltipText }}
                  itemStyle={{ color: chartTooltipText }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
}
