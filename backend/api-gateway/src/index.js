require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { createServer } = require('http');
const { Server } = require('socket.io');
const { Kafka } = require('kafkajs');
const logger = require('./utils/logger');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const port = process.env.PORT || 4000;

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
  brokers: ['localhost:9092']
});

const producer = kafka.producer();

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
  logger.info('👤 Client connected', { socketId: socket.id });

  socket.on('disconnect', () => {
    logger.info('👤 Client disconnected', { socketId: socket.id });
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

app.post('/order', async (req, res) => {
  try {
    const order = {
      ...req.body,
      orderId: Date.now().toString(),
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };

    logger.info('Processing new order:', { orderId: order.orderId });

    // Send to Kafka
    await producer.send({
      topic: 'order_created',
      messages: [
        { 
          key: order.orderId,
          value: JSON.stringify(order)
        }
      ]
    });

    // Emit the order to all connected clients
    io.emit('order_processed', order);

    logger.info('📦 Order processed successfully', { 
      orderId: order.orderId,
      userId: order.userId,
      product: order.product
    });

    res.status(200).json({ 
      message: 'Order created successfully', 
      orderId: order.orderId 
    });

  } catch (error) {
    logger.error('❌ Error processing order:', { 
      error: error.message,
      stack: error.stack,
      body: req.body
    });

    res.status(500).json({ 
      error: 'Failed to create order',
      details: error.message 
    });
  }
});

const server = httpServer.listen(port, () => {
  logger.info(`🚀 API Gateway running on port ${port}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  try {
    await producer.disconnect();
    logger.info('Gracefully shutting down API Gateway');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Error during shutdown:', { error: error.message });
    process.exit(1);
  }
});
