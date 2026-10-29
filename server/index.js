const express = require('express');
const cors = require('cors');
const http = require('http');
const { WebSocketServer } = require('ws');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- In-Memory Data Store ---
let nextId = 7;
const tasks = [
  {
    id: '1',
    title: 'Complete project proposal',
    description:
      'Write and submit the final project proposal document for the software engineering course. Include architecture diagrams and timeline.',
    status: 'completed',
    priority: 'high',
    dueDate: '2026-10-20T23:59:00.000Z',
    createdAt: '2026-10-01T10:00:00.000Z',
  },
  {
    id: '2',
    title: 'Study for algorithms exam',
    description:
      'Review sorting algorithms, graph traversal (BFS/DFS), and dynamic programming. Practice problems from chapters 5-8.',
    status: 'pending',
    priority: 'high',
    dueDate: '2026-10-25T09:00:00.000Z',
    createdAt: '2026-10-05T14:30:00.000Z',
  },
  {
    id: '3',
    title: 'Buy groceries',
    description:
      'Weekly grocery shopping: milk, bread, eggs, fruits, vegetables, and pasta.',
    status: 'pending',
    priority: 'low',
    dueDate: '2026-10-18T18:00:00.000Z',
    createdAt: '2026-10-15T08:00:00.000Z',
  },
  {
    id: '4',
    title: 'Fix login page bug',
    description:
      'The login form does not validate email format correctly. Add proper regex validation and display an error message.',
    status: 'pending',
    priority: 'medium',
    dueDate: '2026-10-22T17:00:00.000Z',
    createdAt: '2026-10-10T11:15:00.000Z',
  },
  {
    id: '5',
    title: 'Team meeting preparation',
    description:
      'Prepare slides for the weekly team standup. Summarize sprint progress and blockers.',
    status: 'completed',
    priority: 'medium',
    dueDate: '2026-10-16T14:00:00.000Z',
    createdAt: '2026-10-14T09:00:00.000Z',
  },
  {
    id: '6',
    title: 'Read research paper',
    description:
      'Read and annotate "Attention Is All You Need" paper for the machine learning seminar discussion.',
    status: 'pending',
    priority: 'medium',
    dueDate: '2026-10-28T12:00:00.000Z',
    createdAt: '2026-10-12T16:45:00.000Z',
  },
];

// --- Helper: find task by ID ---
function findTask(id) {
  return tasks.find((t) => t.id === id);
}

// --- Helper: broadcast to all WebSocket clients ---
function broadcast(data) {
  const message = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      // WebSocket.OPEN
      client.send(message);
    }
  });
}

// --- REST API ---

// GET /api/tasks — return all tasks
app.get('/api/tasks', (_req, res) => {
  res.json(tasks);
});

// GET /api/tasks/:id — return a single task
app.get('/api/tasks/:id', (req, res) => {
  const task = findTask(req.params.id);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  res.json(task);
});

// PATCH /api/tasks/:id — update a task
app.patch('/api/tasks/:id', (req, res) => {
  const task = findTask(req.params.id);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const allowedFields = ['title', 'description', 'status', 'priority', 'dueDate'];
  const updates = req.body;

  // Validate that only allowed fields are provided
  const invalidFields = Object.keys(updates).filter(
    (key) => !allowedFields.includes(key)
  );
  if (invalidFields.length > 0) {
    return res
      .status(400)
      .json({ error: `Invalid fields: ${invalidFields.join(', ')}` });
  }

  // Validate status
  if (updates.status && !['pending', 'completed'].includes(updates.status)) {
    return res
      .status(400)
      .json({ error: 'Status must be "pending" or "completed"' });
  }

  // Validate priority
  if (updates.priority && !['low', 'medium', 'high'].includes(updates.priority)) {
    return res
      .status(400)
      .json({ error: 'Priority must be "low", "medium", or "high"' });
  }

  // Apply updates
  Object.assign(task, updates);

  // Broadcast update via WebSocket
  broadcast({
    type: 'task.updated',
    payload: {
      taskId: task.id,
      title: task.title,
      status: task.status,
    },
    timestamp: new Date().toISOString(),
  });

  console.log(`Task ${task.id} updated:`, updates);
  res.json(task);
});

// POST /api/notifications/test — trigger a test notification
app.post('/api/notifications/test', (_req, res) => {
  const event = {
    type: 'notification.test',
    payload: {
      message: 'This is a test notification from the server',
    },
    timestamp: new Date().toISOString(),
  };

  broadcast(event);
  console.log('Test notification broadcasted');
  res.json({ message: 'Test notification sent to all connected clients' });
});

// --- Create HTTP Server ---
const server = http.createServer(app);

// --- WebSocket Server ---
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws, req) => {
  const clientIp = req.socket.remoteAddress;
  console.log(`WebSocket client connected from ${clientIp}`);

  // Send a welcome message
  ws.send(
    JSON.stringify({
      type: 'connection.established',
      payload: { message: 'Connected to Task Manager WebSocket server' },
      timestamp: new Date().toISOString(),
    })
  );

  ws.on('close', () => {
    console.log(`WebSocket client disconnected (${clientIp})`);
  });

  ws.on('error', (error) => {
    console.error(`WebSocket error from ${clientIp}:`, error.message);
  });
});

// --- Start Server ---
server.listen(PORT, () => {
  console.log(`\n  Task Manager Server is running!\n`);
  console.log(`  REST API: http://localhost:${PORT}/api`);
  console.log(`  WebSocket: ws://localhost:${PORT}/ws`);
  console.log(`\n  Endpoints:`);
  console.log(`    GET    /api/tasks          - List all tasks`);
  console.log(`    GET    /api/tasks/:id      - Get a single task`);
  console.log(`    PATCH  /api/tasks/:id      - Update a task`);
  console.log(`    POST   /api/notifications/test - Send test notification\n`);
});
