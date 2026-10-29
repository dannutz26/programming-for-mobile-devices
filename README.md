# Task Manager — Ionic/Angular Application

A responsive task management application built with **Ionic 9** and **Angular 22** (frontend) and **Node.js/Express** (backend). This project demonstrates master-detail navigation, REST API integration, and real-time WebSocket notifications.

## Features

1. **Master-Detail UI** — A task list (master view) with search, filtering, and navigation to individual task details (detail view).
2. **REST API** — An Express backend serves task data via RESTful endpoints. The frontend fetches, displays, and updates tasks through HTTP requests.
3. **WebSocket Notifications** — The backend broadcasts real-time events via WebSocket when tasks are updated. The frontend displays toast notifications upon receiving events.
4. **Responsive Design** — Built with Ionic components for a polished, mobile-first experience that works on all screen sizes.

## Technology Stack

| Layer    | Technology                                |
|----------|-------------------------------------------|
| Frontend | Ionic 9, Angular 22, TypeScript 6, SCSS   |
| Backend  | Node.js, Express 4, ws 8                  |
| Build    | Angular CLI, Capacitor                    |
| Package  | npm                                       |

## Project Structure

```
ionic1/
├── src/                          # Frontend source code
│   ├── app/
│   │   ├── models/
│   │   │   └── task.model.ts     # Task and WebSocketEvent interfaces
│   │   ├── services/
│   │   │   ├── task.service.ts   # HTTP requests to REST API
│   │   │   └── notification.service.ts  # WebSocket connection
│   │   ├── tasks/
│   │   │   ├── task-list/        # Master view (list page)
│   │   │   │   ├── task-list.page.ts
│   │   │   │   ├── task-list.page.html
│   │   │   │   └── task-list.page.scss
│   │   │   └── task-detail/      # Detail view (detail page)
│   │   │       ├── task-detail.page.ts
│   │   │       ├── task-detail.page.html
│   │   │       └── task-detail.page.scss
│   │   ├── app.component.ts
│   │   └── app.routes.ts         # Angular routing configuration
│   ├── environments/
│   │   ├── environment.ts        # Dev config (API/WS URLs)
│   │   └── environment.prod.ts   # Prod config
│   └── main.ts                   # Bootstrap with HttpClient provider
├── server/                       # Backend source code
│   ├── index.js                  # Express + WebSocket server
│   ├── package.json              # Server dependencies
│   └── test-api.js               # API test script
├── package.json                  # Frontend dependencies + scripts
├── angular.json                  # Angular CLI configuration
└── README.md                     # This file
```

## Prerequisites

- **Node.js** >= 22.22 (for the Angular CLI; the backend works with any recent Node.js)
- **npm** >= 10

## Installation

```bash
# 1. Install frontend dependencies
npm install

# 2. Install backend dependencies
cd server
npm install
cd ..
```

## Starting the Application

You need **two terminals** — one for the backend and one for the frontend.

### Terminal 1 — Backend Server

```bash
cd server
node index.js
```

The server starts on **http://localhost:3000** and prints the available endpoints.

### Terminal 2 — Frontend

```bash
npm start
# or equivalently: npx ng serve
```

The frontend starts on **http://localhost:8100** (default Ionic dev server port).

> **Important:** Start the backend first. The frontend expects the API at `http://localhost:3000/api`.

## REST API Documentation

Base URL: `http://localhost:3000/api`

### GET /api/tasks

Returns all tasks.

**Response** `200 OK`:
```json
[
  {
    "id": "1",
    "title": "Complete project proposal",
    "description": "Write and submit the final project proposal...",
    "status": "completed",
    "priority": "high",
    "dueDate": "2026-10-20T23:59:00.000Z",
    "createdAt": "2026-10-01T10:00:00.000Z"
  }
]
```

### GET /api/tasks/:id

Returns a single task by ID.

