const fs = require('fs');
const path = require('path');

// Ensure the assets directories exist
const imagesDir = path.join(__dirname, '../src/assets/images');
if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
}

// Create a simple SVG for buttons and UI elements
function createSvg(filename, content) {
    const filePath = path.join(imagesDir, filename);
    fs.writeFileSync(filePath, content);
    console.log(`Created ${filePath}`);
}

// Create a simple PNG placeholder
function createPng(filename, width, height, color) {
    // Create a simple SVG that will be used as a placeholder
    // In a real project, you'd use a library like sharp or canvas to create actual PNGs
    const svgContent = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${width}" height="${height}" fill="${color}" />
        <text x="50%" y="50%" font-family="Arial" font-size="14" fill="white" text-anchor="middle" dominant-baseline="middle">
            ${filename}
        </text>
    </svg>`;
    
    const filePath = path.join(imagesDir, filename);
    fs.writeFileSync(filePath, svgContent);
    console.log(`Created ${filePath}`);
}

// Create UI elements
createSvg('button.svg', `<svg width="200" height="50" xmlns="http://www.w3.org/2000/svg">
    <rect width="200" height="50" rx="10" fill="#4a6ea9" />
    <text x="100" y="30" font-family="Arial" font-size="16" fill="white" text-anchor="middle">Button</text>
</svg>`);

createSvg('button-over.svg', `<svg width="200" height="50" xmlns="http://www.w3.org/2000/svg">
    <rect width="200" height="50" rx="10" fill="#6989c6" />
    <text x="100" y="30" font-family="Arial" font-size="16" fill="white" text-anchor="middle">Button</text>
</svg>`);

createSvg('logo.svg', `<svg width="300" height="100" xmlns="http://www.w3.org/2000/svg">
    <text x="150" y="60" font-family="Arial" font-size="32" fill="#ffffff" text-anchor="middle">BATTLESHIP</text>
</svg>`);

// Create game elements
createSvg('water.svg', `<svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
    <rect width="40" height="40" fill="#0077be" />
    <path d="M0,20 Q10,15 20,20 Q30,25 40,20" stroke="#ffffff" stroke-width="2" fill="none" />
</svg>`);

createSvg('grid.svg', `<svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
    <rect width="40" height="40" fill="none" stroke="#ffffff" stroke-width="1" />
</svg>`);

createSvg('hit.svg', `<svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="20" r="15" fill="#ff0000" />
    <path d="M10,10 L30,30 M30,10 L10,30" stroke="#ffffff" stroke-width="3" />
</svg>`);

createSvg('miss.svg', `<svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="20" r="10" fill="#ffffff" />
</svg>`);

// Create loading screen elements
createSvg('loading-background.svg', `<svg width="400" height="50" xmlns="http://www.w3.org/2000/svg">
    <rect width="400" height="50" rx="5" fill="#333333" />
</svg>`);

createSvg('loading-bar.svg', `<svg width="400" height="50" xmlns="http://www.w3.org/2000/svg">
    <rect width="400" height="50" rx="5" fill="#4a6ea9" />
</svg>`);

// Create background images
createPng('bg1.png', 800, 600, '#0c87c1');
createPng('bg2.png', 800, 600, '#0a4b5e');
createPng('bg3.png', 800, 600, '#0a8069');
createPng('bg4.png', 800, 600, '#0a9dc1');

// Create ship images
createPng('battleship-logo.png', 400, 100, '#000000');
createPng('ship1.png', 40, 40, '#555555');
createPng('ship2.png', 80, 40, '#555555');
createPng('ship3.png', 120, 40, '#555555');
createPng('ship4.png', 160, 40, '#555555');

console.log('All placeholder images created successfully!'); 