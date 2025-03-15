/**
 * This script creates placeholder assets for development.
 * Run with: node scripts/create-placeholder-assets.js
 */

const fs = require('fs');
const path = require('path');

// Ensure directories exist
const imagesDir = path.join(__dirname, '../src/assets/images');
const audioDir = path.join(__dirname, '../src/assets/audio');

if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
}

if (!fs.existsSync(audioDir)) {
    fs.mkdirSync(audioDir, { recursive: true });
}

// Create placeholder SVG images
const createSvgImage = (filename, width, height, color) => {
    const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${width}" height="${height}" fill="${color}" />
    <text x="${width/2}" y="${height/2}" font-family="Arial" font-size="16" fill="white" text-anchor="middle" dominant-baseline="middle">${filename}</text>
</svg>`;
    
    fs.writeFileSync(path.join(imagesDir, `${filename}.svg`), svg);
    console.log(`Created ${filename}.svg`);
};

// Create placeholder images
createSvgImage('loading-background', 800, 600, '#333333');
createSvgImage('loading-bar', 400, 40, '#4a6ea9');
createSvgImage('button', 200, 60, '#4a6ea9');
createSvgImage('button-over', 200, 60, '#2a4e89');
createSvgImage('logo', 400, 200, '#0c4076');
createSvgImage('water', 800, 600, '#0c4076');
createSvgImage('grid', 400, 400, '#1a5086');
createSvgImage('ship-part', 40, 40, '#555555');
createSvgImage('hit', 40, 40, '#ff0000');
createSvgImage('miss', 40, 40, '#ffffff');

console.log('Placeholder images created successfully!');
console.log('Note: For audio files, you will need to obtain actual audio files.');
console.log('You can find free sound effects at freesound.org or similar sites.'); 