import React, { useState, useEffect } from 'react';
import { Container, Grid, Paper, Typography } from '@mui/material';
import { io } from 'socket.io-client';
import OrderTable from './OrderTable';
import OrderChart from './OrderChart';
import MockOrderForm from '../MockOrderForm/MockOrderForm';

const Dashboard = () => {
  const [orders, setOrders] = useState([]);
  const [socket, setSocket] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  useEffect(() => {
    // Connect to WebSocket server
    const newSocket = io('http://localhost:4000', {
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('✅ Connected to WebSocket server');
      setConnectionStatus('connected');
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Disconnected from WebSocket server');
      setConnectionStatus('disconnected');
    });

    newSocket.on('order_processed', (newOrder) => {
      console.log('📦 New order received:', newOrder);
      setOrders((prevOrders) => [newOrder, ...prevOrders]);
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      if (newSocket) {
        newSocket.close();
      }
    };
  }, []);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Order Dashboard
        <Typography variant="caption" sx={{ ml: 2, color: connectionStatus === 'connected' ? 'success.main' : 'error.main' }}>
          ({connectionStatus})
        </Typography>
      </Typography>
      
      <Grid container spacing={3}>
        {/* Mock Order Form */}
        <Grid item xs={12}>
          <MockOrderForm />
        </Grid>

        {/* Chart */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" gutterBottom>
              Order Statistics
            </Typography>
            <OrderChart orders={orders} />
          </Paper>
        </Grid>
        
        {/* Recent Orders */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" gutterBottom>
              Recent Orders ({orders.length})
            </Typography>
            <OrderTable orders={orders} />
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard; 