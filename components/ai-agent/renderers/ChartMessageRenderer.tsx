'use client';

import { Box, Typography } from '@mui/material';
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  type ChartOptions,
} from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';

import type { ChartMessageContent } from '../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
);

interface ChartMessageRendererProps {
  content: ChartMessageContent;
}

const BACKGROUND_COLORS = [
  'rgba(25, 118, 210, 0.65)',
  'rgba(46, 125, 50, 0.65)',
  'rgba(237, 108, 2, 0.65)',
  'rgba(156, 39, 176, 0.65)',
  'rgba(211, 47, 47, 0.65)',
  'rgba(0, 121, 107, 0.65)',
];

const BORDER_COLORS = [
  'rgb(25, 118, 210)',
  'rgb(46, 125, 50)',
  'rgb(237, 108, 2)',
  'rgb(156, 39, 176)',
  'rgb(211, 47, 47)',
  'rgb(0, 121, 107)',
];

function toNumber(value: string | number | undefined): number {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

export default function ChartMessageRenderer({
  content,
}: ChartMessageRendererProps) {
  const labels = content.data.map((item) =>
    String(item[content.xKey] ?? ''),
  );

  const barData = {
    labels,
    datasets: content.yKeys.map((key, index) => ({
      label: key,
      data: content.data.map((item) => toNumber(item[key])),
      backgroundColor:
        BACKGROUND_COLORS[index % BACKGROUND_COLORS.length],
      borderColor: BORDER_COLORS[index % BORDER_COLORS.length],
      borderWidth: 1,
    })),
  };

  const lineData = {
    labels,
    datasets: content.yKeys.map((key, index) => ({
      label: key,
      data: content.data.map((item) => toNumber(item[key])),
      backgroundColor:
        BACKGROUND_COLORS[index % BACKGROUND_COLORS.length],
      borderColor: BORDER_COLORS[index % BORDER_COLORS.length],
      borderWidth: 2,
      pointRadius: 3,
      tension: 0.35,
    })),
  };

  const pieKey = content.yKeys[0] ?? 'value';
  const pieData = {
    labels,
    datasets: [
      {
        label: pieKey,
        data: content.data.map((item) => toNumber(item[pieKey])),
        backgroundColor: labels.map(
          (_, index) =>
            BACKGROUND_COLORS[index % BACKGROUND_COLORS.length],
        ),
        borderColor: labels.map(
          (_, index) => BORDER_COLORS[index % BORDER_COLORS.length],
        ),
        borderWidth: 1,
      },
    ],
  };

  const barOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' },
      tooltip: { mode: 'index', intersect: false },
    },
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true },
    },
  };

  const lineOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { position: 'bottom' },
    },
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true },
    },
  };

  const pieOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' },
    },
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        {content.title}
      </Typography>

      <Box sx={{ position: 'relative', width: '100%', height: 320 }}>
        {content.chartType === 'bar' && (
          <Bar
            data={barData}
            options={barOptions}
            role="img"
            aria-label={content.title}
          />
        )}

        {content.chartType === 'line' && (
          <Line
            data={lineData}
            options={lineOptions}
            role="img"
            aria-label={content.title}
          />
        )}

        {content.chartType === 'pie' && (
          <Pie
            data={pieData}
            options={pieOptions}
            role="img"
            aria-label={content.title}
          />
        )}
      </Box>
    </Box>
  );
}
