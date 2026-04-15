const { spawn } = require('child_process');
const path = require('path');

const isWin = process.platform === 'win32';
const projectRoot = path.resolve(__dirname, '..');

console.log('');
console.log('='.repeat(60));
console.log('  PPOPLINK Dev Server');
console.log('  Backend : http://localhost:8005/api/docs');
console.log('  Frontend: http://localhost:3000');
console.log('='.repeat(60));
console.log('');

const backend = spawn(
  isWin ? 'python' : 'python3',
  ['run.py'],
  {
    cwd: projectRoot,
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, PYTHONUNBUFFERED: '1' },
  }
);

const frontend = spawn(
  'npm',
  ['run', 'dev'],
  {
    cwd: path.join(projectRoot, 'web'),
    stdio: 'inherit',
    shell: true,
  }
);

function cleanup() {
  backend.kill();
  frontend.kill();
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

backend.on('exit', (code) => {
  if (code !== null && code !== 0) {
    console.error(`\n[Backend] exited with code ${code}`);
  }
});

frontend.on('exit', (code) => {
  if (code !== null && code !== 0) {
    console.error(`\n[Frontend] exited with code ${code}`);
  }
});
