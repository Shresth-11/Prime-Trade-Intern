# Primetrade.ai - Task Workspace

This is a clean, secure REST API and frontend task management space designed for **Primetrade.ai**. 

The project features a **Node.js/Express** backend, a local **SQLite** database managed via **Sequelize ORM**, and a responsive, vanilla JavaScript Single Page Application (SPA) dashboard. 

---

## 🎨 Theme & Design Philosophy
This workspace features a **Light Minimalist Theme** by default. Built using high-contrast slate and zinc tones (`#f9f9fb`), subtle hairline borders, and elegant transitions, the layout is modeled after high-end professional development tools.

* **Mode Toggling**: The interface includes a header control to toggle between the minimalist light mode and a custom dark mode.
* **API Log Monitor**: A collapsible developer sidebar is built directly into the dashboard. It intercepts frontend fetch requests and updates a live console feed with HTTP methods, status codes, JWT headers, request payloads, and response payloads.

---

## ⚡ Core Features
1. **User Accounts & RBAC**: Password hashing via `bcryptjs` and token validation via JWT. Supports `user` and `admin` roles.
2. **Task Board**: Task cards support complete CRUD actions. Normal users manage their own tasks, while administrators have visibility and modify permissions for all tasks.
3. **Admin Telemetry Panel**: An interactive table that displays registered users and lets administrators promote or demote user roles dynamically in real-time.
4. **Console Logging**: A structured `Winston` logger logs request cycles locally (`logs/combined.log` and `logs/error.log`).

---

## 🏗️ Tech Stack
* **Server**: Node.js & Express (ESM modular imports)
* **Database**: SQLite (Zero config, local single-file storage)
* **ORM**: Sequelize
* **Validation**: express-validator (handles input schema validation)
* **Logging**: Winston logger
* **Frontend**: Vanilla HTML5, CSS3, and JavaScript SPA (Served statically by the Express application)

---

## 🚀 Setup & Launch

### Requirements
* Node.js `v18` or higher
* npm `v9` or higher

### Installation
1. Clone the repository and enter the directory.
2. Install the package dependencies:
   ```bash
   npm install
   ```
3. Start the application:
   * **Development mode (with auto-reload)**:
     ```bash
     npm run dev
     ```
   * **Standard mode**:
     ```bash
     npm start
     ```
4. Access the workspace at: **`http://localhost:3000`**

### 🔑 Demo Credentials
You can register new accounts in the UI or use these seeded demo accounts:
* **Standard User**: `user@example.com` / `password123`
* **Admin User**: `admin@example.com` / `password123`
*(Note: Any new account registered with an email containing the string "admin" is automatically assigned the Administrator role for testing convenience).*

---

## 🌐 REST API Endpoints

| Method | Endpoint | Access | Details |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/v1/auth/register` | Public | Register user account. Body: `{ name, email, password, role }` |
| **POST** | `/api/v1/auth/login` | Public | Log in user. Returns JWT and user payload |
| **GET** | `/api/v1/auth/me` | Logged In | Retrieve current user profile details |
| **POST** | `/api/v1/tasks` | Logged In | Create task. Body: `{ title, description, status }` |
| **GET** | `/api/v1/tasks` | Logged In | Get tasks (Normal users: own tasks; Admins: all tasks) |
| **GET** | `/api/v1/tasks/:id` | Logged In | Get single task details |
| **PUT** | `/api/v1/tasks/:id` | Logged In | Update task details |
| **DELETE** | `/api/v1/tasks/:id` | Logged In | Delete task |
| **GET** | `/api/v1/users` | Admin Only | List all registered system users |
| **PUT** | `/api/v1/users/:id/role` | Admin Only | Modify user role access. Body: `{ role: 'admin'/'user' }` |
