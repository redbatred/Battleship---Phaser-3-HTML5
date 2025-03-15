/**
 * This script starts the development server.
 * Run with: node scripts/start-dev.js
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('Starting development server...');

// Run webpack-dev-server
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