**Response** `200 OK`:
```json
{
  "id": "2",
  "title": "Study for algorithms exam",
  "description": "Review sorting algorithms...",
  "status": "pending",
  "priority": "high",
  "dueDate": "2026-10-25T09:00:00.000Z",
  "createdAt": "2026-10-05T14:30:00.000Z"
}
```

**Response** `404 Not Found`:
```json
{ "error": "Task not found" }
```

### PATCH /api/tasks/:id

Updates a task. Allowed fields: `title`, `description`, `status`, `priority`, `dueDate`.

**Request**:
```json
{ "status": "completed" }
```

**Response** `200 OK`: Returns the updated task object.

**Response** `400 Bad Request`:
```json
{ "error": "Status must be \"pending\" or \"completed\"" }
```

**Response** `404 Not Found`:
```json
{ "error": "Task not found" }
```

When a task is updated, the server broadcasts a `task.updated` WebSocket event to all connected clients.

### POST /api/notifications/test

Triggers a test notification broadcast to all WebSocket clients.

**Response** `200 OK`:
```json
{ "message": "Test notification sent to all connected clients" }
```

## WebSocket Connection

**URL:** `ws://localhost:3000/ws`

The frontend connects to the WebSocket server when the task list page is active. The connection is closed when navigating away and re-established when returning.

### Event Format

All WebSocket messages are JSON objects with the following structure:

```json
{
  "type": "event.type",
  "payload": { ... },
  "timestamp": "2026-10-16T07:00:00.000Z"
}
```

### Event Types

| Type                     | Description                      | Payload                                      |
|--------------------------|----------------------------------|-----------------------------------------------|
| `connection.established` | Sent when the client connects    | `{ "message": "Connected to..." }`           |
| `task.updated`           | Sent when a task is updated      | `{ "taskId": "1", "title": "...", "status": "completed" }` |
| `notification.test`      | Sent from the test endpoint      | `{ "message": "This is a test notification..." }` |

### Reconnection

If the WebSocket connection drops, the client automatically attempts to reconnect after 5 seconds. Reconnection stops when the user navigates away from the task list.

## Testing the Assignment Requirements

### 1. Master-Detail UI

1. Open the app at `http://localhost:8100`
2. The **task list** loads showing all tasks with title, status icon, priority badge, and due date
3. Use the **search bar** to filter tasks by title
4. Use the **segment control** (All / Pending / Completed) to filter by status
5. Tap any task to open the **detail view** with full task information
6. Use the back button to return to the list

### 2. REST Service

1. The task list fetches data from `GET /api/tasks`
2. The detail page fetches a single task from `GET /api/tasks/:id`
3. Toggling task status sends `PATCH /api/tasks/:id` to the backend
4. Loading spinners show during requests; errors display with a retry button

### 3. WebSocket Notifications

1. Open the app — the WebSocket connection is established automatically
2. In a separate terminal, send a test notification:
   ```bash
   curl -X POST http://localhost:3000/api/notifications/test
   ```
3. A toast notification appears at the top of the app
4. Alternatively, mark a task as completed/pending — a WebSocket notification toast appears

### 4. Test Notification Verification

```bash
# Run the API test suite
cd server
node test-api.js
```

This script tests all REST endpoints including the test notification trigger.

## Configuration

Backend and WebSocket URLs are configured in:
- `src/environments/environment.ts` (development)
- `src/environments/environment.prod.ts` (production)

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  wsUrl: 'ws://localhost:3000/ws',
};
```

The backend server port defaults to `3000` and can be changed via the `PORT` environment variable.

## Initial Task Data

The backend starts with 6 example tasks covering various statuses and priorities:

| ID | Title                       | Status    | Priority |
|----|-----------------------------|-----------|----------|
| 1  | Complete project proposal   | completed | high     |
| 2  | Study for algorithms exam   | pending   | high     |
| 3  | Buy groceries               | pending   | low      |
| 4  | Fix login page bug          | pending   | medium   |
| 5  | Team meeting preparation    | completed | medium   |
| 6  | Read research paper         | pending   | medium   |

Data is stored in-memory and resets when the server restarts.
