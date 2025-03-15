const fs = require('fs');
const path = require('path');

// Define source and destination directories
const srcDir = path.join(__dirname, '../src/assets');
const distDir = path.join(__dirname, '../dist/assets');

// Ensure the destination directory exists
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
}

// Function to copy a file
function copyFile(src, dest) {
    fs.copyFileSync(src, dest);
    console.log(`Copied: ${path.relative(__dirname, src)} -> ${path.relative(__dirname, dest)}`);
}

// Function to copy a directory recursively
function copyDir(src, dest) {
    // Create destination directory if it doesn't exist
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    
    // Get all files and directories in the source directory
    const entries = fs.readdirSync(src, { withFileTypes: true });
    
    // Process each entry
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        
        if (entry.isDirectory()) {
            // Recursively copy subdirectories
            copyDir(srcPath, destPath);
        } else {
            // Copy files
            copyFile(srcPath, destPath);
        }
    }
}

// Start copying
console.log('Copying assets to dist folder...');
copyDir(srcDir, distDir);
console.log('Assets copied successfully!'); 