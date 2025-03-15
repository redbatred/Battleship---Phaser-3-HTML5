import Phaser from 'phaser';
import { WaterEffects } from '../utils/WaterEffects';

export class BaseScene extends Phaser.Scene {
    protected waterEffects!: WaterEffects;
    protected musicTracks: string[] = ['bmusic1', 'bmusic2', 'bmusic3', 'bmusic4', 'bmusic5'];
    protected currentTrackIndex: number = -1;
    protected backgroundMusic!: Phaser.Sound.BaseSound;
    protected soundButton!: Phaser.GameObjects.Container;
    
    constructor(config: Phaser.Types.Scenes.SettingsConfig) {
        super(config);
    }
    
    /**
     * Create animated water background.
     */
    create(data?: any): void {
        // Initialize water effects
        this.waterEffects = new WaterEffects(this);
        
        // Play random background music if not already playing
        if (!this.backgroundMusic || !this.backgroundMusic.isPlaying) {
            this.playRandomBackgroundMusic();
        }
        
        // Create sound toggle button
        this.createSoundToggleButton();
    }
    
    protected continueBackgroundMusic(): void {
        // Check if any music is already playing in the game
        const musicPlaying = this.sound.getAll('sound').some(sound => 
            sound.isPlaying && this.musicTracks.includes(sound.key)
        );
        
        // If no music is playing, start a new track
        if (!musicPlaying) {
            this.playRandomBackgroundMusic();
        }
    }
    
    protected playRandomBackgroundMusic(): void {
        // Stop any currently playing music from this scene
        if (this.backgroundMusic && this.backgroundMusic.isPlaying) {
            this.backgroundMusic.stop();
        }
        
        // Choose a random track that's different from the current one
        let newTrackIndex;
        do {
            newTrackIndex = Math.floor(Math.random() * this.musicTracks.length);
        } while (newTrackIndex === this.currentTrackIndex && this.musicTracks.length > 1);
        
        this.currentTrackIndex = newTrackIndex;
        const trackKey = this.musicTracks[this.currentTrackIndex];
        
        console.log(`Attempting to play background music track: ${trackKey}`);
        
        // Check if sound is enabled
        if (this.sound.mute) {
            console.warn('Sound is currently muted. Unmuting...');
            this.sound.setMute(false);
        }
        
        // Debug sound system status
        console.log(`Sound system status: Muted=${this.sound.mute}, Volume=${this.sound.volume}`);
        
        // Play the selected track
        const soundExists = this.sound.get(trackKey);
        console.log(`Sound ${trackKey} exists: ${soundExists ? 'Yes' : 'No'}`);
        
        try {
            this.backgroundMusic = this.sound.add(trackKey, { 
                loop: false, 
                volume: 0.3 
            });
            
            // Set up event to play another random track when this one ends
            this.backgroundMusic.once('complete', () => {
                console.log(`Track ${trackKey} completed, playing next track`);
                this.playRandomBackgroundMusic();
            });
            
            // Add debug event for when audio actually starts playing
            this.backgroundMusic.once('play', () => {
                console.log(`Track ${trackKey} has started playing`);
            });
            
            // Play the track and log the result
            const playResult = this.backgroundMusic.play();
            console.log(`Play result for ${trackKey}: `, playResult);
        } catch (error) {
            console.error(`Error playing audio track ${trackKey}:`, error);
        }
    }
    
