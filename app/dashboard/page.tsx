'use client';

import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import CompanyBarChart from '@/components/dashboard/CompanyBarChart';
import { apiUrl } from '@/lib/api';
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

import {
  Chart as ChartJS,
  type ChartOptions,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
);

type Company = {
  id: string;
  name: string | null;
  level: string | null;
  country: string | null;
  city?: string | null;
  foundedYear?: number | null;
  annualRevenue?: number | null;
  employees?: number | null;
  profitEfficiency?: number | null;
};

function formatLargeNumber(value: number) {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 2,
  }).format(value);
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 2,
  }).format(value);
}

function calculateDashboardCards(companies: Company[]) {
  const companyCount = companies.length;

  const totalRevenue = companies.reduce(
    (sum, company) => sum + (company.annualRevenue ?? 0),
    0
  );

  const coveredCountries = new Set(
    companies
      .map((company) => company.country)
      .filter((country): country is string => Boolean(country))
  ).size;

  const totalEmployees = companies.reduce(
    (sum, company) => sum + (company.employees ?? 0),
    0
  );

  return {
    companyCount,
    totalRevenue,
    coveredCountries,
    totalEmployees,
  };
}

function calculateLevelDistribution(companies: Company[]) {
  const total = companies.length;
  const levelMap = new Map<string, number>();

  companies.forEach((company) => {
    const level = company.level || 'Unknown';
    levelMap.set(level, (levelMap.get(level) || 0) + 1);
  });

  return Array.from(levelMap.entries())
    .map(([level, count]) => ({
      level,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
    }))
    .sort((a, b) => a.level.localeCompare(b.level));
}

function calculateCumulativeCompaniesByYear(companies: Company[]) {
  const yearMap = new Map<number, number>();

  companies.forEach((company) => {
    if (!company.foundedYear) return;

    yearMap.set(
      company.foundedYear,
      (yearMap.get(company.foundedYear) || 0) + 1
    );
  });

  const sortedYears = Array.from(yearMap.keys()).sort((a, b) => a - b);

  let cumulative = 0;

  return sortedYears.map((year) => {
    cumulative += yearMap.get(year) || 0;

    return {
      year,
      cumulativeCompanies: cumulative,
    };
  });
}

function StatCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string;
  subtitle: string;
}) {
  return (
    <Card>
      <CardContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {title}
        </Typography>

        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          {value}
        </Typography>

        <Typography variant="caption" color="text.secondary">
          {subtitle}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    void fetch(apiUrl('/companies'), { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Cannot load dashboard data');
        }

        return Array.isArray(data) ? data : [];
      })
      .then((data) => {
        if (!controller.signal.aborted) {
          setCompanies(data);
        }
      })
      .catch((loadError: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Cannot connect to backend server',
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, []);

  const cards = useMemo(() => {
    return calculateDashboardCards(companies);
  }, [companies]);

  const levelDistribution = useMemo(() => {
    return calculateLevelDistribution(companies);
  }, [companies]);

  const cumulativeCompanies = useMemo(() => {
    return calculateCumulativeCompaniesByYear(companies);
  }, [companies]);

  const doughnutData = {
    labels: levelDistribution.map((item) => item.level),
    datasets: [
      {
        data: levelDistribution.map((item) => item.count),
        backgroundColor: ['#2563eb', '#f59e0b', '#10b981', '#94a3b8'],
        borderWidth: 1,
      },
    ],
  };

  const doughnutOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const item = levelDistribution[context.dataIndex];

            return `${item.level}: ${item.count} companies (${item.percentage.toFixed(
              1
            )}%)`;
          },
        },
      },
    },
  };

  const lineData = {
    labels: cumulativeCompanies.map((item) => item.year),
    datasets: [
      {
        label: 'Cumulative Companies',
        data: cumulativeCompanies.map((item) => item.cumulativeCompanies),
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.12)',
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.35,
        fill: true,
      },
    ],
  };

  const lineOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'bottom',
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            return `Total companies: ${context.parsed.y}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
      },
    },
  };

  return (
    <DashboardLayout>
      <Box>
        <Typography variant="h4" sx={{ mb: 1 }}>
          Dashboard
        </Typography>

        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Supply chain company data overview
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box
            sx={{
              minHeight: '50vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: '1fr 1fr',
                  lg: 'repeat(4, 1fr)',
                },
                gap: 2,
                mb: 3,
              }}
            >
              <StatCard
                title="Companies"
                value={formatLargeNumber(cards.companyCount)}
                subtitle="Total companies in network"
              />

              <StatCard
                title="Total Revenue"
                value={formatMoney(cards.totalRevenue)}
                subtitle="Sum of annual revenue"
              />

              <StatCard
                title="Covered Countries"
                value={formatLargeNumber(cards.coveredCountries)}
                subtitle="Unique country count"
              />

              <StatCard
                title="Employees"
                value={formatLargeNumber(cards.totalEmployees)}
                subtitle="Total employee count"
              />
            </Box>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  lg: '1fr 1.4fr',
                },
                gap: 3,
              }}
            >
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Supplier Level Distribution
                </Typography>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Share of companies by supplier level
                </Typography>

                <Box sx={{ height: 300 }}>
                  <Doughnut data={doughnutData} options={doughnutOptions} />
                </Box>

                <Table size="small" sx={{ mt: 3 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Level</TableCell>
                      <TableCell align="right">Companies</TableCell>
                      <TableCell align="right">Share</TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {levelDistribution.map((item) => (
                      <TableRow key={item.level}>
                        <TableCell>
                          <Chip label={item.level} size="small" />
                        </TableCell>

                        <TableCell align="right">{item.count}</TableCell>

                        <TableCell align="right">
                          {item.percentage.toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>

              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Network Growth by Founded Year
                </Typography>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Cumulative number of companies joining the supply chain network
                </Typography>

                <Box sx={{ height: 420 }}>
                  <Line data={lineData} options={lineOptions} />
                </Box>
              </Paper>
            </Box>

            <CompanyBarChart />
          </>
        )}
      </Box>
    </DashboardLayout>
  );
}

