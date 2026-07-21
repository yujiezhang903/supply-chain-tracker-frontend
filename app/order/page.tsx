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

type Order = {
  id: string;
  companyId: string;
  productName: string;
  quantity: number;
  status: string;
};

export default function OrderPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [companyId, setCompanyId] = useState('');
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [status, setStatus] = useState('Pending');
  const [error, setError] = useState('');

  const fetchOrders = async () => {
    try {
      const res = await fetch('http://localhost:3001/orders');
      const data = await res.json();
      setOrders(data);
    } catch {
      setError('Cannot load orders');
    }
  };

  const handleCreate = async () => {
    try {
      const res = await fetch('http://localhost:3001/orders', {
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

      fetchOrders();
    } catch {
      setError('Cannot connect to backend server');
    }
  };

  useEffect(() => {
    fetchOrders();
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
