const { spawn } = require('child_process');
const net = require('net');
const path = require('path');

function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(true));
    server.once('listening', () => {
      server.close(() => resolve(false));
    });
    server.listen(port, '127.0.0.1');
  });
}

async function getAvailablePort(startPort) {
  let port = startPort;
  for (let attempt = 0; attempt < 10; attempt += 1) {
    if (!(await isPortInUse(port))) return port;
    port += 1;
  }
  return startPort;
}

async function main() {
  const requestedPort = Number(process.env.PORT || '5000');
  const port = await getAvailablePort(requestedPort);

  if (port !== requestedPort) {
    console.log(`Port ${requestedPort} is busy; using ${port} instead.`);
  }

  const child = spawn(process.execPath, ['src/app.js'], {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
    env: { ...process.env, PORT: String(port) }
  });

  child.on('exit', (code) => process.exit(code ?? 0));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
