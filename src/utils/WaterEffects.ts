import Phaser from 'phaser';

export class WaterEffects {
    private scene: Phaser.Scene;
    private waterLayer1!: Phaser.GameObjects.TileSprite;
    private waterLayer2!: Phaser.GameObjects.TileSprite;
    private waterRipples!: Phaser.GameObjects.Graphics;
    private bubbles: Phaser.GameObjects.Particles.ParticleEmitter[] = [];
    private waveTime: number = 0;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.createAnimatedWater();
    }

    private createAnimatedWater(): void {
        const screenWidth = this.scene.cameras.main.width;
        const screenHeight = this.scene.cameras.main.height;
        
        // Create layered water background
        this.waterLayer1 = this.scene.add.tileSprite(
            screenWidth / 2, 
            screenHeight / 2, 
            screenWidth, 
            screenHeight, 
            'water1'
        );
        this.waterLayer1.setAlpha(0.6);
        
        this.waterLayer2 = this.scene.add.tileSprite(
            screenWidth / 2, 
            screenHeight / 2, 
            screenWidth, 
            screenHeight, 
            'water2'
        );
        this.waterLayer2.setAlpha(0.3);
        
        // Add a semi-transparent overlay
        const overlay = this.scene.add.rectangle(
            screenWidth / 2, 
            screenHeight / 2, 
            screenWidth, 
            screenHeight, 
            0x0c4076, 
            0.4
        );
        
        // Create water ripples
        this.waterRipples = this.scene.add.graphics();
        
        // Create bubble effect
        this.createBubbleEffect();
    }

    private createBubbleEffect(): void {
        // Create simple bubble effect using circle graphics
        const createBubble = () => {
            const x = Phaser.Math.Between(0, this.scene.cameras.main.width);
            const y = this.scene.cameras.main.height + 20;
            const size = Phaser.Math.Between(5, 15);
            
            const bubble = this.scene.add.circle(x, y, size, 0xffffff, 0.4);
            
            // Add movement animation
            this.scene.tweens.add({
                targets: bubble,
                y: -50,
                x: x + Phaser.Math.Between(-100, 100),
                alpha: 0,
                duration: Phaser.Math.Between(3000, 8000),
                ease: 'Sine.easeInOut',
                onComplete: () => {
                    bubble.destroy();
                }
            });
        };
        
        // Create initial bubbles
        for (let i = 0; i < 10; i++) {
            createBubble();
        }
        
        // Create new bubbles periodically
        this.scene.time.addEvent({
            delay: 500,
            callback: createBubble,
            callbackScope: this,
            loop: true
        });
    }

    update(time: number, delta: number): void {
        // Animate water layers with varying speeds for more natural movement
        this.waterLayer1.tilePositionX += 0.08;
        this.waterLayer1.tilePositionY += 0.03;
        
        this.waterLayer2.tilePositionX -= 0.12;
        this.waterLayer2.tilePositionY -= 0.02;
        
        // Update wave time
        this.waveTime += delta / 1000;
        
        // Draw animated water ripples
        this.updateWaterRipples();
    }

    private updateWaterRipples(): void {
        this.waterRipples.clear();
        this.waterRipples.lineStyle(2, 0x3498db, 0.3);
        
        const screenWidth = this.scene.cameras.main.width;
        const screenHeight = this.scene.cameras.main.height;
        const waveCount = 5;
        const waveSpacing = screenHeight / waveCount;
        
        for (let i = 0; i < waveCount; i++) {
            const baseY = i * waveSpacing + (this.waveTime * 20) % waveSpacing;
            
            this.waterRipples.beginPath();
            
            // Start at the left edge
            this.waterRipples.moveTo(0, baseY);
            
            // Draw a wavy line across the screen with more pronounced waves
            for (let x = 0; x < screenWidth; x += 20) {
                // Use multiple sine waves for more complex movement
                const y = baseY + 
                          Math.sin((x / 200) + this.waveTime * 2) * 10 + 
                          Math.sin((x / 100) + this.waveTime * 1.5) * 5;
                this.waterRipples.lineTo(x, y);
            }
            
            this.waterRipples.strokePath();
        }
    }
} 