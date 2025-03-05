import React, { useState, useEffect } from 'react';
import { Container, Grid, Paper, Typography } from '@mui/material';
import { io } from 'socket.io-client';
import OrderTable from './OrderTable';
import OrderChart from './OrderChart';

const Dashboard = () => {
  const [orders, setOrders] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Connect to WebSocket server
    const newSocket = io('http://localhost:4000');
    setSocket(newSocket);

    // Listen for real-time order updates
    newSocket.on('order_processed', (newOrder) => {
      setOrders((prevOrders) => [newOrder, ...prevOrders]);
    });

    // Cleanup on unmount
    return () => newSocket.close();
  }, []);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Order Dashboard
      </Typography>
      
      <Grid container spacing={3}>
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
              Recent Orders
            </Typography>
            <OrderTable orders={orders} />
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard; 