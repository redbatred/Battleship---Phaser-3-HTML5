import Phaser from 'phaser';

export class PreloadScene extends Phaser.Scene {
    private loadingBar!: Phaser.GameObjects.Graphics;
    private progressBar!: Phaser.GameObjects.Graphics;
    private loadingText!: Phaser.GameObjects.Text;

    constructor() {
        super({ key: 'PreloadScene' });
    }

    preload(): void {
        this.createLoadingBar();

        // Register a progress event to update the loading bar
        this.load.on('progress', (value: number) => {
            this.progressBar.clear();
            this.progressBar.fillStyle(0xffffff, 1);
            this.progressBar.fillRect(
                this.cameras.main.width / 4,
                this.cameras.main.height / 2 - 16,
                (this.cameras.main.width / 2) * value,
                32
            );
            this.loadingText.setText(`Loading: ${Math.floor(value * 100)}%`);
        });

        // Handle file load errors
        this.load.on('loaderror', (file: any) => {
            console.error('Error loading asset:', file.key);
        });

        // Set the base URL for all assets
        this.load.setBaseURL('./');
        
        // Load game assets
        this.loadGameAssets();
    }

    create(): void {
        this.load.off('progress');
        this.load.off('loaderror');
        
        // Create fallback assets for any that failed to load
        this.createFallbackAssets();
        
        this.scene.start('MainMenuScene');
    }

