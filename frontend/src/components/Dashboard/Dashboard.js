import React, { useState, useEffect } from 'react';
import { Container, Grid, Paper, Typography } from '@mui/material';
import { io } from 'socket.io-client';
import OrderTable from './OrderTable';
import OrderChart from './OrderChart';
import MockOrderForm from '../MockOrderForm/MockOrderForm';
import logger from '../../utils/logger';

const Dashboard = () => {
  const [orders, setOrders] = useState([]);
  const [socket, setSocket] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  useEffect(() => {
    logger.info('Initializing WebSocket connection');
    
    // Connect to WebSocket server
    const newSocket = io('http://localhost:4000', {
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      logger.info('WebSocket connected', { socketId: newSocket.id });
      setConnectionStatus('connected');
    });

    newSocket.on('disconnect', () => {
      logger.warn('WebSocket disconnected', { socketId: newSocket.id });
      setConnectionStatus('disconnected');
    });

    newSocket.on('connect_error', (error) => {
      logger.error('WebSocket connection error', error);
      setConnectionStatus('disconnected');
    });

    newSocket.on('orderCreated', (newOrder) => {
      logger.info('New order received', { orderId: newOrder.orderId });
      setOrders((prevOrders) => [newOrder, ...prevOrders]);
    });

    newSocket.on('orderProcessed', (processedOrder) => {
      logger.info('Order processed', { orderId: processedOrder.orderId });
      setOrders((prevOrders) => 
        prevOrders.map(order => 
          order.orderId === processedOrder.orderId 
            ? { ...order, status: 'PROCESSED', processedAt: processedOrder.processedAt }
            : order
        )
      );
    });

    newSocket.on('orderFailed', (failedOrder) => {
      logger.info('Order failed', { orderId: failedOrder.orderId, error: failedOrder.error });
      setOrders((prevOrders) => 
        prevOrders.map(order => 
          order.orderId === failedOrder.orderId 
            ? { ...order, status: 'FAILED', failedAt: failedOrder.failedAt, error: failedOrder.error }
            : order
        )
      );
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      if (newSocket) {
        logger.info('Closing WebSocket connection', { socketId: newSocket.id });
        newSocket.close();
      }
    };
  }, []);

  // Log orders state changes
  useEffect(() => {
    logger.debug('Orders updated', { count: orders.length });
  }, [orders]);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Order Dashboard
        <Typography 
          variant="caption" 
          sx={{ 
            ml: 2, 
            color: connectionStatus === 'connected' ? 'success.main' : 'error.main' 
          }}
        >
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