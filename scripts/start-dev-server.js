/**
 * This script starts the development server after ensuring no other server is running on port 8080.
 * Run with: node scripts/start-dev-server.js
 */

const { exec, spawn } = require('child_process');
const path = require('path');

const PORT = 8080;

console.log('Starting development server...');
console.log('First, checking if port 8080 is in use...');

// Function to kill any process using port 8080
function killProcessOnPort(port, callback) {
  // Windows command to find and kill the process using port 8080
  const command = `for /f "tokens=5" %a in ('netstat -aon ^| find ":${port}" ^| find "LISTENING"') do taskkill /F /PID %a`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.log(`No process found using port ${port} or could not be killed.`);
      // Continue anyway, as the error might just be that no process was found
    } else {
      console.log(`Process using port ${port} has been terminated.`);
    }
    callback();
  });
}

// Function to start the webpack dev server
function startDevServer() {
  console.log('Starting webpack development server...');
  
  // Run webpack-dev-server with auto port selection
  const webpackDevServer = spawn('npx', ['webpack', 'serve', '--open'], {
    stdio: 'inherit',
    shell: true,
    cwd: path.join(__dirname, '..')
  });

  webpackDevServer.on('error', (error) => {
    console.error('Failed to start development server:', error);
  });

  // Handle process termination
  process.on('SIGINT', () => {
    console.log('Stopping development server...');
    webpackDevServer.kill();
    process.exit();
  });
}

// First kill any existing process, then start the server
killProcessOnPort(PORT, startDevServer); 