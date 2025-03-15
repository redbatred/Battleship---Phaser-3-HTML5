/**
 * This script kills any process using port 8080.
 * Run with: node scripts/kill-server.js
 */

const { exec } = require('child_process');

const PORT = 8080;

console.log(`Attempting to kill process using port ${PORT}...`);

// Windows command to find and kill the process using port 8080
const command = `for /f "tokens=5" %a in ('netstat -aon ^| find ":${PORT}" ^| find "LISTENING"') do taskkill /F /PID %a`;

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`stderr: ${stderr}`);
    return;
  }
  console.log(`stdout: ${stdout}`);
  console.log(`Process using port ${PORT} has been terminated.`);
}); 