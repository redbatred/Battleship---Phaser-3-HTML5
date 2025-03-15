/**
 * This script checks for TypeScript errors in the project.
 * Run with: node scripts/check-ts.js
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('Checking for TypeScript errors...');

// Run TypeScript compiler in noEmit mode
const tsc = spawn('npx', ['tsc', '--noEmit'], {
    stdio: 'inherit',
    shell: true,
    cwd: path.join(__dirname, '..')
});

tsc.on('error', (error) => {
    console.error('Failed to run TypeScript compiler:', error);
});

tsc.on('close', (code) => {
    if (code === 0) {
        console.log('No TypeScript errors found!');
    } else {
        console.error('TypeScript errors found. Please fix them before continuing.');
    }
}); 