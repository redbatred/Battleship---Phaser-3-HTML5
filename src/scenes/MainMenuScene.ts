import Phaser from 'phaser';
import RexUIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin';
import { GameScene } from './GameScene';
import { Player1SetupScene } from './Player1SetupScene';
import { BaseScene } from './BaseScene';

export class MainMenuScene extends BaseScene {
    private rexUI!: RexUIPlugin;
    private background!: Phaser.GameObjects.Image;
    private logo!: Phaser.GameObjects.Container;
    private playButton!: Phaser.GameObjects.Container;
    private exitButton!: Phaser.GameObjects.Container;
    private gameMode: 'cpu' | 'twoPlayer' = 'cpu'; // Default game mode
    private cpuModeButton!: Phaser.GameObjects.Container;
    private twoPlayerModeButton!: Phaser.GameObjects.Container;

    constructor() {
        super({ key: 'MainMenuScene' });
    }

    init(): void {
        // @ts-ignore - The Rex UI plugin is added to the scene
        this.rexUI = this.plugins.get('rexUI');
    }

    create(data?: any): void {
        super.create(data);
        
        this.createBackground();
        this.createAnimatedLogo();
        this.createGameModeSelectors();
        this.createNavalButtons();
    }

    private createBackground(): void {
        // Choose a random background from the 4 available
        const bgNumber = Phaser.Math.Between(1, 4);
        const bgKey = `bg${bgNumber}`;
        
        // Add the background image
        this.background = this.add.image(0, 0, bgKey);
        this.background.setOrigin(0, 0);
        
        // Scale to fit the screen
        this.background.setDisplaySize(this.cameras.main.width, this.cameras.main.height);
        
        // Add a semi-transparent overlay to ensure text is readable
        const overlay = this.add.rectangle(
            0, 0, 
            this.cameras.main.width, 
            this.cameras.main.height, 
            0x000000, 0.4
        );
        overlay.setOrigin(0, 0);
    }

    private createAnimatedLogo(): void {
        // Create a container for the logo
        this.logo = this.add.container(this.cameras.main.width / 2, this.cameras.main.height / 5);
        
        // Create the main logo text
        const logoText = this.add.text(0, 0, 'BATTLESHIP', {
            fontFamily: 'Impact',
            fontSize: '72px',
            color: '#ffffff',
            stroke: '#145a8d',
            strokeThickness: 8,
            shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 5, fill: true }
        });
        logoText.setOrigin(0.5);
        
        // Create a metallic plate behind the text
        const plate = this.add.graphics();
        plate.fillStyle(0x1a5276, 0.7);
        plate.fillRoundedRect(
            -logoText.width / 2 - 30, 
            -logoText.height / 2 - 15, 
            logoText.width + 60, 
            logoText.height + 30, 
            15
        );
        
        // Add a stroke to the plate
        plate.lineStyle(4, 0x3498db, 0.8);
        plate.strokeRoundedRect(
            -logoText.width / 2 - 30, 
            -logoText.height / 2 - 15, 
            logoText.width + 60, 
            logoText.height + 30, 
            15
        );
        
        // Add rivets to the corners for naval look
        const rivetPositions = [
            { x: -logoText.width / 2 - 20, y: -logoText.height / 2 - 5 },
            { x: logoText.width / 2 + 20, y: -logoText.height / 2 - 5 },
            { x: -logoText.width / 2 - 20, y: logoText.height / 2 + 5 },
            { x: logoText.width / 2 + 20, y: logoText.height / 2 + 5 }
        ];
        
        const rivets = rivetPositions.map(pos => {
            const rivet = this.add.circle(pos.x, pos.y, 6, 0xd0d0d0);
            rivet.setStrokeStyle(1, 0x808080);
            return rivet;
        });
        
        // Add decorative elements
        const leftAnchor = this.add.image(-logoText.width / 2 - 50, 0, 'miss');
        leftAnchor.setScale(1.5);
        leftAnchor.setTint(0xd4af37); // Gold color
        
        const rightAnchor = this.add.image(logoText.width / 2 + 50, 0, 'miss');
        rightAnchor.setScale(1.5);
        rightAnchor.setTint(0xd4af37); // Gold color
        
        // Add all elements to the container
        this.logo.add([plate, ...rivets, leftAnchor, rightAnchor, logoText]);
        
        // Add animations
        this.tweens.add({
            targets: this.logo,
            y: this.logo.y + 10,
            duration: 2000,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });
        
        // Add a glow effect
        const glowFx = logoText.preFX?.addGlow(0x3498db, 8, 0, false);
        if (glowFx) {
            this.tweens.add({
                targets: glowFx,
                outerStrength: 4,
                yoyo: true,
                repeat: -1,
                duration: 1500
            });
        }
        
