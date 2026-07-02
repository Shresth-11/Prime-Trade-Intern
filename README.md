# 📌 Primetrade.ai Backend Assignment: Secure REST API & Task Space

Welcome to **Primetask**, a high-fidelity task management solution built as a project assignment for **Primetrade.ai**. This project implements a secure, modular REST API versioned under `/api/v1` utilizing **Node.js**, **Express**, and **SQLite (via Sequelize)**, coupled with a dark-themed glassmorphism **Single Page Application (SPA)** dashboard.

---

## ⚡ Features Implemented

1. **User Authentication & Authorization**:
   - Registration and Login APIs with password hashing using `bcryptjs`.
   - Role-Based Access Control (RBAC) with `user` and `admin` scopes.
   - Stateless session handling using JWT (`jsonwebtoken`) passed in headers.
2. **Entity CRUD Actions**:
   - Secondary entity (`Task`) supporting full CRUD functionality.
   - Standard users can only view, edit, and delete their own tasks.
   - Administrators can view, filter, edit, and delete tasks belonging to any user.
3. **Admin Controls**:
   - Administrators can list all registered users.
   - Administrators can modify user roles (standard user vs administrator) dynamically.
4. **Input Sanitization & Centralized Validation**:
   - Checked schemas for incoming data using `express-validator` to prevent SQL Injection and malformed requests.
5. **Interactive Developer Console / API Log Monitor**:
   - Real-time HTTP log feed built right into the frontend dashboard showing method, status codes, JWT headers, request payload, and response JSON as you click buttons in the UI.
6. **Winston Structured Logger**:
   - Automated routing of log statements to Console, `logs/combined.log`, and `logs/error.log` for analytics.

---

## 🏗️ Tech Stack

- **Backend Framework**: Node.js & Express (ESM Import/Export)
- **Database ORM**: Sequelize
- **Database Engine**: SQLite (Zero config, local single-file database)
- **Log Management**: Winston
- **Security Utilities**: bcryptjs, jsonwebtoken, express-validator
- **Frontend Layer**: Vanilla HTML5 / CSS3 / JavaScript SPA (Served statically on port `3000`)

---

## 🚀 Setup & Launch Guide

### System Requirements
- Node.js version `v18` or higher (Tested on `v22.12.0`)
- npm version `v9` or higher (Tested on `11.1.0`)

### Installation & Run

1. Clone or download the repository, then navigate to the workspace directory.
2. Install npm packages:
   ```bash
   npm install
   ```
3. Boot up the server (will automatically run Sequelize database sync and migrations):
   - **Production / Standard Mode**:
     ```bash
     npm start
     ```
   - **Development Auto-Reload Mode**:
     ```bash
     npm run dev
     ```
4. Open your browser and navigate to **`http://localhost:3000`** to view the live dashboard.

---

## 🧪 Quick Test Credentials

- **Standard User**: 
  - Email: `user@example.com`
  - Password: `password123`
- **Administrator**:
  - Email: `admin@example.com`
  - Password: `password123`
  *(Any registered email containing the word `admin` is automatically promoted to the Admin role on signup for testing convenience).*

---

## 📝 Scalability & Architecture Note

As request volume increases, a single-instance monolith utilizing SQLite is insufficient. Here is the migration roadmap to scale this system for enterprise loads:

### 1. Database Scaling (Relational Migrations)
- **Engine Transition**: Migrate from SQLite to **PostgreSQL** or **Amazon RDS** to support high concurrent connection counts, transactional row-locking, and write replication.
- **Read/Write Splitting**: Set up a primary database node for writes (inserting users/tasks) and multiple read-replicas for fetch queries (`GET /api/v1/tasks`).
- **Indexing**: Apply database indexes on high-frequency search fields, specifically `User.email` (unique index) and `Task.userId` (foreign key index) to prevent full-table scans.

### 2. Microservices Architecture
To isolate computational loads and scale modules independently:
- **Authentication Service**: Deploy a separate auth service (or integrate an OAuth2 identity server like Keycloak/Auth0) to sign and verify JWT tokens.
- **Task Management Service**: Separate the Task CRUD logic into its own service.
- **Communication Broker**: Integrate a message queue like **RabbitMQ** or **Apache Kafka** to handle async tasks like sending emails upon signup.

### 3. Caching Layer (Redis)
- Cache frequent `GET /api/v1/tasks` listings in a **Redis** in-memory store.
- Use a cache-invalidation strategy (e.g., delete user task cache upon `POST`, `PUT`, or `DELETE` requests).
- Rate Limiting: Use Redis to track user IP/token request quotas, returning `429 Too Many Requests` to prevent API denial-of-service.

### 4. Load Balancing & State Management
- Deploy the stateless Express server across multiple containers or VMs.
- Place an **Nginx** or **AWS Application Load Balancer (ALB)** in front to distribute incoming traffic round-robin.
- Since authorization is stateless (JWT), requests can be routed to any backend server node without losing user context.

---

## 🌐 API Endpoint Documentation

| Method | Endpoint | Authorization | Description |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/v1/auth/register` | Public | Create a user. Accepts `{ name, email, password, role }` |
| **POST** | `/api/v1/auth/login` | Public | Logs in a user. Returns `{ status, token, data }` |
| **GET** | `/api/v1/auth/me` | User / Admin | Returns current user profile info |
| **POST** | `/api/v1/tasks` | User / Admin | Create a task. Accepts `{ title, description, status }` |
| **GET** | `/api/v1/tasks` | User / Admin | User gets their own tasks. Admin gets all tasks |
| **GET** | `/api/v1/tasks/:id` | User / Admin | Fetch specific task. Owners & Admins only |
| **PUT** | `/api/v1/tasks/:id` | User / Admin | Edit title, desc, status. Owners & Admins only |
| **DELETE** | `/api/v1/tasks/:id` | User / Admin | Deletes a task card. Owners & Admins only |
| **GET** | `/api/v1/users` | Admin Only | Lists all accounts, emails, and active task counts |
| **PUT** | `/api/v1/users/:id/role` | Admin Only | Promotes/demotes user role. Accepts `{ role: 'admin'/'user' }` |
