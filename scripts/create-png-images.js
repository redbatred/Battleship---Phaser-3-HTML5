const fs = require('fs');
const path = require('path');

// Ensure the assets directories exist
const imagesDir = path.join(__dirname, '../src/assets/images');
if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
}

// Function to create a PNG file with base64 data
function createPngFromBase64(filename, base64Data) {
    const filePath = path.join(imagesDir, filename);
    // Remove the data URL prefix if present
    const data = base64Data.replace(/^data:image\/png;base64,/, '');
    fs.writeFileSync(filePath, Buffer.from(data, 'base64'));
    console.log(`Created ${filename}`);
}

// Simple 1x1 pixel PNG in different colors (base64 encoded)
const bluePixel = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='; // Blue
const darkBluePixel = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPj/HwADBwIAMCbHYQAAAABJRU5ErkJggg=='; // Dark Blue
const greenPixel = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAEDQIARQzYPAAAAABJRU5ErkJggg=='; // Green
const tealPixel = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkaGj4DwAChgGAFB9DIgAAAABJRU5ErkJggg=='; // Teal
const grayPixel = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPj/CAAEEAIEOmjWUAAAAABJRU5ErkJggg=='; // Gray
const blackPixel = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYGBgAAAABQABXviz4gAAAABJRU5ErkJggg=='; // Black

// Create background images
createPngFromBase64('bg1.png', bluePixel);
createPngFromBase64('bg2.png', darkBluePixel);
createPngFromBase64('bg3.png', greenPixel);
createPngFromBase64('bg4.png', tealPixel);

// Create ship images
createPngFromBase64('ship1.png', grayPixel);
createPngFromBase64('ship2.png', grayPixel);
createPngFromBase64('ship3.png', grayPixel);
createPngFromBase64('ship4.png', grayPixel);

// Create logo
createPngFromBase64('battleship-logo.png', blackPixel);

console.log('All PNG images created successfully!'); 