    protected createSoundToggleButton(): void {
        const screenWidth = this.cameras.main.width;
        
        // Create a container for the button
        this.soundButton = this.add.container(screenWidth - 60, 60);
        
        // Button dimensions
        const buttonSize = 50;
        
        // Create button background with naval theme
        const buttonBg = this.add.graphics();
        buttonBg.fillStyle(0x1a3a5a, 0.9);
        buttonBg.fillCircle(0, 0, buttonSize/2);
        
        // Add metallic border
        buttonBg.lineStyle(3, 0x3498db, 0.8);
        buttonBg.strokeCircle(0, 0, buttonSize/2);
        
        // Add inner highlight
        buttonBg.fillStyle(0x2980b9, 0.5);
        buttonBg.fillCircle(0, -5, buttonSize/3);
        
        // Add rivets for naval look
        const rivetPositions = [
            { x: -buttonSize/2 + 8, y: 0 },
            { x: buttonSize/2 - 8, y: 0 },
            { x: 0, y: -buttonSize/2 + 8 },
            { x: 0, y: buttonSize/2 - 8 }
        ];
        
        const rivets = rivetPositions.map(pos => {
            const rivet = this.add.circle(pos.x, pos.y, 3, 0xd0d0d0);
            rivet.setStrokeStyle(1, 0x808080);
            return rivet;
        });
        
        // Create sound icon
        const soundIcon = this.add.graphics();
        
        // Function to draw the sound icon based on mute state
        const updateSoundIcon = () => {
            soundIcon.clear();
            soundIcon.fillStyle(0xffffff, 1);
            
            // Draw speaker base
            soundIcon.fillRect(-8, -7, 6, 14);
            soundIcon.fillTriangle(-8, -7, 2, -15, 2, -7);
            soundIcon.fillTriangle(-8, 7, 2, 15, 2, 7);
            
            if (!this.sound.mute) {
                // Draw sound waves
                soundIcon.lineStyle(2, 0xffffff, 1);
                soundIcon.strokeCircle(5, 0, 5);
                soundIcon.strokeCircle(5, 0, 10);
            } else {
                // Draw mute X
                soundIcon.lineStyle(3, 0xff0000, 1);
                soundIcon.lineBetween(5, -10, 15, 10);
                soundIcon.lineBetween(5, 10, 15, -10);
            }
        };
        
        // Initial draw
        updateSoundIcon();
        
        // Add all elements to the container
        this.soundButton.add([buttonBg, ...rivets, soundIcon]);
        
        // Make the button interactive
        this.soundButton.setSize(buttonSize, buttonSize);
        this.soundButton.setInteractive({ useHandCursor: true });
        
        // Add hover and click effects
        this.soundButton.on('pointerover', () => {
            buttonBg.clear();
            
            // Brighter background on hover
            buttonBg.fillStyle(0x2980b9, 1);
            buttonBg.fillCircle(0, 0, buttonSize/2);
            
            // Brighter border
            buttonBg.lineStyle(3, 0x67e8f9, 1);
            buttonBg.strokeCircle(0, 0, buttonSize/2);
            
            // Brighter highlight
            buttonBg.fillStyle(0x3498db, 0.7);
            buttonBg.fillCircle(0, -5, buttonSize/3);
            
            // Scale up slightly
            this.soundButton.setScale(1.1);
        });
        
        this.soundButton.on('pointerout', () => {
            buttonBg.clear();
            
            // Return to normal state
            buttonBg.fillStyle(0x1a3a5a, 0.9);
            buttonBg.fillCircle(0, 0, buttonSize/2);
            
            // Normal border
            buttonBg.lineStyle(3, 0x3498db, 0.8);
            buttonBg.strokeCircle(0, 0, buttonSize/2);
            
            // Normal highlight
            buttonBg.fillStyle(0x2980b9, 0.5);
            buttonBg.fillCircle(0, -5, buttonSize/3);
            
            // Return to normal scale
            this.soundButton.setScale(1);
        });
        
        this.soundButton.on('pointerdown', () => {
            // Toggle sound mute state
            this.sound.setMute(!this.sound.mute);
            
            // Update the icon
            updateSoundIcon();
            
            // Add a quick animation
            this.tweens.add({
                targets: this.soundButton,
                scale: 0.9,
                duration: 100,
                ease: 'Sine.easeInOut',
                yoyo: true
            });
            
            console.log(`Sound ${this.sound.mute ? 'muted' : 'unmuted'}`);
        });
        
        // Set a high depth to ensure visibility across all scenes
        this.soundButton.setDepth(1000);
    }

    update(time: number, delta: number): void {
        // Update water animation
        if (this.waterEffects) {
            this.waterEffects.update(time, delta);
        }
    }
} 