    private createLoadingBar(): void {
        this.loadingBar = this.add.graphics();
        this.loadingBar.fillStyle(0x222222, 0.8);
        this.loadingBar.fillRect(
            this.cameras.main.width / 4 - 2,
            this.cameras.main.height / 2 - 18,
            this.cameras.main.width / 2 + 4,
            36
        );
        this.progressBar = this.add.graphics();
        
        // Add loading text
        this.loadingText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 + 50,
            'Loading: 0%',
            {
                fontFamily: 'Arial',
                fontSize: '18px',
                color: '#ffffff'
            }
        );
        this.loadingText.setOrigin(0.5);
    }

    private loadGameAssets(): void {
        // UI elements
        this.load.image('button', 'assets/images/button.svg');
        this.load.image('button-over', 'assets/images/button-over.svg');
        this.load.image('logo', 'assets/images/logo.svg');
        this.load.image('battleship-logo', 'assets/images/battleship-logo.png');
        
        // Background images
        this.load.image('bg1', 'assets/images/bg1.png');
        this.load.image('bg2', 'assets/images/bg2.png');
        this.load.image('bg3', 'assets/images/bg3.png');
        this.load.image('bg4', 'assets/images/bg4.png');
        
        // Water tiles
        this.load.image('water1', 'assets/images/water1.jpg');
        this.load.image('water2', 'assets/images/water2.jpg');
        
        // Game elements
        this.load.image('water', 'assets/images/water.svg');
        this.load.image('grid', 'assets/images/grid.svg');
        this.load.image('hit', 'assets/images/hit.svg');
        this.load.image('miss', 'assets/images/miss.svg');
        
        // Ship images
        console.log('Loading ship images...');
        this.load.image('ship1', 'assets/images/ship1.png');
        this.load.image('ship2', 'assets/images/ship2.png');
        this.load.image('ship3', 'assets/images/ship3.png');
        this.load.image('ship4', 'assets/images/ship4.png');
        
        // Loading screen elements
        this.load.image('loading-background', 'assets/images/loading-background.svg');
        this.load.image('loading-bar', 'assets/images/loading-bar.svg');
        
        // Load audio files
        this.load.audio('explosion', 'assets/audio/explode.ogg');
        this.load.audio('missplunge', 'assets/audio/missplunge.ogg');
        this.load.audio('bmusic1', 'assets/audio/bmusic1.mp3');
        this.load.audio('bmusic2', 'assets/audio/bmusic2.mp3');
        this.load.audio('bmusic3', 'assets/audio/bmusic3.mp3');
        this.load.audio('bmusic4', 'assets/audio/bmusic4.mp3');
        this.load.audio('bmusic5', 'assets/audio/bmusic5.wav');
        
        // Add a callback when all assets are loaded
        this.load.on('complete', () => {
            console.log('All assets loaded successfully');
            // Check if ship textures exist
            console.log('Checking ship textures:');
            console.log('ship1 texture exists:', this.textures.exists('ship1'));
            console.log('ship2 texture exists:', this.textures.exists('ship2'));
            console.log('ship3 texture exists:', this.textures.exists('ship3'));
            console.log('ship4 texture exists:', this.textures.exists('ship4'));
        });
    }
    
    private createFallbackAssets(): void {
        // Create fallback background textures if they failed to load
        this.createFallbackBackground('bg1', 0x0c87c1); // Light blue
        this.createFallbackBackground('bg2', 0x0a4b5e); // Dark blue-green
        this.createFallbackBackground('bg3', 0x0a8069); // Teal green
        this.createFallbackBackground('bg4', 0x0a9dc1); // Medium blue
        
        // Create fallback ship textures if they failed to load
        this.createFallbackShip('ship1', 0x555555, 1);
        this.createFallbackShip('ship2', 0x555555, 2);
        this.createFallbackShip('ship3', 0x555555, 3);
        this.createFallbackShip('ship4', 0x555555, 4);
        
        // Create fallback logo if it failed to load
        if (!this.textures.exists('battleship-logo')) {
            const graphics = this.make.graphics({x: 0, y: 0});
            graphics.fillStyle(0x000000, 1);
            graphics.fillRect(0, 0, 400, 100);
            
            const text = this.add.text(200, 50, 'BATTLESHIP', {
                fontFamily: 'Arial',
                fontSize: '32px',
                color: '#ffffff',
                fontStyle: 'bold'
            });
            text.setOrigin(0.5);
            
            graphics.generateTexture('battleship-logo', 400, 100);
            graphics.destroy();
            text.destroy();
        }
    }
    
    private createFallbackBackground(key: string, color: number): void {
        if (!this.textures.exists(key)) {
            console.log(`Creating fallback texture for ${key}`);
            const graphics = this.make.graphics({x: 0, y: 0});
            
            // Fill with base color
            graphics.fillStyle(color, 1);
            graphics.fillRect(0, 0, 800, 600);
            
            // Add some wave patterns
            graphics.lineStyle(2, 0xffffff, 0.2);
            for (let y = 50; y < 600; y += 100) {
                graphics.beginPath();
                for (let x = 0; x < 800; x += 10) {
                    const yOffset = Math.sin(x / 50) * 20;
                    if (x === 0) {
                        graphics.moveTo(x, y + yOffset);
                    } else {
                        graphics.lineTo(x, y + yOffset);
                    }
                }
                graphics.strokePath();
            }
            
            graphics.generateTexture(key, 800, 600);
            graphics.destroy();
        }
    }
    
    private createFallbackShip(key: string, color: number, length: number): void {
        if (!this.textures.exists(key)) {
            console.log(`Creating fallback texture for ${key}`);
            const cellSize = 40;
            const width = length * cellSize;
            const height = cellSize;
            
            const graphics = this.make.graphics({x: 0, y: 0});
            
            // Draw ship body
            graphics.fillStyle(color, 1);
            graphics.fillRect(0, 0, width, height);
            
            // Add details
            graphics.lineStyle(2, 0xffffff, 0.5);
            graphics.strokeRect(0, 0, width, height);
            
            // Add cell divisions
            for (let i = 1; i < length; i++) {
                graphics.moveTo(i * cellSize, 0);
                graphics.lineTo(i * cellSize, height);
                graphics.strokePath();
            }
            
            graphics.generateTexture(key, width, height);
            graphics.destroy();
        }
    }
} 