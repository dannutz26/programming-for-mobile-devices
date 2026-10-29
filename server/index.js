const express = require('express');
const cors = require('cors');
const http = require('http');
const { WebSocketServer } = require('ws');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'ionic2-super-secret-jwt-key-2026';

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- In-Memory Users ---
const users = [
  { username: 'alice', password: 'password' },
  { username: 'bob', password: 'password' },
];

// Helper to issue JWT
function generateToken(username) {
  return jwt.sign({ username }, JWT_SECRET, { expiresIn: '7d' });
}

// Authentication Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    req.user = decoded;
    next();
  });
}

// --- In-Memory Data Store ---
let nextId = 18;
const tasks = [
  // --- Alice's Tasks (12 tasks to test pagination: 5 per page = 3 pages) ---
  {
    id: '1',
    title: 'Complete project proposal',
    description: 'Write and submit the final project proposal document for the software engineering course. Include architecture diagrams and timeline.',
    status: 'completed',
    priority: 'high',
    dueDate: '2026-10-20T23:59:00.000Z',
    createdAt: '2026-10-01T10:00:00.000Z',
    userId: 'alice',
  },
  {
    id: '2',
    title: 'Study for algorithms exam',
    description: 'Review sorting algorithms, graph traversal (BFS/DFS), and dynamic programming. Practice problems from chapters 5-8.',
    status: 'pending',
    priority: 'high',
    dueDate: '2026-10-25T09:00:00.000Z',
    createdAt: '2026-10-05T14:30:00.000Z',
    userId: 'alice',
  },
  {
    id: '3',
    title: 'Buy groceries',
    description: 'Weekly grocery shopping: milk, bread, eggs, fruits, vegetables, and pasta.',
    status: 'pending',
    priority: 'low',
    dueDate: '2026-10-18T18:00:00.000Z',
    createdAt: '2026-10-15T08:00:00.000Z',
    userId: 'alice',
  },
  {
    id: '4',
    title: 'Fix login page bug',
    description: 'The login form does not validate email format correctly. Add proper regex validation and display an error message.',
    status: 'pending',
    priority: 'medium',
    dueDate: '2026-10-22T17:00:00.000Z',
    createdAt: '2026-10-10T11:15:00.000Z',
    userId: 'alice',
  },
  {
    id: '5',
    title: 'Team meeting preparation',
    description: 'Prepare slides for the weekly team standup. Summarize sprint progress and blockers.',
    status: 'completed',
    priority: 'medium',
    dueDate: '2026-10-16T14:00:00.000Z',
    createdAt: '2026-10-14T09:00:00.000Z',
    userId: 'alice',
  },
  {
    id: '6',
    title: 'Read research paper',
    description: 'Read and annotate "Attention Is All You Need" paper for the machine learning seminar discussion.',
    status: 'pending',
    priority: 'medium',
    dueDate: '2026-10-28T12:00:00.000Z',
    createdAt: '2026-10-12T16:45:00.000Z',
    userId: 'alice',
  },
  {
    id: '7',
    title: 'Configure CI/CD pipeline',
    description: 'Set up GitHub Actions to automatically run linting and unit tests on pull requests.',
    status: 'pending',
    priority: 'high',
    dueDate: '2026-10-29T16:00:00.000Z',
    createdAt: '2026-10-16T09:00:00.000Z',
    userId: 'alice',
  },
  {
    id: '8',
    title: 'Doctor appointment',
    description: 'Annual health checkup at the campus medical center.',
    status: 'completed',
    priority: 'low',
    dueDate: '2026-10-17T11:00:00.000Z',
    createdAt: '2026-10-10T15:00:00.000Z',
    userId: 'alice',
  },
  {
    id: '9',
    title: 'Database schema migration',
    description: 'Migrate PostgreSQL schema to support user organization multi-tenancy.',
    status: 'pending',
    priority: 'medium',
    dueDate: '2026-11-02T18:00:00.000Z',
    createdAt: '2026-10-18T13:20:00.000Z',
    userId: 'alice',
  },
  {
    id: '10',
    title: 'Refactor state management',
    description: 'Convert old reactive state services to modern Angular signals for better performance.',
    status: 'completed',
    priority: 'low',
    dueDate: '2026-10-24T14:00:00.000Z',
    createdAt: '2026-10-19T10:00:00.000Z',
    userId: 'alice',
  },
  {
    id: '11',
    title: 'Write unit tests for Auth',
    description: 'Reach at least 85% test coverage for authentication and token validation services.',
    status: 'pending',
    priority: 'high',
    dueDate: '2026-11-05T20:00:00.000Z',
    createdAt: '2026-10-21T08:30:00.000Z',
    userId: 'alice',
  },
  {
    id: '12',
    title: 'Submit scholarship report',
    description: 'Fill in academic progress report and submit to the faculty dean office.',
    status: 'pending',
    priority: 'medium',
    dueDate: '2026-11-10T12:00:00.000Z',
    createdAt: '2026-10-22T14:00:00.000Z',
    userId: 'alice',
  },

  // --- Bob's Tasks (5 tasks) ---
  {
    id: '13',
    title: 'Design app icon & splash screen',
    description: 'Create high-resolution vector assets for Android and iOS Capacitor builds.',
    status: 'pending',
    priority: 'medium',
    dueDate: '2026-10-25T15:00:00.000Z',
    createdAt: '2026-10-10T09:00:00.000Z',
    userId: 'bob',
  },
  {
    id: '14',
    title: 'Prepare demo presentation',
    description: 'Create 10 slide deck explaining Ionic 2 architecture and offline synchronization.',
    status: 'completed',
    priority: 'high',
    dueDate: '2026-10-27T17:00:00.000Z',
    createdAt: '2026-10-11T11:00:00.000Z',
    userId: 'bob',
  },
  {
    id: '15',
    title: 'Car maintenance',
    description: 'Schedule oil change and tire inspection.',
    status: 'pending',
    priority: 'low',
    dueDate: '2026-10-30T10:00:00.000Z',
    createdAt: '2026-10-15T16:00:00.000Z',
    userId: 'bob',
  },
  {
    id: '16',
    title: 'Review pull request #42',
    description: 'Review WebSocket reconnect backoff strategy implementation.',
    status: 'completed',
    priority: 'high',
    dueDate: '2026-10-22T12:00:00.000Z',
    createdAt: '2026-10-18T10:00:00.000Z',
    userId: 'bob',
  },
  {
    id: '17',
    title: 'Buy university textbooks',
    description: 'Purchase Distributed Systems 3rd edition by Tanenbaum.',
    status: 'pending',
    priority: 'medium',
    dueDate: '2026-11-01T18:00:00.000Z',
    createdAt: '2026-10-20T13:00:00.000Z',
    userId: 'bob',
  },
];

