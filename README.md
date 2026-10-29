# Ionic 2 — Task Manager with Offline Sync, JWT Auth & Pagination

A full-stack, offline-first mobile application built with **Ionic 9**, **Angular 22**, and **Node.js/Express**, created for the **Ionic 2** university assignment.

---

## 📋 Assessment Criteria & Feature Mapping

| Assessment Item | Points | Implemented Feature & Location |
| :--- | :---: | :--- |
| **Network Status** | **1p** | Dynamic **Online (green)** / **Offline (red)** chip in top navigation bar; reactive listener to browser network events + interactive offline simulation toggle. |
| **Authentication** | **1p** | JWT-based auth via `/api/auth/login` and `/api/auth/register`; token stored in `localStorage`; **auto-redirects away from login** on app start if token valid; full **Logout** workflow. |
| **Resource Linking** | **1p** | Tasks are owned by `userId` (Alice vs Bob); REST `/api/tasks` returns **only user's tasks**; WebSockets broadcast **only to client sessions belonging to that user**. |
| **Online / Offline Behavior** | **2p** | Online mode attempts REST calls first; if offline or server fails, stores data in user-scoped `localStorage`; **clearly flags unsynced items** with a warning banner and "⚠️ Not Synced (Offline)" badges. |
| **Automatic Online Sync** | **1p** | App detects when returning online (via `networkService.isOnline$`) and **automatically synchronizes** all pending offline creations and updates with the server. |
| **Pagination & Infinite Scroll** | **2p** | Server supports `page` and `limit` query params; Ionic `<ion-infinite-scroll>` fetches and appends items in 5-task chunks as the user scrolls. |
| **Search & Filter** | **1p** | Real-time title/description searchbar + segment button filter (**All**, **Pending**, **Completed**), functional both online and offline. |

---

## 🛠️ Technology Stack

- **Frontend**: Ionic Framework 9, Angular 22 (Standalone Components), TypeScript 6, SCSS
- **HTTP & Storage**: Angular `HttpClient` with `authInterceptor`, browser `localStorage`
- **Real-Time**: Native WebSocket client communicating over authenticated `/ws?token=...`
- **Backend**: Node.js, Express 4, `jsonwebtoken` (JWT), `ws` (RFC 6455 WebSocket Server)
- **Data Persistence**: In-memory multi-user store with offline client synchronization

---

## 📁 Project Structure

```
ionic1/
├── src/
│   ├── app/
│   │   ├── guards/
│   │   │   └── auth.guard.ts           # Route guards (authGuard & loginGuard)
│   │   ├── interceptors/
│   │   │   └── auth.interceptor.ts     # Injects Authorization: Bearer <token>
│   │   ├── models/
│   │   │   └── task.model.ts           # Interfaces (Task, PaginatedTasks, User, etc.)
│   │   ├── services/
│   │   │   ├── auth.service.ts         # JWT handling, login/register/logout, localStorage
│   │   │   ├── network.service.ts      # Reactive online/offline detection + simulation toggle
│   │   │   ├── storage.service.ts      # User-scoped localStorage cache & unsynced tracker
│   │   │   ├── sync.service.ts         # Auto-sync engine triggered on network recovery
│   │   │   ├── task.service.ts         # Offline-first Task API (REST + local fallback)
│   │   │   └── notification.service.ts # Secured WebSocket client (?token=...)
│   │   ├── login/                      # Authentication Page (Sign In / Register / Quick Login)
│   │   │   ├── login.page.ts
│   │   │   ├── login.page.html
│   │   │   └── login.page.scss
│   │   └── tasks/
│   │       ├── task-list/              # Master View: Infinite scroll, search/filter, sync banner
│   │       │   ├── task-list.page.ts
│   │       │   ├── task-list.page.html
│   │       │   └── task-list.page.scss
│   │       ├── task-detail/            # Detail View: All fields, offline status toggle
│   │       │   ├── task-detail.page.ts
│   │       │   ├── task-detail.page.html
│   │       │   └── task-detail.page.scss
│   │       └── task-create/            # Task creation modal (works online & offline)
│   │           └── task-create.modal.ts
│   ├── environments/                   # Dev/Prod API and WebSocket URLs
│   └── main.ts                         # Angular bootstrap with HttpClient interceptor
├── server/
│   ├── index.js                        # Secured Express REST API + Authenticated WS Server
│   ├── package.json                    # Server dependencies (express, ws, cors, jsonwebtoken)
│   ├── test-api.js                     # 11-step automated verification suite
│   └── run-tests.js                    # Test runner
├── package.json
└── README.md
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** >= 22
- **npm** >= 10

### 2. Installation
```bash
# Install frontend dependencies
npm install

# Install server dependencies
npm run server:install
```

### 3. Running the Backend Server
In Terminal 1:
```bash
npm run server
```
*Server runs on `http://localhost:3000` (REST: `/api`, WebSocket: `/ws`).*

Pre-seeded accounts:
- **Username:** `alice` | **Password:** `password` (seeded with 12 tasks for pagination testing)
- **Username:** `bob`   | **Password:** `password` (seeded with 5 tasks for resource isolation testing)

### 4. Running the Frontend
In Terminal 2:
```bash
npm start
```
*Application opens at `http://localhost:4200` (or `http://localhost:8100` via Ionic).*

