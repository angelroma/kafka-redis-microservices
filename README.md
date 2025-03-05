# Real-time Order Processing System with Kafka & Redis

A scalable, real-time order processing system built with microservices architecture, using Kafka for event streaming and MongoDB for data persistence. This system demonstrates advanced order management capabilities with real-time status updates, filtering, and comprehensive order tracking.

## 📸 Screenshots

### Dashboard UI with Status Filtering
![Order Dashboard with Filtering](docs/images/dashboard2.png)
*Enhanced order dashboard featuring status-based filtering, real-time updates, and detailed order tracking*

### Original Dashboard
![Original Dashboard](docs/images/dashboard.png)
*Real-time order dashboard showing statistics and recent orders*

### API Gateway Logs
![API Gateway Console](docs/images/api_gateway_console.png)
*API Gateway console showing structured logging with Winston*

## 🏗 Architecture

- **API Gateway**: Node.js service handling incoming requests and WebSocket connections
- **Kafka**: Message broker for reliable event streaming and order processing
- **Redis**: Real-time updates and caching
- **MongoDB**: Order data persistence with status tracking
- **React Dashboard**: Real-time order monitoring with advanced filtering and statistics

## 🔄 How It Works

1. **Order Creation Flow**
   - User submits an order through the React Dashboard
   - API Gateway receives the order and:
     - Saves it to MongoDB with 'PENDING' status
     - Publishes an 'order-created' event to Kafka
     - Notifies connected clients via WebSocket

2. **Order Processing Flow**
   - Order Service consumes 'order-created' events from Kafka
   - Processes the order and updates its status:
     - On success: Updates status to 'PROCESSED'
     - On failure: Updates status to 'FAILED'
   - Emits appropriate WebSocket events ('orderProcessed' or 'orderFailed')

3. **Real-time Updates**
   - Dashboard maintains WebSocket connection to API Gateway
   - Receives instant updates for:
     - New orders (orderCreated event)
     - Processed orders (orderProcessed event)
     - Failed orders (orderFailed event)
   - Updates UI in real-time without page refresh

4. **Data Persistence**
   - All orders are stored in MongoDB
   - Each order contains:
     - Unique Order ID
     - User ID
     - Product details
     - Quantity
     - Status (PENDING/PROCESSED/FAILED)
     - Timestamps (created, processed, failed)

5. **Status Filtering**
   - Dashboard provides real-time filtering by order status
   - Filter options:
     - ALL: Shows all orders
     - PENDING: Shows only unprocessed orders
     - PROCESSED: Shows successfully processed orders
     - FAILED: Shows failed orders
   - Filters are applied both to:
     - Existing orders in the table
     - New orders received via WebSocket

## 💻 System Implementation Details

### API Gateway Service
- **Express.js Server Configuration**
  - RESTful API endpoints for order management
  - CORS enabled for frontend communication
  - Structured logging with Winston
  - Request validation middleware

- **WebSocket Implementation**
  - Socket.IO server integration
  - Real-time event broadcasting
  - Connection state management
  - Client connection pooling

- **Kafka Producer Setup**
  - Legacy partitioner configuration
  - Message key strategy using Order ID
  - Asynchronous message publishing
  - Error handling and retries

### Order Processing Service
- **Kafka Consumer Configuration**
  - Consumer group management
  - Topic subscription handling
  - Message deserialization
  - Batch processing capabilities

- **Order Processing Logic**
  - Status transition management
  - Timestamp tracking for each state
  - Error boundary implementation
  - Retry mechanism for failed orders

- **Database Operations**
  - Atomic updates with MongoDB
  - Optimistic concurrency control
  - Transaction management
  - Index optimization

### React Dashboard Architecture
- **State Management**
  - Real-time order state updates
  - Optimistic UI updates
  - Status filtering logic
  - WebSocket reconnection handling

- **Component Structure**
  - Material-UI integration
  - Responsive layout system
  - Chart visualization with Recharts
  - Custom hook implementations

- **Event Handling**
  - WebSocket event listeners
  - Error boundary components
  - Connection status monitoring
  - Real-time data synchronization

### Data Model Design
- **Order Document Structure**
  - Unique identifier generation
  - Status enumeration
  - Timestamp tracking
  - Error message handling

- **Schema Validation**
  - Required field constraints
  - Data type validation
  - Enum value restrictions
  - Custom validators

### Key Technical Features

1. **Event Sourcing Pattern**
   - Orders flow through Kafka topics
   - Each state change is an event
   - Events are persisted and can be replayed
   - Event-driven architecture benefits

2. **Real-time Updates**
   - Socket.IO for bidirectional communication
   - Event-based architecture for real-time state updates
   - Optimistic UI updates with WebSocket confirmation
   - Connection state management

3. **Error Handling**
   - Failed orders are tracked with error messages
   - Automatic status updates on failures
   - Error events propagated to UI
   - Retry mechanisms and circuit breakers

