import { spawn } from 'child_process';

const PORT = 5173;

// Запускаем Vite
const vite = spawn('npx', ['vite', '--port', String(PORT), '--host', '0.0.0.0'], {
  stdio: 'inherit',
  shell: true
});

// Ждём и запускаем туннель
setTimeout(() => {
  const tunyl = spawn('npx', [
    'start-tunyl@latest',
    '--token', '7OQa8Nk1L8l7tmJWEmv3huuIJl1RbOVloE1uFsUowIK9RbDENFO7QTZ9M1f1',
    '--port', String(PORT)
  ], {
    stdio: 'inherit',
    shell: true
  });
  
  process.on('SIGINT', () => {
    tunyl.kill();
    vite.kill();
    process.exit();
  });
}, 3000);

// start-with-tunnel.js
let tunyl = null;

function startTunnel() {
    if (tunyl) tunyl.kill();
    tunyl = spawn('npx', [
        'start-tunyl@latest',
        '--token', '7OQa8Nk1L8l7tmJWEmv3huuIJl1RbOVloE1uFsUowIK9RbDENFO7QTZ9M1f1',
        '--port', String(PORT)
    ], { stdio: 'inherit', shell: true });
    
    tunyl.on('close', (code) => {
        if (code !== 0) {
            console.log('Туннель упал, перезапуск через 5 секунд...');
            setTimeout(startTunnel, 5000);
        }
    });
}

setTimeout(startTunnel, 3000);