// --- Helper: broadcast to user-specific WebSocket clients ---
function broadcastToUser(userId, data) {
  const message = JSON.stringify(data);
  let count = 0;
  wss.clients.forEach((client) => {
    if (client.readyState === 1 && client.userId === userId) {
      client.send(message);
      count++;
    }
  });
  console.log(`[WS] Broadcasted event '${data.type}' to ${count} client(s) for user '${userId}'`);
}

// --- AUTH REST API ---

// POST /api/auth/login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  const user = users.find((u) => u.username.toLowerCase() === username.toLowerCase());
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const token = generateToken(user.username);
  console.log(`[AUTH] User '${user.username}' logged in successfully`);
  res.json({ token, user: { username: user.username } });
});

// POST /api/auth/register
app.post('/api/auth/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  const existing = users.find((u) => u.username.toLowerCase() === username.toLowerCase());
  if (existing) {
    return res.status(409).json({ error: 'Username already exists' });
  }

  const newUser = { username: username.trim(), password };
  users.push(newUser);

  const token = generateToken(newUser.username);
  console.log(`[AUTH] New user registered: '${newUser.username}'`);
  res.status(201).json({ token, user: { username: newUser.username } });
});

// GET /api/auth/me - Verify token
app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({ user: { username: req.user.username } });
});

// --- SECURED TASKS REST API ---

// GET /api/tasks — return paginated/filtered tasks belonging ONLY to authenticated user
app.get('/api/tasks', authenticateToken, (req, res) => {
  const currentUsername = req.user.username;
  let userTasks = tasks.filter((t) => t.userId === currentUsername);

  // Status filtering
  const status = req.query.status;
  if (status && status !== 'all') {
    userTasks = userTasks.filter((t) => t.status === status);
  }

  // Search filtering (title or description)
  const search = req.query.search;
  if (search && search.trim()) {
    const term = search.trim().toLowerCase();
    userTasks = userTasks.filter(
      (t) => t.title.toLowerCase().includes(term) || t.description.toLowerCase().includes(term)
    );
  }

  const total = userTasks.length;

  // Pagination support
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 5;

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedItems = userTasks.slice(startIndex, endIndex);
  const totalPages = Math.ceil(total / limit) || 1;

  res.json({
    tasks: paginatedItems,
    total,
    page,
    totalPages,
  });
});

