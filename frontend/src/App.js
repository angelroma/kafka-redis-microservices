import React from 'react';
import { Container, CssBaseline, Box } from '@mui/material';
import OrderDashboard from './pages/OrderDashboard';

function App() {
  return (
    <>
      <CssBaseline />
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <OrderDashboard />
        </Box>
      </Container>
    </>
  );
}

export default App; 