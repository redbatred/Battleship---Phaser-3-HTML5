const fs = require('fs');
const path = require('path');
const https = require('https');

// Ensure the assets directories exist
const imagesDir = path.join(__dirname, '../src/assets/images');
if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
}

// Function to download an image from a URL
function downloadImage(url, filename) {
    return new Promise((resolve, reject) => {
        const filePath = path.join(imagesDir, filename);
        const file = fs.createWriteStream(filePath);
        
        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
                return;
            }
            
            response.pipe(file);
            
            file.on('finish', () => {
                file.close();
                console.log(`Downloaded ${filename}`);
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(filePath, () => {}); // Delete the file if there was an error
            reject(err);
        });
    });
}

// Sample underwater background images
const backgroundImages = [
    {
        url: 'https://img.freepik.com/free-vector/underwater-background-with-sunbeams_1308-30463.jpg',
        filename: 'bg1.png'
    },
    {
        url: 'https://img.freepik.com/free-vector/underwater-background-with-sunbeams-seaweed-bubbles_107791-1125.jpg',
        filename: 'bg2.png'
    },
    {
        url: 'https://img.freepik.com/free-vector/underwater-background-with-sunbeams-seaweed-bubbles_107791-1126.jpg',
        filename: 'bg3.png'
    },
    {
        url: 'https://img.freepik.com/free-vector/underwater-background-with-sunbeams-seaweed-bubbles_107791-1127.jpg',
        filename: 'bg4.png'
    }
];

// Sample ship images
const shipImages = [
    {
        url: 'https://img.freepik.com/free-vector/battleship-game-piece-white_1308-84512.jpg',
        filename: 'battleship-logo.png'
    },
    {
        url: 'https://img.freepik.com/free-vector/battleship-game-piece-white_1308-84513.jpg',
        filename: 'ship1.png'
    },
    {
        url: 'https://img.freepik.com/free-vector/battleship-game-piece-white_1308-84514.jpg',
        filename: 'ship2.png'
    },
    {
        url: 'https://img.freepik.com/free-vector/battleship-game-piece-white_1308-84515.jpg',
        filename: 'ship3.png'
    },
    {
        url: 'https://img.freepik.com/free-vector/battleship-game-piece-white_1308-84516.jpg',
        filename: 'ship4.png'
    }
];

// Download all images
async function downloadAllImages() {
    try {
        // Download background images
        for (const image of backgroundImages) {
            await downloadImage(image.url, image.filename);
        }
        
        // Download ship images
        for (const image of shipImages) {
            await downloadImage(image.url, image.filename);
        }
        
        console.log('All images downloaded successfully!');
    } catch (error) {
        console.error('Error downloading images:', error);
    }
}

// Start downloading images
downloadAllImages(); 