// GET /api/tasks/:id — return a single task belonging to authenticated user
app.get('/api/tasks/:id', authenticateToken, (req, res) => {
  const currentUsername = req.user.username;
  const task = tasks.find((t) => t.id === req.params.id);

  if (!task || task.userId !== currentUsername) {
    return res.status(404).json({ error: 'Task not found' });
  }

  res.json(task);
});

// POST /api/tasks — create a new task linked to authenticated user
app.post('/api/tasks', authenticateToken, (req, res) => {
  const currentUsername = req.user.username;
  const { title, description, priority, dueDate, status, clientTempId } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Task title is required' });
  }

  const validPriority = ['low', 'medium', 'high'].includes(priority) ? priority : 'medium';
  const validStatus = ['pending', 'completed'].includes(status) ? status : 'pending';

  const newTask = {
    id: String(nextId++),
    title: title.trim(),
    description: description ? description.trim() : '',
    status: validStatus,
    priority: validPriority,
    dueDate: dueDate || new Date(Date.now() + 86400000 * 3).toISOString(),
    createdAt: new Date().toISOString(),
    userId: currentUsername,
  };

  tasks.unshift(newTask);

  // Broadcast to authenticated user ONLY
  broadcastToUser(currentUsername, {
    type: 'task.created',
    payload: {
      task: newTask,
      clientTempId: clientTempId || null,
    },
    timestamp: new Date().toISOString(),
  });

  console.log(`[TASKS] User '${currentUsername}' created task #${newTask.id}: "${newTask.title}"`);
  res.status(201).json(newTask);
});

// PATCH /api/tasks/:id — update a task belonging to authenticated user
app.patch('/api/tasks/:id', authenticateToken, (req, res) => {
  const currentUsername = req.user.username;
  const task = tasks.find((t) => t.id === req.params.id);

  if (!task || task.userId !== currentUsername) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const allowedFields = ['title', 'description', 'status', 'priority', 'dueDate'];
  const updates = req.body;

  const invalidFields = Object.keys(updates).filter(
    (key) => !allowedFields.includes(key) && key !== '_unsynced' && key !== '_isNewOffline'
  );
  if (invalidFields.length > 0) {
    return res.status(400).json({ error: `Invalid fields: ${invalidFields.join(', ')}` });
  }

  if (updates.status && !['pending', 'completed'].includes(updates.status)) {
    return res.status(400).json({ error: 'Status must be "pending" or "completed"' });
  }

  if (updates.priority && !['low', 'medium', 'high'].includes(updates.priority)) {
    return res.status(400).json({ error: 'Priority must be "low", "medium", or "high"' });
  }

  allowedFields.forEach((field) => {
    if (updates[field] !== undefined) {
      task[field] = updates[field];
    }
  });

  // Broadcast to authenticated user ONLY
  broadcastToUser(currentUsername, {
    type: 'task.updated',
    payload: {
      taskId: task.id,
      title: task.title,
      status: task.status,
      priority: task.priority,
      task,
    },
    timestamp: new Date().toISOString(),
  });

  console.log(`[TASKS] User '${currentUsername}' updated task #${task.id}`);
  res.json(task);
});