        // Add a subtle rotation
        this.tweens.add({
            targets: [leftAnchor, rightAnchor],
            angle: 15,
            duration: 3000,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });
    }

    private createGameModeSelectors(): void {
        const centerX = this.cameras.main.width / 2;
        const y = this.cameras.main.height / 2 - 50;
        
        // Create the mode selection buttons
        this.cpuModeButton = this.createModeButton(
            centerX - 100, 
            y, 
            'CPU', 
            'cpu',
            '👤 vs 🤖'
        );
        
        this.twoPlayerModeButton = this.createModeButton(
            centerX + 100, 
            y, 
            '2 PLAYER', 
            'twoPlayer',
            '👤 vs 👤'
        );
        
        // Set initial selection
        this.updateModeSelection();
    }
    
    private createModeButton(x: number, y: number, title: string, mode: 'cpu' | 'twoPlayer', icon: string): Phaser.GameObjects.Container {
        const container = this.add.container(x, y);
        
        // Button dimensions
        const buttonWidth = 160;
        const buttonHeight = 120;
        
        // Create metallic background
        const buttonBg = this.add.graphics();
        
        // Main button body
        buttonBg.fillStyle(0x1a5276, 0.8);
        buttonBg.fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 10);
        
        // Add border
        buttonBg.lineStyle(3, 0x3498db);
        buttonBg.strokeRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 10);
        
        // Add rivets to corners for naval look
        const rivetPositions = [
            { x: -buttonWidth/2 + 10, y: -buttonHeight/2 + 10 },
            { x: buttonWidth/2 - 10, y: -buttonHeight/2 + 10 },
            { x: -buttonWidth/2 + 10, y: buttonHeight/2 - 10 },
            { x: buttonWidth/2 - 10, y: buttonHeight/2 - 10 }
        ];
        
        const rivets = rivetPositions.map(pos => {
            const rivet = this.add.circle(pos.x, pos.y, 4, 0xd0d0d0);
            rivet.setStrokeStyle(1, 0x808080);
            return rivet;
        });
        
        // Add icon
        const iconText = this.add.text(0, -15, icon, {
            fontFamily: 'Arial',
            fontSize: '40px'
        });
        iconText.setOrigin(0.5);
        
        // Add title text
        const titleText = this.add.text(0, 35, title, {
            fontFamily: 'Impact',
            fontSize: '22px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        });
        titleText.setOrigin(0.5);
        
        // Add selection indicator (initially invisible)
        const selectionIndicator = this.add.graphics();
        selectionIndicator.fillStyle(0x67e8f9, 0.3);
        selectionIndicator.fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 10);
        selectionIndicator.lineStyle(4, 0x67e8f9, 1);
        selectionIndicator.strokeRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 10);
        selectionIndicator.visible = false;
        
        // Add all elements to container
        container.add([buttonBg, ...rivets, iconText, titleText, selectionIndicator]);
        
        // Make button interactive
        container.setSize(buttonWidth, buttonHeight);
        container.setInteractive({ useHandCursor: true });
        
        // Add hover and click effects
        container.on('pointerover', () => {
            if (this.gameMode !== mode) {
                buttonBg.clear();
                buttonBg.fillStyle(0x2980b9, 0.8);
                buttonBg.fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 10);
                buttonBg.lineStyle(3, 0x3498db);
                buttonBg.strokeRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 10);
                
                container.setScale(1.05);
                
                if (this.sound.get('click')) {
                    this.sound.play('click', { volume: 0.3 });
                }
            }
        });
        
        container.on('pointerout', () => {
            if (this.gameMode !== mode) {
                buttonBg.clear();
                buttonBg.fillStyle(0x1a5276, 0.8);
                buttonBg.fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 10);
                buttonBg.lineStyle(3, 0x3498db);
                buttonBg.strokeRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 10);
                
                container.setScale(1);
            }
        });
        
        container.on('pointerdown', () => {
            this.gameMode = mode;
            this.updateModeSelection();
            
            if (this.sound.get('click')) {
                this.sound.play('click', { volume: 0.5 });
            }
        });
        
        // Store the selection indicator for later use
        container.setData('selectionIndicator', selectionIndicator);
        
        return container;
    }
    
    private updateModeSelection(): void {
        // Update CPU mode button
        const cpuIndicator = this.cpuModeButton.getData('selectionIndicator') as Phaser.GameObjects.Graphics;
        cpuIndicator.visible = this.gameMode === 'cpu';
        
        // Update two player mode button
        const twoPlayerIndicator = this.twoPlayerModeButton.getData('selectionIndicator') as Phaser.GameObjects.Graphics;
        twoPlayerIndicator.visible = this.gameMode === 'twoPlayer';
    }

    private createNavalButtons(): void {
        // Create the Play button
        this.playButton = this.createStylishButton(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 + 100,
            'PLAY',
            this.startGame.bind(this)
        );
        
        // Create the Exit button
        this.exitButton = this.createStylishButton(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 + 200, // Moved down to make room for mode selectors
            'EXIT',
            this.exitGame.bind(this)
        );
    }
    
    private createStylishButton(x: number, y: number, text: string, callback: () => void): Phaser.GameObjects.Container {
        const container = this.add.container(x, y);
        
        // Button dimensions
        const buttonWidth = 220;
        const buttonHeight = 70;
        
        // Create button background with naval theme
        const buttonBg = this.add.graphics();
        buttonBg.fillStyle(0x1a3a5a, 1);
        buttonBg.fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 15);
        
        // Add metallic highlight
        buttonBg.fillStyle(0x2980b9, 0.5);
        buttonBg.fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight/2, 15);
        
        // Add border
        buttonBg.lineStyle(3, 0x3498db);
        buttonBg.strokeRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 15);
        
        // Add rivets to corners for naval look
        const rivetPositions = [
            { x: -buttonWidth/2 + 15, y: -buttonHeight/2 + 15 },
            { x: buttonWidth/2 - 15, y: -buttonHeight/2 + 15 },
            { x: -buttonWidth/2 + 15, y: buttonHeight/2 - 15 },
            { x: buttonWidth/2 - 15, y: buttonHeight/2 - 15 }
        ];
        
        const rivets = rivetPositions.map(pos => {
            const rivet = this.add.circle(pos.x, pos.y, 5, 0xd0d0d0);
            rivet.setStrokeStyle(1, 0x808080);
            return rivet;
        });
        
        // Add text
        const buttonText = this.add.text(0, 0, text, {
            fontFamily: 'Impact',
            fontSize: '32px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        });
        buttonText.setOrigin(0.5);
        
        // Add all elements to the container
        container.add([buttonBg, ...rivets, buttonText]);
        
        // Make the button interactive
        container.setSize(buttonWidth, buttonHeight);
        container.setInteractive({ useHandCursor: true });
        
        // Add hover and click effects
        container.on('pointerover', () => {
            buttonBg.clear();
            
            // Brighter background on hover
            buttonBg.fillStyle(0x2980b9, 1);
            buttonBg.fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 15);
            
            // Brighter highlight
            buttonBg.fillStyle(0x3498db, 0.7);
            buttonBg.fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight/2, 15);
            
            // Brighter border
            buttonBg.lineStyle(3, 0x67e8f9);
            buttonBg.strokeRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 15);
            
            // Scale up slightly
            container.setScale(1.05);
        });
        
        container.on('pointerout', () => {
            buttonBg.clear();
            
            // Return to normal state
            buttonBg.fillStyle(0x1a3a5a, 1);
            buttonBg.fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 15);
            
            buttonBg.fillStyle(0x2980b9, 0.5);
            buttonBg.fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight/2, 15);
            
            buttonBg.lineStyle(3, 0x3498db);
            buttonBg.strokeRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 15);
            
            // Return to normal scale
            container.setScale(1);
        });
        
        container.on('pointerdown', () => {
            // Add a quick animation
            this.tweens.add({
                targets: container,
                scale: 0.95,
                duration: 100,
                ease: 'Sine.easeInOut',
                yoyo: true,
                onComplete: () => {
                    callback();
                }
            });
        });
        
        return container;
    }

    private exitGame(): void {
        // Close the game window or exit the application
        // This is a placeholder as the actual implementation depends on the platform
        console.log('Exit game requested');
        
        // In a browser, we can't really exit, so we'll just reload the page
        window.location.reload();
    }

    public startGame(): void {
        // Clean up any existing scenes
        this.scene.manager.getScenes().forEach(scene => {
            if (scene.scene.key !== 'MainMenuScene') {
                scene.scene.remove();
            }
        });
        
        // Store the game mode in the registry for other scenes to access
        this.registry.set('gameMode', this.gameMode);
        console.log('Setting game mode in registry:', this.gameMode);
        
        // Start the appropriate scene based on game mode
        if (this.gameMode === 'cpu' || this.gameMode === 'twoPlayer') {
            // Both modes start with Player1SetupScene
            this.scene.start('Player1SetupScene');
        }
    }

    update(time: number, delta: number): void {
        // No water animations needed
    }
} 