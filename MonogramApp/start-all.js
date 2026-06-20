const { spawn } = require('child_process');

console.log('Starting Monogram Messenger...\n');

let backend, frontend, tunnel;

function startBackend() {
  backend = spawn('python', ['main.py'], {
    cwd: './backend',
    stdio: 'inherit',
    shell: true
  });
  backend.on('error', (err) => {
    console.error('Backend failed to start:', err.message);
  });
}

function startFrontend() {
  frontend = spawn('npm', ['run', 'dev'], {
    cwd: './frontend',
    stdio: 'inherit',
    shell: true
  });
  frontend.on('error', (err) => {
    console.error('Frontend failed to start:', err.message);
  });
}

function startTunnel() {
  const tunnelToken = process.env.TUNNEL_TOKEN;
  if (!tunnelToken) return;
  
  tunnel = spawn('npx', [
    'start-tunyl@latest',
    '--token', tunnelToken,
    '--port', '5173'
  ], {
    stdio: 'inherit',
    shell: true
  });
  tunnel.on('error', (err) => {
    console.error('Tunnel failed to start:', err.message);
  });
}

startBackend();
startFrontend();

setTimeout(startTunnel, 5000);

function cleanup() {
  if (tunnel) tunnel.kill();
  if (frontend) frontend.kill();
  if (backend) backend.kill();
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