### 5. Automated Backend Verification
Run the 11-step backend test suite:
```bash
npm run test:server
```

---

## 📡 REST API Documentation

Base URL: `http://localhost:3000/api`

All endpoints under `/api/tasks` require the header:
```http
Authorization: Bearer <jwt-token>
```

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticate user; returns `{ token, user: { username } }` |
| `POST` | `/api/auth/register` | Create account; returns `{ token, user: { username } }` |
| `GET` | `/api/auth/me` | Validates token and returns current user info |
| `GET` | `/api/tasks` | Lists user's tasks with pagination (`?page=1&limit=5`), search (`?search=`), and filter (`?status=`) |
| `GET` | `/api/tasks/:id` | Returns a single task (must belong to authenticated user) |
| `POST` | `/api/tasks` | Creates a new task linked to the authenticated user |
| `PATCH`| `/api/tasks/:id` | Updates task fields (`status`, `title`, `priority`, etc.) |
| `POST` | `/api/tasks/sync` | Batch synchronization endpoint for offline created and updated tasks |
| `POST` | `/api/notifications/test` | Broadcasts test notification to current user over WebSocket |

---

## 🔌 Secured WebSocket Connection

**URL:** `ws://localhost:3000/ws?token=<jwt-token>`

- Connections without a valid JWT token are rejected immediately (code `4001 Unauthorized`).
- Upon connection, the server registers the client's `userId`.
- When any task is created or updated, the server broadcasts **only to WebSocket clients belonging to that task's owner**.

---

## 🎯 Step-by-Step Demonstration Guide

### 1. Show Network Status (Online/Offline) [1p]
1. Log into the app at `http://localhost:4200`.
2. Observe the **green "Online"** badge in the upper right corner of the header.
3. Click the badge: it toggles to **red "Offline"** (simulated offline mode). A toast confirms the status.
4. Clicking it again restores **green "Online"** mode. (The app also listens to physical browser network disconnects via `window.navigator.onLine`).

### 2. User Authentication [1p]
1. Open `http://localhost:4200/login`.
2. Notice the **⚡ Demo Quick Logins** buttons for **Alice** and **Bob** for 1-click evaluation.
3. Click **Login as Alice**:
   - Stores the JWT token in browser `localStorage`.
   - Navigates to `/tasks`.
4. Refresh the page: the app **does not open the login page** because the token is verified in `localStorage`.
5. Click the **Logout** icon in the header:
   - Clears the token from `localStorage`.
   - Navigates back to `/login`.

### 3. Resource Linking & User Isolation [1p]
1. Log in as **Alice**:
   - Alice has **12 tasks**.
2. Log in (or open an Incognito tab) as **Bob**:
   - Bob has **5 tasks**.
   - Bob sees none of Alice's tasks, and Alice sees none of Bob's tasks.
3. Open two browser windows side-by-side (Alice in Window 1, Bob in Window 2):
   - When Alice creates or updates a task, **only Alice receives the WebSocket toast notification**. Bob's screen is untouched.

### 4. Online/Offline Behavior [2p]
1. In online mode, tap any task (e.g. *"Study for algorithms exam"*) and click **Mark as Completed**:
   - Sends a `PATCH` request to the REST service.
   - Saves to server and updates local cache.
2. Toggle network mode to **Offline** (click the green "Online" chip in header).
3. Tap the **FAB (+) button** at bottom right:
   - Create a task titled *"Offline Study Task"*.
   - A warning toast announces: *"Task created offline (saved locally)"*.
4. Notice on the main screen:
   - The top banner announces: *"1 item(s) pending sync"*.
   - The task card displays a prominent **"⚠️ Not Synced"** yellow badge.
5. Tap an existing task and toggle its status while offline:
   - Local state updates immediately, and the item is marked as **Not Synced**.

### 5. Automatic Sync When Entering Online Mode [1p]
1. Keep the offline tasks created in Step 4.
2. Toggle the network chip back to **Online** (or reconnect Wi-Fi):
   - The `SyncService` immediately detects network recovery.
   - Automatically executes `POST /api/tasks/sync`.
   - Displays a success toast: *"Synced X offline item(s) with server"*.
   - The "Not Synced" badges disappear, and data is permanently saved on the backend!

### 6. Pagination with Infinite Scrolling [2p]
1. Log in as **Alice** (who has 12 tasks) in online mode.
2. The initial list renders **5 items** (Page 1) with footer: *"Showing 5 of 12 tasks"*.
3. Scroll down to the bottom:
   - The `<ion-infinite-scroll>` spinner activates.
   - Loads Page 2 (items 6–10) and appends them (*"Showing 10 of 12 tasks"*).
4. Scroll down again:
   - Loads Page 3 (items 11–12).
   - Once all 12 items are loaded, the infinite scroll component is automatically disabled.

### 7. Search & Filter [1p]
1. In the searchbar, type `"exam"`:
   - The list filters down to matching tasks in real time.
2. Click the segment buttons under the searchbar:
   - Tap **"Pending"** $\rightarrow$ shows only pending tasks.
   - Tap **"Completed"** $\rightarrow$ shows only completed tasks.
   - Tap **"All"** $\rightarrow$ resets to all tasks.
3. Search and filtering work consistently in both online and offline modes.
