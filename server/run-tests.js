const { spawn } = require('child_process');
const path = require('path');

const server = spawn('node', [path.join(__dirname, 'index.js')], {
  stdio: 'inherit',
});

// Wait 2.5s for server to start, then run tests
setTimeout(() => {
  const tests = spawn('node', [path.join(__dirname, 'test-api.js')], {
    stdio: 'inherit',
  });

  tests.on('exit', (code) => {
    server.kill();
    process.exit(code);
  });
}, 1500);
