'use client';

import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';

type User = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
};

const roleOptions = ['Admin', 'Manager', 'Operator', 'Viewer'];
const statusOptions = ['Active', 'Pending', 'Disabled'];

export default function UserPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchName, setSearchName] = useState('');
  const [roleFilter, setRoleFilter] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [error, setError] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Viewer',
    status: 'Active',
  });

  const fetchUsers = async () => {
    setError('');

    try {
      const res = await fetch('http://localhost:3001/users');
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Cannot load users');
        return;
      }

      setUsers(Array.isArray(data) ? data : []);
    } catch {
      setError('Cannot connect to backend server');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesName = (user.name || '')
        .toLowerCase()
        .includes(searchName.toLowerCase());

      const matchesRole =
        roleFilter.length === 0 || roleFilter.includes(user.role);

      return matchesName && matchesRole;
    });
  }, [users, searchName, roleFilter]);

  const openAddDialog = () => {
    setEditingUser(null);
    setForm({
      name: '',
      email: '',
      password: '',
      role: 'Viewer',
      status: 'Active',
    });
    setDialogOpen(true);
  };

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setForm({
      name: user.name || '',
      email: user.email,
      password: '',
      role: user.role || 'Viewer',
      status: user.status || 'Active',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setError('');

    if (!form.name.trim()) {
      setError('Name is required');
      return;
    }

    if (!form.email.trim()) {
      setError('Email is required');
      return;
    }

    if (!editingUser && form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      const url = editingUser
        ? `http://localhost:3001/users/${editingUser.id}`
        : 'http://localhost:3001/users';

      const method = editingUser ? 'PATCH' : 'POST';

      const body: Record<string, string> = {
        name: form.name,
        email: form.email,
        role: form.role,
        status: form.status,
      };

      if (!editingUser || form.password) {
        body.password = form.password;
      }

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Save user failed');
        return;
      }

      setDialogOpen(false);
      fetchUsers();
    } catch {
      setError('Cannot connect to backend server');
    }
  };

  const handleDelete = async (id: string) => {
    setError('');

    try {
      const res = await fetch(`http://localhost:3001/users/${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Delete user failed');
        return;
      }

      fetchUsers();
    } catch {
      setError('Cannot connect to backend server');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    setError('');

    try {
      const res = await fetch('http://localhost:3001/users/bulk', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: selectedIds }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Delete selected users failed');
        return;
      }

      setSelectedIds([]);
      fetchUsers();
    } catch {
      setError('Cannot connect to backend server');
    }
  };

  const columns: GridColDef<User>[] = [
    {
      field: 'name',
      headerName: 'Name',
      flex: 1,
      renderCell: (params) => params.row.name || '-',
    },
    {
      field: 'email',
      headerName: 'Email',
      flex: 1.4,
    },
    {
      field: 'role',
      headerName: 'Title / Role',
      flex: 1,
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 0.8,
      renderCell: (params) => {
        const value = params.row.status;

        return (
          <Chip
            label={value}
            size="small"
            color={value === 'Active' ? 'success' : 'default'}
          />
        );
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 1.2,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button size="small" onClick={() => openEditDialog(params.row)}>
            Edit
          </Button>

          <Button
            size="small"
            color="error"
            onClick={() => handleDelete(params.row.id)}
          >
            Delete
          </Button>
        </Box>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <Box>
        <Box
          sx={{
            mb: 3,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="h4">User Management</Typography>

          <Button variant="contained" onClick={openAddDialog}>
            Add User
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            label="Search by name"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            sx={{ width: 280 }}
          />

          <FormControl sx={{ width: 280 }}>
            <InputLabel>Filter by role</InputLabel>
            <Select
              multiple
              value={roleFilter}
              onChange={(e) => {
                const value = e.target.value;
                setRoleFilter(
                  typeof value === 'string' ? value.split(',') : value
                );
              }}
              input={<OutlinedInput label="Filter by role" />}
              renderValue={(selected) => selected.join(', ')}
            >
              {roleOptions.map((role) => (
                <MenuItem key={role} value={role}>
                  {role}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            color="error"
            variant="outlined"
            disabled={selectedIds.length === 0}
            onClick={handleBulkDelete}
          >
            Delete Selected
          </Button>
        </Box>

        <Box sx={{ height: 520, width: '100%', backgroundColor: '#fff' }}>
          <DataGrid
            rows={filteredUsers}
            columns={columns}
            checkboxSelection
            disableRowSelectionOnClick
            onRowSelectionModelChange={(newSelection: any) => {
              if (Array.isArray(newSelection)) {
                setSelectedIds(newSelection.map(String));
              } else if (newSelection?.ids) {
                setSelectedIds(Array.from(newSelection.ids).map(String));
              }
            }}
            pageSizeOptions={[5, 10, 20]}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 10, page: 0 },
              },
            }}
          />
        </Box>
      </Box>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth>
        <DialogTitle>{editingUser ? 'Edit User' : 'Add User'}</DialogTitle>

        <DialogContent>
          <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              fullWidth
            />

            <TextField
              label="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              fullWidth
            />

            <TextField
              label={editingUser ? 'New Password (optional)' : 'Password'}
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              fullWidth
            />

            <TextField
              select
              label="Role"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              fullWidth
            >
              {roleOptions.map((role) => (
                <MenuItem key={role} value={role}>
                  {role}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Status"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              fullWidth
            >
              {statusOptions.map((status) => (
                <MenuItem key={status} value={status}>
                  {status}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}
