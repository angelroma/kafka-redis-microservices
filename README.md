🔹 Full Project Overview
This a minimal scalable order processing system with:

Kafka → Event-driven microservices communication (durable message storage).
Redis → Real-time updates for the dashboard.
MongoDB (Sharded) → Storing orders efficiently.
Node.js Microservices → API Gateway, Order Service, Notification Service.
React Dashboard → Display real-time order updates using WebSockets & Redis.

🔹 Tech Stack

| Component            | Technology                     |
| -------------------- | ------------------------------ |
| Frontend             | React + WebSockets             |
| API Gateway          | Node.js (Express.js)           |
| Order Service        | Node.js + MongoDB (Sharded)    |
| Notification Service | Node.js + Redis Pub/Sub        |
| Messaging            | Kafka (Event Streaming)        |
| Database             | MongoDB (Sharded Cluster)      |
| Deployment           | Docker + Kubernetes (Optional) |

🔹 System Architecture

```
[ Client (React Dashboard) ]
    ⬇ WebSockets (Real-time)
[ Redis Pub/Sub (Fast notifications) ]
    ⬆
[ Kafka (Event Streaming) ]
    ⬇
[ API Gateway (Node.js) ]
    ⬇
[ Order Service (Stores in MongoDB) ]
    ⬆
[ Notification Service (Sends to Redis) ]
```