4. **Data Consistency**
   - MongoDB transactions for order updates
   - Kafka exactly-once delivery semantics
   - Optimistic locking for concurrent updates
   - Data validation at multiple layers

5. **Performance Optimizations**
   - Kafka partitioning for parallel processing
   - MongoDB indexes on frequently queried fields
   - WebSocket connection pooling
   - React memo and callback optimizations
   - Batch processing capabilities
   - Connection pooling
   - Query optimization

## 🚀 Features

- Real-time order processing and status updates
- Advanced order filtering (All, Pending, Processed, Failed)
- Detailed order tracking with timestamps
- Status-based color coding for better visibility
- Mock order generation with Faker.js
- Live order statistics and charts
- WebSocket connection status monitoring
- Scalable microservices architecture
- Event-driven design with Kafka

## 📋 Prerequisites

- Docker and Docker Compose
- Git

## 🛠 Running the Application

### Development Mode (Individual Services)

1. **Start Infrastructure Services**
   ```bash
   # Start required infrastructure
   docker-compose up -d
   ```

2. **Set Up Environment Variables**
   ```bash
   # API Gateway (.env)
   cd backend/api-gateway
   cp .env.example .env
   
   # Order Service (.env)
   cd ../order-service
   cp .env.example .env
   
   # Frontend (.env)
   cd ../../frontend
   cp .env.example .env
   ```

3. **Install Dependencies and Start Services**
   ```bash
   # Terminal 1 - API Gateway
   cd backend/api-gateway
   npm install
   npm run dev

   # Terminal 2 - Order Service
   cd backend/order-service
   npm install
   npm run dev

   # Terminal 3 - Frontend
   cd frontend
   npm install
   npm start
   ```

4. **Access the Application**
   - Frontend: http://localhost:3000
   - API Gateway: http://localhost:4000

5. **Stop Development Services**
   ```bash
   # Stop all running Node.js services (API Gateway, Order Service, Frontend)
   # Press Ctrl+C in each terminal where the services are running

   # Stop infrastructure services (Kafka, MongoDB, Redis, etc.)
   docker-compose down

   # To remove all containers and volumes (clean slate)
   docker-compose down -v

   # To remove all containers, volumes, and images
   docker-compose down -v --rmi all
   ```

### Production Mode (Containerized)

1. **Build and Start All Services**
   ```bash
   # Build and start all services
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
   ```

2. **Access the Application**
   - Frontend: http://localhost:3000
   - API Gateway: http://localhost:4000

3. **Monitor Services**
   ```bash
   # View all container logs
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f

   # View specific service logs
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f api-gateway
   ```

4. **Stop All Services**
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml down
   ```

### Development Tools

1. **MongoDB Compass Connection**
   ```
   mongodb://localhost:27017/order-management
   ```

2. **Kafka Topics**
   ```bash
   # List topics
   docker-compose exec kafka kafka-topics --list --bootstrap-server localhost:9092

   # View messages in a topic
   docker-compose exec kafka kafka-console-consumer --topic order-created --from-beginning --bootstrap-server localhost:9092
   ```

3. **Redis CLI**
   ```bash
   docker-compose exec redis redis-cli
   ```

### Monitoring and Debugging

1. **View Service Logs**
   ```bash
   # Development mode
   tail -f backend/api-gateway/logs/app.log
   tail -f backend/order-service/logs/app.log

   # Production mode
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f
   ```

2. **Check Service Health**
   ```bash
   # Development mode
   curl http://localhost:4000/health

   # Production mode
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml ps
   ```

## 🎮 Using the Dashboard

1. **Generate Mock Orders**
   - Use the "Generate Random Values" button to create random order data
   - Click "Create Order" to submit the order
   - Watch the real-time updates in the chart and table

2. **Monitor Orders**
   - View order statistics in the chart
   - See detailed order information in the table
   - Check WebSocket connection status

## 🔧 Environment Variables

### API Gateway (.env)
```env
PORT=4000
KAFKA_BROKERS=localhost:9092
```

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:4000
```

## 🔍 Monitoring

- **Kafka**: Monitor topics and messages using Kafka UI or command-line tools
- **MongoDB**: Use MongoDB Compass for database monitoring
- **Redis**: Monitor real-time events using Redis CLI

## 🛟 Troubleshooting

1. **Kafka Connection Issues**
   - Ensure Kafka and Zookeeper are running: `docker-compose ps`
   - Check Kafka logs: `docker-compose logs kafka`

2. **WebSocket Connection Issues**
   - Verify API Gateway is running on port 4000
   - Check browser console for connection errors

3. **MongoDB Connection Issues**
   - Ensure MongoDB is running: `docker-compose ps`
   - Check MongoDB logs: `docker-compose logs mongodb`

## 📚 Tech Stack

- **Backend**: Node.js, Express
- **Frontend**: React, Material-UI, Recharts
- **Message Broker**: Apache Kafka
- **Cache**: Redis
- **Database**: MongoDB
- **Real-time**: Socket.IO
- **Container**: Docker

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
