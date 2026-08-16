'use client';

import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Container,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import { apiUrl } from '@/lib/api';

type Order = {
  id: string;
  companyId: string;
  productName: string;
  quantity: number;
  status: string;
};

async function requestOrders(signal?: AbortSignal): Promise<Order[]> {
  const response = await fetch(apiUrl('/orders'), { signal });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Cannot load orders');
  }

  return Array.isArray(data) ? data : [];
}

export default function OrderPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [companyId, setCompanyId] = useState('');
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [status, setStatus] = useState('Pending');
  const [error, setError] = useState('');

  const fetchOrders = async () => {
    try {
      setOrders(await requestOrders());
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : 'Cannot load orders',
      );
    }
  };

  const handleCreate = async () => {
    try {
      const res = await fetch(apiUrl('/orders'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyId,
          productName,
          quantity: Number(quantity),
          status,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Create order failed');
        return;
      }

      setCompanyId('');
      setProductName('');
      setQuantity('');
      setStatus('Pending');

      void fetchOrders();
    } catch {
      setError('Cannot connect to backend server');
    }
  };

  useEffect(() => {
    const controller = new AbortController();

    void requestOrders(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) {
          setOrders(data);
        }
      })
      .catch((loadError: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        setError(
          loadError instanceof Error ? loadError.message : 'Cannot load orders',
        );
      });

    return () => controller.abort();
  }, []);

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 6 }}>
        <Typography variant="h4" sx={{ mb: 3 }}>
          Order Management
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Create Order
          </Typography>

          <Stack spacing={2}>
            <TextField
              label="Company ID"
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              fullWidth
            />

            <TextField
              label="Product Name"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              fullWidth
            />

            <TextField
              label="Quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              fullWidth
            />

            <TextField
              select
              label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <MenuItem value="Pending">Pending</MenuItem>
              <MenuItem value="In Progress">In Progress</MenuItem>
              <MenuItem value="Completed">Completed</MenuItem>
              <MenuItem value="Cancelled">Cancelled</MenuItem>
            </TextField>

            <Button variant="contained" onClick={handleCreate}>
              Create Order
            </Button>
          </Stack>
        </Paper>

        <Typography variant="h6" sx={{ mb: 2 }}>
          Order List
        </Typography>

        <Stack spacing={2}>
          {orders.map((order) => (
            <Paper key={order.id} sx={{ p: 2 }}>
              <Typography variant="h6">
                {order.productName}
              </Typography>

              <Typography>
                Quantity: {order.quantity}
              </Typography>

              <Typography>
                Status: {order.status}
              </Typography>

              <Typography sx={{ fontSize: 12 }}>
                Company ID: {order.companyId}
              </Typography>
            </Paper>
          ))}
        </Stack>
      </Box>
    </Container>
  );
}
