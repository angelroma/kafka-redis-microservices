require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { createServer } = require('http');
const { Server } = require('socket.io');
const { Kafka, Partitioners } = require('kafkajs');
const logger = require('./utils/logger');
const connectDB = require('./config/db');
const Order = require('./models/Order');
const mongoose = require('mongoose');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`Incoming ${req.method} request to ${req.url}`, {
    method: req.method,
    url: req.url,
    query: req.query,
    ip: req.ip
  });
  next();
});

// Kafka configuration
const kafka = new Kafka({
  clientId: 'api-gateway',
  brokers: ['kafka:29092']
});

const producer = kafka.producer({
  createPartitioner: Partitioners.LegacyPartitioner
});

// Connect to MongoDB
connectDB();

// Connect to Kafka
const connectProducer = async () => {
  try {
    await producer.connect();
    logger.info('✅ Connected to Kafka');
  } catch (error) {
    logger.error('❌ Failed to connect to Kafka:', { error: error.message, stack: error.stack });
  }
};

connectProducer();

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });

  socket.on('error', (error) => {
    logger.error('Socket error:', { socketId: socket.id, error: error.message });
  });
});

// Routes
app.get("/health", (req, res) => {
  logger.info('Health check endpoint called');
  res.status(200).json({ status: "OK" });
});

// Get orders with optional status filter
app.get('/api/orders', async (req, res) => {
  try {
    const { status } = req.query;
    const query = status ? { status: status.toUpperCase() } : {};
    
    logger.info('Fetching orders:', { 
      status: status || 'ALL',
      query
    });

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(100);

    logger.info('Orders fetched successfully:', { 
      count: orders.length,
      status: status || 'ALL'
    });

    res.json({
      success: true,
      orders
    });
  } catch (error) {
    logger.error('Error fetching orders:', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: error.message
    });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const { userId, product, quantity } = req.body;
    const orderId = `ORD-${Date.now()}`;

    logger.info('Creating new order:', { 
      orderId, 
      userId, 
      product, 
      quantity,
      timestamp: new Date().toISOString()
    });

    // Create order in MongoDB
    const order = new Order({
      orderId,
      userId,
      product,
      quantity,
      status: 'PENDING'
    });

    logger.debug('Order model created:', { 
      order: order.toJSON(),
      collection: order.collection.name,
      modelName: order.constructor.modelName
    });

    const savedOrder = await order.save();
    logger.info('Order saved to MongoDB:', { 
      orderId: savedOrder.orderId,
      id: savedOrder._id,
      status: savedOrder.status,
      collection: savedOrder.collection.name,
      modelName: savedOrder.constructor.modelName
    });

    // Send to Kafka
    const kafkaMessage = {
      orderId,
      userId,
      product,
      quantity,
      timestamp: Date.now()
    };

    logger.debug('Sending order to Kafka:', { 
      topic: 'order-created',
      message: kafkaMessage
    });

    await producer.send({
      topic: 'order-created',
      messages: [
        { 
          key: orderId,
          value: JSON.stringify(kafkaMessage)
        }
      ]
    });

    logger.info('Order sent to Kafka:', { 
      orderId,
      topic: 'order-created'
    });

    io.emit('orderCreated', savedOrder);
    logger.debug('Socket.IO event emitted:', {
      event: 'orderCreated',
      order: savedOrder.toJSON()
    });
    
    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order: savedOrder
    });
  } catch (error) {
    logger.error('Error creating order:', {
      error: error.message,
      stack: error.stack,
      code: error.code,
      body: req.body
    });
    res.status(500).json({
      success: false,
      message: 'Error creating order',
      error: error.message
    });
  }
});

const startServer = async () => {
  try {
    await producer.connect();
    logger.info('Connected to Kafka');
    
    httpServer.listen(PORT, () => {
      logger.info(`API Gateway running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Error starting server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  try {
    await producer.disconnect();
    await mongoose.connection.close();
    logger.info('Gracefully shutting down API Gateway');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
});

startServer();