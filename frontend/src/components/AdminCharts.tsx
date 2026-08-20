'use client';

import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

// ─── Custom Tooltip Component ────────────────────────────────────────────────
interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  valueFormatter?: (value: number) => string;
  unit?: string;
}

export function ChartCustomTooltip({
  active,
  payload,
  label,
  valueFormatter,
  unit = '',
}: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-light-border dark:border-slate-800 p-3 rounded-xl shadow-xl backdrop-blur-md text-xs space-y-1 z-50">
        {label && <p className="font-bold text-light-text dark:text-white border-b border-light-border dark:border-slate-800 pb-1">{label}</p>}
        {payload.map((entry: any, index: number) => {
          const val = valueFormatter ? valueFormatter(entry.value) : `${entry.value}${unit ? ` ${unit}` : ''}`;
          return (
            <div key={`item-${index}`} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color || entry.fill }} />
              <span className="text-light-text dark:text-dark-muted">{entry.name}:</span>
              <span className="font-mono font-bold text-light-text dark:text-white">{val}</span>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
}

// ─── 1. Responsive Donut Breakdown Chart ──────────────────────────────────────
export interface DonutItem {
  name: string;
  value: number;
  color: string;
  [key: string]: any;
}

interface ResponsiveDonutChartProps {
  title: string;
  subtitle?: string;
  data: DonutItem[];
  totalLabel?: string;
  height?: number;
}

export function ResponsiveDonutChart({
  title,
  subtitle,
  data,
  totalLabel = 'Total',
  height = 240,
}: ResponsiveDonutChartProps) {
  const total = data.reduce((sum, item) => sum + (item.value || 0), 0);

  return (
    <div className="bg-white/80 dark:bg-dark-card/70 border border-light-border dark:border-dark-border rounded-2xl p-5 sm:p-6 shadow-sm space-y-4 flex flex-col justify-between">
      <div>
        <h4 className="text-sm font-bold text-light-text dark:text-white">{title}</h4>
        {subtitle && <p className="text-xs text-light-text dark:text-dark-muted mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 my-auto">
        {/* Recharts Pie */}
        <div className="w-full sm:w-1/2 relative flex items-center justify-center" style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip
                content={<ChartCustomTooltip valueFormatter={(val) => `${val} (${total > 0 ? Math.round((val / total) * 100) : 0}%)`} />}
              />
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius="58%"
                outerRadius="82%"
                paddingAngle={data.length > 1 ? 3 : 0}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          {/* Center text counter */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-extrabold text-light-text dark:text-white font-mono">{total}</span>
            <span className="text-[10px] uppercase font-bold text-light-text dark:text-dark-muted tracking-wider">{totalLabel}</span>
          </div>
        </div>

        {/* Legend Breakdown */}
        <div className="w-full sm:w-1/2 space-y-2">
          {data.map((item) => {
            const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
            return (
              <div
                key={item.name}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-50/60 dark:bg-slate-900/40 border border-light-border/60 dark:border-dark-border/60 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-light-text dark:text-slate-200 font-medium truncate">{item.name}</span>
                </div>
                <div className="flex items-center gap-1.5 font-mono shrink-0">
                  <span className="font-bold text-light-text dark:text-white">{item.value}</span>
                  <span className="text-[10px] text-light-text dark:text-dark-muted">({pct}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── 2. Responsive Multi-Bar Comparison Chart ────────────────────────────────
export interface BarGroupItem {
  category: string;
  [key: string]: any;
}

interface ResponsiveBarAnalyticsChartProps {
  title: string;
  subtitle?: string;
  data: BarGroupItem[];
  bars: Array<{ key: string; name: string; color: string }>;
  height?: number;
}

export function ResponsiveBarAnalyticsChart({
  title,
  subtitle,
  data,
  bars,
  height = 250,
}: ResponsiveBarAnalyticsChartProps) {
  return (
    <div className="bg-white/80 dark:bg-dark-card/70 border border-light-border dark:border-dark-border rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h4 className="text-sm font-bold text-light-text dark:text-white">{title}</h4>
          {subtitle && <p className="text-xs text-light-text dark:text-dark-muted mt-0.5">{subtitle}</p>}
        </div>

        {/* Legend pills */}
        <div className="flex flex-wrap items-center gap-3">
          {bars.map((b) => (
            <div key={b.key} className="flex items-center gap-1.5 text-xs">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: b.color }} />
              <span className="text-light-text dark:text-dark-muted font-medium">{b.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ height, width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
            <XAxis
              dataKey="category"
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<ChartCustomTooltip />} />
            {bars.map((bar) => (
              <Bar
                key={bar.key}
                dataKey={bar.key}
                name={bar.name}
                fill={bar.color}
                radius={[5, 5, 0, 0]}
                maxBarSize={40}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── 3. Responsive Horizontal Priority / Ranking Bar Chart ────────────────────
export interface HorizontalRankingItem {
  label: string;
  value: number;
  secondaryValue?: number;
  color?: string;
  formattedScore?: string;
}

interface ResponsiveHorizontalBarChartProps {
  title: string;
  subtitle?: string;
  data: HorizontalRankingItem[];
  valueLabel?: string;
  height?: number;
}

export function ResponsiveHorizontalBarChart({
  title,
  subtitle,
  data,
  valueLabel = 'Score',
  height = 240,
}: ResponsiveHorizontalBarChartProps) {
  const chartData = data.map((d, i) => ({
    name: d.label,
    value: d.value,
    color: d.color || (i === 0 ? '#159447' : i === 1 ? '#D9A62E' : i === 2 ? '#1FA95A' : '#08752F'),
    formattedScore: d.formattedScore || `${Math.round(d.value)}%`,
  }));

  return (
    <div className="bg-white/80 dark:bg-dark-card/70 border border-light-border dark:border-dark-border rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
      <div>
        <h4 className="text-sm font-bold text-light-text dark:text-white">{title}</h4>
        {subtitle && <p className="text-xs text-light-text dark:text-dark-muted mt-0.5">{subtitle}</p>}
      </div>

      <div style={{ height: Math.max(height, chartData.length * 40), width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={chartData}
            margin={{ top: 5, right: 35, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.15} horizontal={false} />
            <XAxis type="number" hide domain={[0, 'auto']} />
            <YAxis
              type="category"
              dataKey="name"
              width={140}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={<ChartCustomTooltip valueFormatter={(val) => `${val} ${valueLabel}`} />}
            />
            <Bar
              dataKey="value"
              name={valueLabel}
              radius={[0, 6, 6, 0]}
              barSize={18}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