// POST /api/tasks/sync — batch synchronization for offline items
app.post('/api/tasks/sync', authenticateToken, (req, res) => {
  const currentUsername = req.user.username;
  const { created = [], updated = [] } = req.body;

  const syncedCreated = [];
  const syncedUpdated = [];

  // Process created items from offline
  created.forEach((item) => {
    const newTask = {
      id: String(nextId++),
      title: item.title,
      description: item.description || '',
      status: item.status || 'pending',
      priority: item.priority || 'medium',
      dueDate: item.dueDate || new Date().toISOString(),
      createdAt: item.createdAt || new Date().toISOString(),
      userId: currentUsername,
    };
    tasks.unshift(newTask);
    syncedCreated.push({ clientTempId: item.id, serverTask: newTask });
  });

  // Process updated items from offline
  updated.forEach((item) => {
    const existing = tasks.find((t) => t.id === item.id && t.userId === currentUsername);
    if (existing) {
      if (item.title !== undefined) existing.title = item.title;
      if (item.description !== undefined) existing.description = item.description;
      if (item.status !== undefined) existing.status = item.status;
      if (item.priority !== undefined) existing.priority = item.priority;
      if (item.dueDate !== undefined) existing.dueDate = item.dueDate;
      syncedUpdated.push(existing);
    }
  });

  // Broadcast to the user that synchronization completed
  if (syncedCreated.length > 0 || syncedUpdated.length > 0) {
    broadcastToUser(currentUsername, {
      type: 'sync.completed',
      payload: {
        createdCount: syncedCreated.length,
        updatedCount: syncedUpdated.length,
      },
      timestamp: new Date().toISOString(),
    });
  }

  console.log(`[SYNC] User '${currentUsername}' synced: ${syncedCreated.length} created, ${syncedUpdated.length} updated`);
  res.json({ syncedCreated, syncedUpdated });
});

// POST /api/notifications/test — trigger a test notification for the authenticated user
app.post('/api/notifications/test', authenticateToken, (req, res) => {
  const currentUsername = req.user.username;
  const event = {
    type: 'notification.test',
    payload: {
      message: `Test notification for ${currentUsername} at ${new Date().toLocaleTimeString()}`,
      userId: currentUsername,
    },
    timestamp: new Date().toISOString(),
  };

  broadcastToUser(currentUsername, event);
  console.log(`[WS] Test notification broadcasted for user '${currentUsername}'`);
  res.json({ message: `Test notification sent to connected client(s) for user ${currentUsername}` });
});

// --- Create HTTP Server ---
const server = http.createServer(app);

// --- SECURED WebSocket Server ---
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws, req) => {
  const clientIp = req.socket.remoteAddress;

  // Extract token from URL query string: /ws?token=...
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const token = url.searchParams.get('token');

  if (!token) {
    console.log(`[WS] Connection rejected from ${clientIp}: Missing JWT token`);
    ws.send(JSON.stringify({ type: 'error', payload: { message: 'Authentication token required' } }));
    ws.close(4001, 'Unauthorized');
    return;
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      console.log(`[WS] Connection rejected from ${clientIp}: Invalid JWT token`);
      ws.send(JSON.stringify({ type: 'error', payload: { message: 'Invalid or expired token' } }));
      ws.close(4001, 'Unauthorized');
      return;
    }

    ws.userId = decoded.username;
    console.log(`[WS] Authenticated WebSocket connected for user '${ws.userId}' from ${clientIp}`);

    ws.send(
      JSON.stringify({
        type: 'connection.established',
        payload: { message: `Secure WebSocket connected as ${ws.userId}` },
        timestamp: new Date().toISOString(),
      })
    );
  });

  ws.on('close', () => {
    console.log(`[WS] Client disconnected (${ws.userId || clientIp})`);
  });

  ws.on('error', (error) => {
    console.error(`[WS] Error from ${ws.userId || clientIp}:`, error.message);
  });
});

// --- Start Server ---
server.listen(PORT, () => {
  console.log(`\n  ======================================================`);
  console.log(`  🚀 Ionic2 Task Manager Server Running on port ${PORT}!`);
  console.log(`  ======================================================`);
  console.log(`  REST API:   http://localhost:${PORT}/api`);
  console.log(`  WebSocket:  ws://localhost:${PORT}/ws`);
  console.log(`\n  Pre-seeded users:`);
  console.log(`    - alice / password  (12 tasks - test pagination)`);
  console.log(`    - bob   / password  (5 tasks)`);
  console.log(`\n  Endpoints:`);
  console.log(`    POST   /api/auth/login        - Authenticate and get JWT`);
  console.log(`    POST   /api/auth/register     - Register new user`);
  console.log(`    GET    /api/auth/me           - Verify current token`);
  console.log(`    GET    /api/tasks             - List user tasks (supports ?page=&limit=&status=&search=)`);
  console.log(`    POST   /api/tasks             - Create user task`);
  console.log(`    GET    /api/tasks/:id         - Get user task`);
  console.log(`    PATCH  /api/tasks/:id         - Update user task`);
  console.log(`    POST   /api/tasks/sync        - Synchronize offline items`);
  console.log(`    POST   /api/notifications/test- Send test notification\n`);
});
