import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload(): void {
        // Load assets needed for the loading screen
        this.load.image('loading-background', 'assets/images/loading-background.svg');
        this.load.image('loading-bar', 'assets/images/loading-bar.svg');
    }

    create(): void {
        // Set up any game settings or configurations
        this.scale.refresh();
        
        // Initialize sound
        this.sound.setMute(false);
        this.sound.volume = 1.0;
        
        // Add a listener to handle when the game loses focus
        this.game.events.on('blur', () => {
            // Mute audio when game loses focus
            this.sound.setMute(true);
        });
        
        // Add a listener to handle when the game gains focus
        this.game.events.on('focus', () => {
            // Unmute audio when game gains focus
            this.sound.setMute(false);
        });
        
        // Transition to the preload scene
        this.scene.start('PreloadScene');
    }
} 