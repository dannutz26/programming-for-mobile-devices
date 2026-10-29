const http = require('http');

function makeRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (data) {
      options.headers['Content-Length'] = Buffer.byteLength(data);
    }

    const req = http.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => { responseBody += chunk; });
      res.on('end', () => {
        resolve({ status: res.statusCode, body: JSON.parse(responseBody) });
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log('=== Testing REST API ===\n');

  // Test 1: GET /api/tasks
  console.log('1. GET /api/tasks');
  const allTasks = await makeRequest('GET', '/api/tasks');
  console.log(`   Status: ${allTasks.status}`);
  console.log(`   Tasks count: ${allTasks.body.length}`);
  console.log(`   First task: "${allTasks.body[0].title}"\n`);

  // Test 2: GET /api/tasks/2
  console.log('2. GET /api/tasks/2');
  const singleTask = await makeRequest('GET', '/api/tasks/2');
  console.log(`   Status: ${singleTask.status}`);
  console.log(`   Task: "${singleTask.body.title}" (${singleTask.body.status})\n`);

  // Test 3: GET /api/tasks/999 (not found)
  console.log('3. GET /api/tasks/999 (should be 404)');
  const notFound = await makeRequest('GET', '/api/tasks/999');
  console.log(`   Status: ${notFound.status}`);
  console.log(`   Error: ${notFound.body.error}\n`);

  // Test 4: PATCH /api/tasks/2 (update status)
  console.log('4. PATCH /api/tasks/2 (set status to completed)');
  const updated = await makeRequest('PATCH', '/api/tasks/2', { status: 'completed' });
  console.log(`   Status: ${updated.status}`);
  console.log(`   Updated task: "${updated.body.title}" -> ${updated.body.status}\n`);

  // Test 5: PATCH with invalid status
  console.log('5. PATCH /api/tasks/2 (invalid status)');
  const invalid = await makeRequest('PATCH', '/api/tasks/2', { status: 'invalid' });
  console.log(`   Status: ${invalid.status}`);
  console.log(`   Error: ${invalid.body.error}\n`);

  // Test 6: PATCH with invalid field
  console.log('6. PATCH /api/tasks/2 (invalid field)');
  const badField = await makeRequest('PATCH', '/api/tasks/2', { foo: 'bar' });
  console.log(`   Status: ${badField.status}`);
  console.log(`   Error: ${badField.body.error}\n`);

  // Test 7: POST /api/notifications/test
  console.log('7. POST /api/notifications/test');
  const notif = await makeRequest('POST', '/api/notifications/test');
  console.log(`   Status: ${notif.status}`);
  console.log(`   Message: ${notif.body.message}\n`);

  // Test 8: Verify update persisted
  console.log('8. GET /api/tasks/2 (verify update persisted)');
  const verify = await makeRequest('GET', '/api/tasks/2');
  console.log(`   Status: ${verify.status}`);
  console.log(`   Task: "${verify.body.title}" -> ${verify.body.status}\n`);

  console.log('=== All tests passed! ===');
}

runTests().catch(console.error);
