require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { createServer } = require('http');
const { Server } = require('socket.io');
const { Kafka } = require('kafkajs');

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
    console.log('✅ Connected to Kafka');
  } catch (error) {
    console.error('❌ Failed to connect to Kafka:', error);
  }
};

connectProducer();

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('👤 Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('👤 Client disconnected:', socket.id);
  });
});

// Routes will be added here
app.get("/health", (req, res) => {
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

    console.log('📦 Order sent to Kafka:', order);
    res.status(200).json({ 
      message: 'Order created successfully', 
      orderId: order.orderId 
    });

  } catch (error) {
    console.error('❌ Error creating order:', error);
    res.status(500).json({ 
      error: 'Failed to create order',
      details: error.message 
    });
  }
});

const server = httpServer.listen(port, () => {
  console.log(`🚀 API Gateway running on port ${port}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  try {
    await producer.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});
