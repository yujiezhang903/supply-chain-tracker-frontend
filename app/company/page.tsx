'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  Alert,
  Box,
  Chip,
  Collapse,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';

import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

type Company = {
  id: string;
  name: string | null;
  level: string | null;
  country?: string | null;
  city?: string | null;
  foundedYear?: number | null;
  annualRevenue?: number | null;
  employees?: number | null;
  profitEfficiency?: number | null;
};

const defaultLevelOptions = ['Level 1', 'Level 2', 'Level 3'];

function formatMoney(value?: number | null) {
  if (value === null || value === undefined) return '-';

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 2,
  }).format(value);
}

function formatNumber(value?: number | null) {
  if (value === null || value === undefined) return '-';

  return new Intl.NumberFormat('en-US').format(value);
}

function getProfitEfficiency(company: Company) {
  if (company.profitEfficiency !== null && company.profitEfficiency !== undefined) {
    return company.profitEfficiency;
  }

  const annualRevenue = company.annualRevenue ?? 0;
  const employees = company.employees ?? 0;

  if (employees <= 0) return 0;

  return annualRevenue / employees;
}

function getEfficiencyBackground(value: number) {
  if (value >= 800000) return '#d1fae5';
  if (value >= 400000) return '#fef3c7';
  if (value > 0) return '#fee2e2';

  return '#f4f6f8';
}

function getLevelChipColor(level?: string | null) {
  if (level === 'Level 1') return 'success';
  if (level === 'Level 2') return 'warning';
  if (level === 'Level 3') return 'default';

  return 'default';
}

function CompanyRow({ company }: { company: Company }) {
  const [open, setOpen] = useState(false);
  const efficiency = getProfitEfficiency(company);

  return (
    <Fragment>
      <TableRow hover>
        <TableCell width={56}>
          <IconButton size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>

        <TableCell>{company.name || '-'}</TableCell>

        <TableCell>
          <Chip
            label={company.level || '-'}
            size="small"
            color={getLevelChipColor(company.level)}
          />
        </TableCell>

        <TableCell>{company.country || '-'}</TableCell>

        <TableCell>
          <Box
            sx={{
              display: 'inline-block',
              minWidth: 120,
              px: 1.5,
              py: 0.5,
              borderRadius: 1,
              backgroundColor: getEfficiencyBackground(efficiency),
              fontWeight: 600,
            }}
          >
            {formatMoney(efficiency)}
          </Box>
        </TableCell>
      </TableRow>

      <TableRow>
        <TableCell sx={{ p: 0 }} colSpan={5}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ p: 3, backgroundColor: '#f9fafb' }}>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                Company Details
              </Typography>

              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell width="25%">City</TableCell>
                    <TableCell>{company.city || '-'}</TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell>Founded Year</TableCell>
                    <TableCell>{company.foundedYear || '-'}</TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell>Annual Revenue</TableCell>
                    <TableCell>{formatMoney(company.annualRevenue)}</TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell>Employees</TableCell>
                    <TableCell>{formatNumber(company.employees)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </Fragment>
  );
}

export default function CompanyPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [searchName, setSearchName] = useState('');
  const [levelFilter, setLevelFilter] = useState<string[]>([]);
  const [error, setError] = useState('');

  const fetchCompanies = async () => {
    setError('');

    try {
      const res = await fetch('http://localhost:3001/companies');
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Cannot load companies');
        return;
      }

      setCompanies(Array.isArray(data) ? data : []);
    } catch {
      setError('Cannot connect to backend server');
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const levelOptions = useMemo(() => {
    const levelsFromData = companies
      .map((company) => company.level)
      .filter((level): level is string => Boolean(level));

    return Array.from(new Set([...defaultLevelOptions, ...levelsFromData]));
  }, [companies]);

  const filteredCompanies = useMemo(() => {
    return companies.filter((company) => {
      const companyName = company.name || '';

      const matchesName = companyName
        .toLowerCase()
        .includes(searchName.toLowerCase());

      const matchesLevel =
        levelFilter.length === 0 ||
        (company.level !== null && levelFilter.includes(company.level));

      return matchesName && matchesLevel;
    });
  }, [companies, searchName, levelFilter]);

  return (
    <DashboardLayout>
      <Box>
        <Typography variant="h4" sx={{ mb: 3 }}>
          Company Management
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              label="Search by company name"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              sx={{ width: 320 }}
            />

            <FormControl sx={{ width: 280 }}>
              <InputLabel>Filter by level</InputLabel>
              <Select
                multiple
                value={levelFilter}
                onChange={(e) => {
                  const value = e.target.value;
                  setLevelFilter(
                    typeof value === 'string' ? value.split(',') : value
                  );
                }}
                input={<OutlinedInput label="Filter by level" />}
                renderValue={(selected) => selected.join(', ')}
              >
                {levelOptions.map((level) => (
                  <MenuItem key={level} value={level}>
                    {level}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Paper>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell />
                <TableCell>Name</TableCell>
                <TableCell>Level</TableCell>
                <TableCell>Country</TableCell>
                <TableCell>Profit Efficiency</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {filteredCompanies.map((company) => (
                <CompanyRow key={company.id} company={company} />
              ))}

              {filteredCompanies.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No companies found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </DashboardLayout>
  );
}
