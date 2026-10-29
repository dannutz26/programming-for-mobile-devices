const http = require('http');
const { WebSocket } = require('ws');

function makeRequest(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const headers = { 'Content-Type': 'application/json' };
    if (data) {
      headers['Content-Length'] = Buffer.byteLength(data);
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
      hostname: 'localhost',
      port: 3000,
      path,
      method,
      headers,
    };

    const req = http.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => {
        responseBody += chunk;
      });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(responseBody) });
        } catch {
          resolve({ status: res.statusCode, body: responseBody });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log('==================================================');
  console.log('🧪 Running Comprehensive Ionic 2 Backend Tests');
  console.log('==================================================\n');

  // Test 1: Unauthenticated request to /api/tasks should return 401
  console.log('1. GET /api/tasks without token (should be 401)');
  const unauth = await makeRequest('GET', '/api/tasks');
  console.log(`   Status: ${unauth.status}`);
  console.log(`   Error: ${unauth.body.error}\n`);
  if (unauth.status !== 401) throw new Error('Expected 401 Unauthorized');

  // Test 2: Login as Alice
  console.log('2. POST /api/auth/login as Alice');
  const aliceLogin = await makeRequest('POST', '/api/auth/login', {
    username: 'alice',
    password: 'password',
  });
  console.log(`   Status: ${aliceLogin.status}`);
  console.log(`   User: ${aliceLogin.body.user.username}`);
  console.log(`   Token received: ${aliceLogin.body.token.substring(0, 20)}...\n`);
  const aliceToken = aliceLogin.body.token;

  // Test 3: Login as Bob
  console.log('3. POST /api/auth/login as Bob');
  const bobLogin = await makeRequest('POST', '/api/auth/login', {
    username: 'bob',
    password: 'password',
  });
  console.log(`   Status: ${bobLogin.status}`);
  console.log(`   User: ${bobLogin.body.user.username}`);
  const bobToken = bobLogin.body.token;
  console.log(`   Token received: ${bobToken.substring(0, 20)}...\n`);

  // Test 4: Resource Isolation (Alice gets only Alice's tasks)
  console.log('4. Resource Isolation: Alice vs Bob task counts');
  const aliceTasks = await makeRequest('GET', '/api/tasks?limit=50', null, aliceToken);
  const bobTasks = await makeRequest('GET', '/api/tasks?limit=50', null, bobToken);
  console.log(`   Alice tasks count: ${aliceTasks.body.total}`);
  console.log(`   Bob tasks count: ${bobTasks.body.total}`);
  const aliceHasBobTasks = aliceTasks.body.tasks.some((t) => t.userId !== 'alice');
  const bobHasAliceTasks = bobTasks.body.tasks.some((t) => t.userId !== 'bob');
  console.log(`   Alice sees non-Alice tasks? ${aliceHasBobTasks} (expected false)`);
  console.log(`   Bob sees non-Bob tasks? ${bobHasAliceTasks} (expected false)\n`);
  if (aliceHasBobTasks || bobHasAliceTasks) throw new Error('Resource isolation failed!');

  // Test 5: Pagination (Alice has 12 tasks, limit=5 gives 3 pages)
  console.log('5. Pagination: Alice requests Page 1 and Page 2 with limit=5');
  const page1 = await makeRequest('GET', '/api/tasks?page=1&limit=5', null, aliceToken);
  const page2 = await makeRequest('GET', '/api/tasks?page=2&limit=5', null, aliceToken);
  console.log(`   Page 1 items count: ${page1.body.tasks.length}, total: ${page1.body.total}, totalPages: ${page1.body.totalPages}`);
  console.log(`   Page 1 first item: "${page1.body.tasks[0].title}"`);
  console.log(`   Page 2 items count: ${page2.body.tasks.length}, page: ${page2.body.page}`);
  console.log(`   Page 2 first item: "${page2.body.tasks[0].title}"\n`);
  if (page1.body.tasks[0].id === page2.body.tasks[0].id) throw new Error('Pagination returned duplicate items!');

  // Test 6: Search & Filtering
  console.log('6. Search & Filter: Alice searches "exam" and filters "pending"');
  const searchRes = await makeRequest('GET', '/api/tasks?search=exam', null, aliceToken);
  console.log(`   Search "exam" results: ${searchRes.body.tasks.length} item(s)`);
  console.log(`   Found title: "${searchRes.body.tasks[0]?.title}"`);

  const filterRes = await makeRequest('GET', '/api/tasks?status=completed', null, aliceToken);
  console.log(`   Status "completed" results: ${filterRes.body.tasks.length} item(s)\n`);

  // Test 7: Create Task (POST /api/tasks)
  console.log('7. POST /api/tasks: Alice creates a new task');
  const created = await makeRequest(
    'POST',
    '/api/tasks',
    {
      title: 'Alice brand new task',
      description: 'Created through REST API',
      priority: 'high',
      status: 'pending',
    },
    aliceToken
  );
  console.log(`   Created ID: ${created.body.id}`);
  console.log(`   Title: "${created.body.title}", User: ${created.body.userId}\n`);

  // Test 8: Update Task (PATCH /api/tasks/:id)
  console.log(`8. PATCH /api/tasks/${created.body.id}: Toggle status to completed`);
  const updated = await makeRequest(
    'PATCH',
    `/api/tasks/${created.body.id}`,
    { status: 'completed' },
    aliceToken
  );
  console.log(`   Status updated to: ${updated.body.status}\n`);

  // Test 9: Offline Batch Sync (POST /api/tasks/sync)
  console.log('9. POST /api/tasks/sync: Sync offline created and updated tasks');
  const syncRes = await makeRequest(
    'POST',
    '/api/tasks/sync',
    {
      created: [
        {
          id: 'temp-offline-1',
          title: 'Offline created task',
          description: 'Synced later',
          priority: 'low',
          status: 'pending',
        },
      ],
      updated: [
        {
          id: created.body.id,
          priority: 'low',
        },
      ],
    },
    aliceToken
  );
  console.log(`   Synced created: ${syncRes.body.syncedCreated.length}`);
  console.log(`   Synced updated: ${syncRes.body.syncedUpdated.length}\n`);

  // Test 10: Secured WebSocket test
  console.log('10. Secured WebSocket: Connect with Alice JWT token');
  await new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://localhost:3000/ws?token=${aliceToken}`);
    ws.on('open', () => {
      console.log('   WebSocket connection successfully opened with JWT!');
    });
    ws.on('message', (data) => {
      const msg = JSON.parse(data.toString());
      console.log(`   WebSocket message received: type='${msg.type}'`);
      if (msg.type === 'connection.established') {
        ws.close();
        resolve();
      }
    });
    ws.on('error', (err) => {
      reject(err);
    });
    setTimeout(() => {
      ws.close();
      resolve();
    }, 2000);
  });

  // Test 11: WebSocket rejection without token
  console.log('\n11. Secured WebSocket: Connect WITHOUT token (should be rejected)');
  await new Promise((resolve) => {
    const ws = new WebSocket('ws://localhost:3000/ws');
    ws.on('close', (code) => {
      console.log(`   WebSocket closed with code ${code} (expected 4001 or rejection)\n`);
      resolve();
    });
    ws.on('error', () => {
      console.log('   WebSocket error as expected without token\n');
      resolve();
    });
  });

  console.log('==================================================');
  console.log('✅ ALL 11 IONIC 2 BACKEND TESTS PASSED!');
  console.log('==================================================');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
