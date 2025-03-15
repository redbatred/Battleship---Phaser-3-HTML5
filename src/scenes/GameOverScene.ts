import Phaser from 'phaser';
import { WaterEffects } from '../utils/WaterEffects';

export class GameOverScene extends Phaser.Scene {
    private result: string = '';
    private waterEffects!: WaterEffects;

    constructor() {
        super({ key: 'GameOverScene' });
    }

    init(data: { result: string }): void {
        this.result = data.result || 'Game Over';
    }

    create(): void {
        // Create animated water background
        this.waterEffects = new WaterEffects(this);
        
        // Add a semi-transparent overlay for better readability
        const overlay = this.add.rectangle(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2,
            this.cameras.main.width,
            this.cameras.main.height,
            0x000000,
            0.5
        );
        
        // Create a stylish container for the game over content
        this.createGameOverPanel();
        
        // Add animated decorative elements
        this.addDecorativeElements();
    }
    
    update(time: number, delta: number): void {
        // Update water animation
        if (this.waterEffects) {
            this.waterEffects.update(time, delta);
        }
    }

    private createGameOverPanel(): void {
        const screenWidth = this.cameras.main.width;
        const screenHeight = this.cameras.main.height;
        
        // Create a stylish panel
        const panelWidth = 600;
        const panelHeight = 500;
        
        // Panel background with naval theme
        const panel = this.add.graphics();
        panel.fillStyle(0x1a5276, 0.9);
        panel.fillRoundedRect(
            screenWidth/2 - panelWidth/2,
            screenHeight/2 - panelHeight/2,
            panelWidth,
            panelHeight,
            20
        );
        
        // Add metallic border
        panel.lineStyle(6, 0x3498db, 0.8);
        panel.strokeRoundedRect(
            screenWidth/2 - panelWidth/2,
            screenHeight/2 - panelHeight/2,
            panelWidth,
            panelHeight,
            20
        );
        
        // Add inner highlight
        panel.lineStyle(2, 0x67e8f9, 0.5);
        panel.strokeRoundedRect(
            screenWidth/2 - panelWidth/2 + 10,
            screenHeight/2 - panelHeight/2 + 10,
            panelWidth - 20,
            panelHeight - 20,
            15
        );
        
        // Add rivets to corners for naval look
        const rivetPositions = [
            { x: screenWidth/2 - panelWidth/2 + 20, y: screenHeight/2 - panelHeight/2 + 20 },
            { x: screenWidth/2 + panelWidth/2 - 20, y: screenHeight/2 - panelHeight/2 + 20 },
            { x: screenWidth/2 - panelWidth/2 + 20, y: screenHeight/2 + panelHeight/2 - 20 },
            { x: screenWidth/2 + panelWidth/2 - 20, y: screenHeight/2 + panelHeight/2 - 20 }
        ];
        
        rivetPositions.forEach(pos => {
            const rivet = this.add.circle(pos.x, pos.y, 8, 0xd0d0d0);
            rivet.setStrokeStyle(2, 0x808080);
        });
        
        // Add game over text with glow effect
        const gameOverText = this.add.text(
            screenWidth / 2,
            screenHeight / 2 - 150,
            'GAME OVER',
            {
                fontFamily: 'Impact',
                fontSize: '64px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 6
            }
        );
        gameOverText.setOrigin(0.5);
        
        // Add glow effect
        const glowFx = gameOverText.preFX?.addGlow(0x3498db, 8, 0, false);
        if (glowFx) {
            this.tweens.add({
                targets: glowFx,
                outerStrength: 4,
                yoyo: true,
                repeat: -1,
                duration: 1500
            });
        }
        
        // Add result text with appropriate color and trophy icon
        const isWin = this.result.toLowerCase().includes('win');
        const resultColor = isWin ? '#00ff00' : '#ff0000';
        const resultIcon = isWin ? '🏆' : '🏳️';
        
        const resultContainer = this.add.container(screenWidth / 2, screenHeight / 2 - 50);
        
        const resultIconText = this.add.text(
            -150,
            0,
            resultIcon,
            {
                fontSize: '64px'
            }
        );
        resultIconText.setOrigin(0.5);
        
        const resultText = this.add.text(
            0,
            0,
            this.result,
            {
                fontFamily: 'Impact',
                fontSize: '48px',
                color: resultColor,
                stroke: '#000000',
                strokeThickness: 4
            }
        );
        resultText.setOrigin(0.5);
        
        const resultIconText2 = this.add.text(
            150,
            0,
            resultIcon,
            {
                fontSize: '64px'
            }
        );
        resultIconText2.setOrigin(0.5);
        
        resultContainer.add([resultIconText, resultText, resultIconText2]);
        
        // Add animated scale effect
        this.tweens.add({
            targets: resultContainer,
            scale: 1.1,
            duration: 1000,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });
        
        // Create stylish buttons
        this.createStylishButton(
            screenWidth / 2,
            screenHeight / 2 + 70,
            '🎮 PLAY AGAIN',
            () => this.playAgain()
        );

        this.createStylishButton(
            screenWidth / 2,
            screenHeight / 2 + 150,
            '🏠 MAIN MENU',
            () => this.goToMainMenu()
        );
    }
    
