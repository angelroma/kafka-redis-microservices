require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const { Kafka } = require('kafkajs');

const app = express();
const port = process.env.PORT || 3001;

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/orders', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Kafka setup
const kafka = new Kafka({
  clientId: 'order-service',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'order-service-group' });

async function setupKafka() {
  await producer.connect();
  await consumer.connect();
  await consumer.subscribe({ topic: 'orders', fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      console.log({
        value: message.value.toString(),
      });
    },
  });
}

setupKafka().catch(console.error);

app.use(express.json());

// Routes will be added here
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

app.listen(port, () => {
  console.log(`Order Service listening at http://localhost:${port}`);
}); 