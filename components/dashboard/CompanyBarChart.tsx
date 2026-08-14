'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Paper,
  Select,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';

import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  type ChartOptions,
  Legend,
  LinearScale,
  Tooltip,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

import CompanyBubbleChart, {
  type CompanyHierarchyNode,
} from './CompanyBubbleChart';
import { apiUrl } from '@/lib/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
);

type Dimension = 'level' | 'country' | 'city';

type Company = {
  id: string;
  level: string | null;
  country: string | null;
  city: string | null;
};

type ChartResult = {
  dimension: Dimension;
  totalCompanies: number;
  data: Array<{
    label: string;
    count: number;
  }>;
  hierarchy: CompanyHierarchyNode;
};

type ChartView = 'bar' | 'bubble';

type FilterState = {
  level: string[];
  country: string[];
  city: string[];
  foundedYearStart: string;
  foundedYearEnd: string;
  annualRevenueMin: string;
  annualRevenueMax: string;
  employeesMin: string;
  employeesMax: string;
};

const emptyFilters: FilterState = {
  level: [],
  country: [],
  city: [],
  foundedYearStart: '',
  foundedYearEnd: '',
  annualRevenueMin: '',
  annualRevenueMax: '',
  employeesMin: '',
  employeesMax: '',
};

function toOptionalNumber(value: string) {
  if (value.trim() === '') {
    return undefined;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

/**
 * Own linked company filters and switch between aggregate and hierarchy views.
 * Draft filters are submitted explicitly to avoid a request on every keystroke.
 */
export default function CompanyBarChart() {
  const [dimension, setDimension] = useState<Dimension>('level');
  const [chartView, setChartView] = useState<ChartView>('bar');
  const [filters, setFilters] = useState<FilterState>(emptyFilters);

  const [levelOptions, setLevelOptions] = useState<string[]>([]);
  const [countryOptions, setCountryOptions] = useState<string[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);

  const [result, setResult] = useState<ChartResult>({
    dimension: 'level',
    totalCompanies: 0,
    data: [],
    hierarchy: {
      name: 'Company hierarchy',
      children: [],
    },
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const chartRequestIdRef = useRef(0);

  const loadFilterOptions = useCallback(async () => {
    try {
      const response = await fetch(apiUrl('/companies'));
      const companies: Company[] = await response.json();

      if (!response.ok || !Array.isArray(companies)) {
        return;
      }

      setCompanies(companies);

      setLevelOptions(
        Array.from(
          new Set(
            companies
              .map((company) => company.level)
              .filter((value): value is string => Boolean(value))
          )
        ).sort()
      );

      setCountryOptions(
        Array.from(
          new Set(
            companies
              .map((company) => company.country)
              .filter((value): value is string => Boolean(value))
          )
        ).sort()
      );

    } catch {
      // The chart request below will display the main connection error.
    }
  }, []);

  const cityOptions = useMemo(() => {
    return Array.from(
      new Set(
        companies
          .filter((company) =>
            company.country
              ? filters.country.includes(company.country)
              : false
          )
          .map((company) => company.city)
          .filter((value): value is string => Boolean(value))
      )
    ).sort();
  }, [companies, filters.country]);

  useEffect(() => {
    setFilters((current) => {
      const city = current.city.filter((value) =>
        cityOptions.includes(value)
      );

      return city.length === current.city.length
        ? current
        : { ...current, city };
    });
  }, [cityOptions]);

  const fetchChartData = useCallback(
    async (
      selectedDimension: Dimension = dimension,
      selectedFilters: FilterState = filters
    ) => {
      const requestId = ++chartRequestIdRef.current;
      setLoading(true);
      setError('');

      const requestBody = {
        dimension: selectedDimension,
        filter: {
          level: selectedFilters.level,
          country: selectedFilters.country,
          city: selectedFilters.city,
          founded_year: {
            start: toOptionalNumber(selectedFilters.foundedYearStart),
            end: toOptionalNumber(selectedFilters.foundedYearEnd),
          },
          annual_revenue: {
            min: toOptionalNumber(selectedFilters.annualRevenueMin),
            max: toOptionalNumber(selectedFilters.annualRevenueMax),
          },
          employees: {
            min: toOptionalNumber(selectedFilters.employeesMin),
            max: toOptionalNumber(selectedFilters.employeesMax),
          },
        },
      };

      try {
        const response = await fetch(
          apiUrl('/dashboard/companies/filter'),
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          if (requestId === chartRequestIdRef.current) {
            setError(data.message || 'Cannot load bar chart data');
          }

          return;
        }

        if (requestId === chartRequestIdRef.current) {
          setResult(data);
        }
      } catch {
        if (requestId === chartRequestIdRef.current) {
          setError('Cannot connect to backend server');
        }
      } finally {
        // A slower previous request must not clear the loading state or
        // overwrite feedback for the user's latest filter selection.
        if (requestId === chartRequestIdRef.current) {
          setLoading(false);
        }
      }
    },
    [dimension, filters]
  );

  useEffect(() => {
    loadFilterOptions();
  }, [loadFilterOptions]);

  useEffect(() => {
    fetchChartData(dimension, filters);
    // Only reload automatically when the selected dimension changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dimension]);

  const handleReset = () => {
    setFilters(emptyFilters);
    fetchChartData(dimension, emptyFilters);
  };

  const chartData = useMemo(
    () => ({
      labels: result.data.map((item) => item.label),
      datasets: [
        {
          label: 'Companies',
          data: result.data.map((item) => item.count),
          borderWidth: 1,
        },
      ],
    }),
    [result]
  );

  const chartOptions = useMemo<ChartOptions<'bar'>>(
    () => ({
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
              const count = Number(context.parsed.y);
              const percentage =
                result.totalCompanies > 0
                  ? (count / result.totalCompanies) * 100
                  : 0;

              return `${count} companies (${percentage.toFixed(1)}%)`;
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
          title: {
            display: true,
            text: 'Number of Companies',
          },
        },
        x: {
          title: {
            display: true,
            text:
              dimension === 'level'
                ? 'Company Level'
                : dimension === 'country'
                  ? 'Country'
                  : 'City',
          },
        },
      },
    }),
    [dimension, result.totalCompanies]
  );

  return (
    <Paper sx={{ p: 3, mt: 3 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>
        Company Distribution
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Filter company data and group results by level, country, or city
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            md: 'repeat(2, 1fr)',
            lg: 'repeat(4, 1fr)',
          },
          gap: 2,
          mb: 2,
        }}
      >
        <FormControl fullWidth>
          <InputLabel>Dimension</InputLabel>

          <Select
            value={dimension}
            label="Dimension"
            onChange={(event) =>
              setDimension(event.target.value as Dimension)
            }
          >
            <MenuItem value="level">Level</MenuItem>
            <MenuItem value="country">Country</MenuItem>
            <MenuItem value="city">City</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel>Level</InputLabel>

          <Select
            multiple
            value={filters.level}
            onChange={(event) => {
              const value = event.target.value;

              setFilters({
                ...filters,
                level:
                  typeof value === 'string' ? value.split(',') : value,
              });
            }}
            input={<OutlinedInput label="Level" />}
            renderValue={(selected) => selected.join(', ')}
          >
            {levelOptions.map((level) => (
              <MenuItem key={level} value={level}>
                {level}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel>Country</InputLabel>

          <Select
            multiple
            value={filters.country}
            onChange={(event) => {
              const value = event.target.value;

              setFilters({
                ...filters,
                country:
                  typeof value === 'string' ? value.split(',') : value,
              });
            }}
            input={<OutlinedInput label="Country" />}
            renderValue={(selected) => selected.join(', ')}
          >
            {countryOptions.map((country) => (
              <MenuItem key={country} value={country}>
                {country}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel>City</InputLabel>

          <Select
            multiple
            disabled={filters.country.length === 0}
            value={filters.city}
            onChange={(event) => {
              const value = event.target.value;

              setFilters({
                ...filters,
                city:
                  typeof value === 'string' ? value.split(',') : value,
              });
            }}
            input={<OutlinedInput label="City" />}
            renderValue={(selected) => selected.join(', ')}
          >
            {cityOptions.map((city) => (
              <MenuItem key={city} value={city}>
                {city}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label="Founded Year Start"
          type="number"
          value={filters.foundedYearStart}
          onChange={(event) =>
            setFilters({
              ...filters,
              foundedYearStart: event.target.value,
            })
          }
        />

        <TextField
          label="Founded Year End"
          type="number"
          value={filters.foundedYearEnd}
          onChange={(event) =>
            setFilters({
              ...filters,
              foundedYearEnd: event.target.value,
            })
          }
        />

        <TextField
          label="Annual Revenue Min"
          type="number"
          value={filters.annualRevenueMin}
          onChange={(event) =>
            setFilters({
              ...filters,
              annualRevenueMin: event.target.value,
            })
          }
        />

        <TextField
          label="Annual Revenue Max"
          type="number"
          value={filters.annualRevenueMax}
          onChange={(event) =>
            setFilters({
              ...filters,
              annualRevenueMax: event.target.value,
            })
          }
        />

        <TextField
          label="Employees Min"
          type="number"
          value={filters.employeesMin}
          onChange={(event) =>
            setFilters({
              ...filters,
              employeesMin: event.target.value,
            })
          }
        />

        <TextField
          label="Employees Max"
          type="number"
          value={filters.employeesMax}
          onChange={(event) =>
            setFilters({
              ...filters,
              employeesMax: event.target.value,
            })
          }
        />
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Button
          variant="contained"
          onClick={() => fetchChartData()}
          disabled={loading}
        >
          Apply Filters
        </Button>

        <Button
          variant="outlined"
          onClick={handleReset}
          disabled={loading}
        >
          Reset
        </Button>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs
          value={chartView}
          onChange={(_event, value) =>
            setChartView(value as ChartView)
          }
          aria-label="Company chart type"
        >
          <Tab value="bar" label="Bar Chart" />
          <Tab value="bubble" label="Bubble Chart" />
        </Tabs>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Matching companies: {result.totalCompanies}
      </Typography>

      {loading ? (
        <Box
          sx={{
            height: 400,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CircularProgress />
        </Box>
      ) : result.totalCompanies === 0 ? (
        <Box
          sx={{
            height: 240,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography color="text.secondary">
            No company data matches the selected filters
          </Typography>
        </Box>
      ) : chartView === 'bar' ? (
        <Box sx={{ height: 420 }}>
          <Bar data={chartData} options={chartOptions} />
        </Box>
      ) : (
        <CompanyBubbleChart data={result.hierarchy} />
      )}
    </Paper>
  );
}