    private createStylishButton(x: number, y: number, text: string, callback: () => void): void {
        // Button dimensions
        const buttonWidth = 300;
        const buttonHeight = 60;
        
        // Create a container for the button
        const buttonContainer = this.add.container(x, y);
        
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
            fontSize: '28px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        });
        buttonText.setOrigin(0.5);
        
        // Add all elements to the container
        buttonContainer.add([buttonBg, ...rivets, buttonText]);
        
        // Make the button interactive
        buttonContainer.setSize(buttonWidth, buttonHeight);
        buttonContainer.setInteractive({ useHandCursor: true });
        
        // Add hover and click effects
        buttonContainer.on('pointerover', () => {
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
            buttonContainer.setScale(1.05);
            
            // Play sound if available
            if (this.sound.get('click')) {
                this.sound.play('click', { volume: 0.5 });
            }
        });
        
        buttonContainer.on('pointerout', () => {
            buttonBg.clear();
            
            // Return to normal state
            buttonBg.fillStyle(0x1a3a5a, 1);
            buttonBg.fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 15);
            
            buttonBg.fillStyle(0x2980b9, 0.5);
            buttonBg.fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight/2, 15);
            
            buttonBg.lineStyle(3, 0x3498db);
            buttonBg.strokeRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 15);
            
            // Return to normal scale
            buttonContainer.setScale(1);
        });
        
        buttonContainer.on('pointerdown', () => {
            // Play sound if available
            if (this.sound.get('click')) {
                this.sound.play('click', { volume: 0.7 });
            }
            
            // Add a quick animation
            this.tweens.add({
                targets: buttonContainer,
                scale: 0.95,
                duration: 100,
                ease: 'Sine.easeInOut',
                yoyo: true,
                onComplete: () => {
                    callback();
                }
            });
        });
    }
    
    private addDecorativeElements(): void {
        const screenWidth = this.cameras.main.width;
        const screenHeight = this.cameras.main.height;
        
        // Add animated ship silhouettes in the background
        const shipSilhouette1 = this.add.image(100, screenHeight - 100, 'ship4');
        shipSilhouette1.setScale(2);
        shipSilhouette1.setAlpha(0.2);
        shipSilhouette1.setTint(0x3498db);
        
        this.tweens.add({
            targets: shipSilhouette1,
            x: screenWidth + 100,
            duration: 40000,
            repeat: -1
        });
        
        const shipSilhouette2 = this.add.image(screenWidth - 100, 150, 'ship3');
        shipSilhouette2.setScale(1.5);
        shipSilhouette2.setAlpha(0.2);
        shipSilhouette2.setTint(0x3498db);
        shipSilhouette2.setFlipX(true);
        
        this.tweens.add({
            targets: shipSilhouette2,
            x: -100,
            duration: 30000,
            repeat: -1
        });
    }

    private playAgain(): void {
        // Completely stop all game scenes
        this.scene.stop('GameScene');
        this.scene.stop('Player1SetupScene');
        this.scene.stop('Player2SetupScene');
        this.scene.stop('BattleScene');
        this.scene.stop('CPUBattleScene');
        this.scene.stop('GameOverScene');
        
        // Reset ALL registry data to ensure a clean restart
        // Keep only the game mode
        const gameMode = this.registry.get('gameMode');
        
        // Clear the entire registry
        this.registry.reset();
        
        // Restore only the game mode
        this.registry.set('gameMode', gameMode);
        
        // Start from the beginning with Player1SetupScene
        this.scene.start('Player1SetupScene');
    }

    private goToMainMenu(): void {
        this.scene.start('MainMenuScene');
    }
} 