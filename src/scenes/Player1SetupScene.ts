import Phaser from 'phaser';
import { Grid, Ship, ShipType, ShipConfig } from '../objects';
import { Player2SetupScene } from './Player2SetupScene';
import { BaseScene } from './BaseScene';

export class Player1SetupScene extends BaseScene {
    private playerGrid!: Grid;
    private playerShips: Ship[] = [];
    private rotateButton!: Phaser.GameObjects.Container;
    private confirmButton!: Phaser.GameObjects.Container;
    private currentShipIndex: number = 0;
    private shipConfigs: ShipConfig[] = [];
    private currentShip: Ship | null = null;
    private selectedShip: Ship | null = null;

    constructor() {
        super({ key: 'Player1SetupScene' });
    }

    init() {
        // Reset ship counter and placement state
        this.resetShipCounter();
        
        // Get the game mode from the registry
        const gameMode = this.registry.get('gameMode') || 'cpu';
        console.log(`Player1SetupScene: Game mode is ${gameMode}`);
        
        // Initialize ship configurations
        this.shipConfigs = [
            { type: ShipType.Huge, imageKey: 'ship4' },
            { type: ShipType.Large, imageKey: 'ship3' },
            { type: ShipType.Large, imageKey: 'ship3' },
            { type: ShipType.Medium, imageKey: 'ship2' },
            { type: ShipType.Medium, imageKey: 'ship2' },
            { type: ShipType.Medium, imageKey: 'ship2' },
            { type: ShipType.Small, imageKey: 'ship1' },
            { type: ShipType.Small, imageKey: 'ship1' },
            { type: ShipType.Small, imageKey: 'ship1' },
            { type: ShipType.Small, imageKey: 'ship1' }
        ];
    }

    create(data?: any) {
        // Call the parent create method to initialize water effects
        super.create(data);
        
        console.log('Player1SetupScene: create');
        // Create ocean background
        this.createOceanBackground();
        
        // Create player grid centered on screen
        const screenWidth = this.cameras.main.width;
        const screenHeight = this.cameras.main.height;
        this.playerGrid = new Grid(this, screenWidth/2, screenHeight/2, 10, 10, 'Player 1 Fleet');
        
        // Create UI elements
        this.createRotateButton();
        this.createConfirmButton();
        this.createRandomButton();
        this.createShipsForPlacement();
        this.setupShipPlacementEvents();
        
        // Display instructions
        this.add.text(
            screenWidth/2, 
            50, 
            'PLAYER 1: Place your ships on the grid', 
            {
                fontFamily: 'Impact',
                fontSize: '28px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4
            }
        ).setOrigin(0.5);
        
        // Add ship counter with larger, more visible text
        const shipCounterText = this.add.text(
            screenWidth/2, 
            100, 
            `Ships placed: 0/${this.shipConfigs.length}`, 
            {
                fontFamily: 'Arial',
                fontSize: '24px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 2
            }
        );
        shipCounterText.setOrigin(0.5);
        
        // Update the ship counter when ships are placed
        this.events.on('ship-placed', () => {
            shipCounterText.setText(`Ships placed: ${this.currentShipIndex}/${this.shipConfigs.length}`);
            
            // Change color to green when all ships are placed
            if (this.currentShipIndex >= this.shipConfigs.length) {
                shipCounterText.setColor('#00ff00');
            } else {
                shipCounterText.setColor('#ffffff');
            }
        });
        
        // Add debug force continue button
        const forceButton = this.add.text(
            this.cameras.main.width - 10, 
            10, 
            'DEBUG: Force Continue', 
            {
                fontFamily: 'Arial',
                fontSize: '14px',
                color: '#ff0000',
                backgroundColor: '#000000',
                padding: { x: 5, y: 5 }
            }
        );
        forceButton.setOrigin(1, 0);
        forceButton.setInteractive({ useHandCursor: true });
        forceButton.on('pointerdown', () => {
            console.log('Forcing continue to Player2SetupScene');
            
            // Force all ships to be placed
            this.currentShipIndex = this.shipConfigs.length;
            
            // Store player 1's data in the registry
            this.registry.set('player1Grid', this.playerGrid);
            this.registry.set('player1Ships', this.playerShips);
            
            // Transition to Player 2 setup
            this.scene.start('Player2SetupScene');
        });
    }

    private createOceanBackground(): void {
        // Create a tiled water background
        const screenWidth = this.cameras.main.width;
        const screenHeight = this.cameras.main.height;
        
        // Add multiple layers of water for depth effect
        const waterLayer1 = this.add.tileSprite(
            screenWidth / 2, 
            screenHeight / 2, 
            screenWidth, 
            screenHeight, 
            'water1'
        );
        waterLayer1.setAlpha(0.6);
        
        // Add a semi-transparent overlay
        const overlay = this.add.rectangle(
            screenWidth / 2, 
            screenHeight / 2, 
            screenWidth, 
            screenHeight, 
            0x0c4076, 
            0.4
        );
    }

    private createRotateButton(): void {
        const buttonX = this.playerGrid.getX() - this.playerGrid.getWidth()/2 - 100;
        const buttonY = this.playerGrid.getY() - this.playerGrid.getHeight()/2 - 50;
        
        // Create a container for the button
        this.rotateButton = this.add.container(buttonX, buttonY);
        
        // Button dimensions
        const buttonWidth = 80;
        const buttonHeight = 80;
        
        // Create button background
        const buttonBg = this.add.graphics();
        buttonBg.fillStyle(0x1a5276, 1);
        buttonBg.fillCircle(0, 0, buttonWidth/2);
        
        // Add highlight
        buttonBg.fillStyle(0x2980b9, 0.7);
        buttonBg.fillCircle(0, -5, buttonWidth/2 - 10);
        
        // Add border
        buttonBg.lineStyle(3, 0x3498db);
        buttonBg.strokeCircle(0, 0, buttonWidth/2);
        
        // Create rotate icon
        const rotateIcon = this.add.graphics();
        rotateIcon.lineStyle(5, 0xffffff, 1);
        rotateIcon.arc(0, 0, 20, Phaser.Math.DegToRad(0), Phaser.Math.DegToRad(270), false);
        
        // Add arrow at the end of the arc
        rotateIcon.lineTo(15, -15);
        rotateIcon.lineTo(25, -5);
        rotateIcon.lineTo(15, 5);
        rotateIcon.lineTo(15, -15);
        rotateIcon.fillStyle(0xffffff, 1);
        rotateIcon.fillPath();
        
        // Add text
        const buttonText = this.add.text(0, buttonWidth/2 - 10, 'ROTATE', {
            fontFamily: 'Impact',
            fontSize: '16px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        });
        buttonText.setOrigin(0.5);
        
        // Add all elements to the container
        this.rotateButton.add([buttonBg, rotateIcon, buttonText]);
        
        // Make the button interactive
        this.rotateButton.setSize(buttonWidth, buttonHeight);
        this.rotateButton.setInteractive({ useHandCursor: true });
        
        // Add hover and click effects
        this.rotateButton.on('pointerover', () => {
            buttonBg.clear();
            
            // Brighter background on hover
            buttonBg.fillStyle(0x2980b9, 1);
            buttonBg.fillCircle(0, 0, buttonWidth/2);
            
            // Brighter highlight
            buttonBg.fillStyle(0x3498db, 0.7);
            buttonBg.fillCircle(0, -5, buttonWidth/2 - 10);
            
            // Brighter border
            buttonBg.lineStyle(3, 0x67e8f9);
            buttonBg.strokeCircle(0, 0, buttonWidth/2);
            
            // Scale up slightly
            this.rotateButton.setScale(1.1);
        });
        
        this.rotateButton.on('pointerout', () => {
            buttonBg.clear();
            
            // Return to normal state
            buttonBg.fillStyle(0x1a5276, 1);
            buttonBg.fillCircle(0, 0, buttonWidth/2);
            
            buttonBg.fillStyle(0x2980b9, 0.7);
            buttonBg.fillCircle(0, -5, buttonWidth/2 - 10);
            
            buttonBg.lineStyle(3, 0x3498db);
            buttonBg.strokeCircle(0, 0, buttonWidth/2);
            
            // Return to normal scale
            this.rotateButton.setScale(1);
        });
        
        this.rotateButton.on('pointerdown', () => {
            // Rotate the selected ship
            if (this.selectedShip) {
                this.selectedShip.rotate();
                
                // Play sound if available
                if (this.sound.get('click')) {
                    this.sound.play('click', { volume: 0.5 });
                }
                
                // Add a quick animation
                this.tweens.add({
                    targets: this.rotateButton,
                    angle: '+=30',
                    duration: 100,
                    ease: 'Sine.easeInOut',
                    yoyo: true
                });
            }
        });
    }

    private createConfirmButton(): void {
        const x = this.playerGrid.getX();
        const y = this.playerGrid.getY() + this.playerGrid.getHeight()/2 + 50;
        
        // Create a container for the button
        this.confirmButton = this.add.container(x, y);
        
        // Button dimensions
        const buttonWidth = 200;
        const buttonHeight = 60;
        
        // Create button background
        const buttonBg = this.add.graphics();
        buttonBg.fillStyle(0x1a5276, 1);
        buttonBg.fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 10);
        
        // Add highlight
        buttonBg.fillStyle(0x2980b9, 0.7);
        buttonBg.fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight/2, 10);
        
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
            const rivet = this.add.circle(pos.x, pos.y, 5, 0xd0d0d0);
            rivet.setStrokeStyle(1, 0x808080);
            return rivet;
        });
        
        // Add text
        const buttonText = this.add.text(0, 0, 'CONFIRM FLEET', {
            fontFamily: 'Impact',
            fontSize: '24px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        });
        buttonText.setOrigin(0.5);
        
        // Add all elements to the container
        this.confirmButton.add([buttonBg, ...rivets, buttonText]);
        
        // Make the button interactive
        this.confirmButton.setSize(buttonWidth, buttonHeight);
        this.confirmButton.setInteractive({ useHandCursor: true });
        
        // Add hover and click effects
        this.confirmButton.on('pointerover', () => {
            buttonBg.clear();
            
            // Brighter background on hover
            buttonBg.fillStyle(0x2980b9, 1);
            buttonBg.fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 10);
            
            // Brighter highlight
            buttonBg.fillStyle(0x3498db, 0.7);
            buttonBg.fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight/2, 10);
            
            // Brighter border
            buttonBg.lineStyle(3, 0x67e8f9);
            buttonBg.strokeRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 10);
            
            // Scale up slightly
            this.confirmButton.setScale(1.05);
        });
        
        this.confirmButton.on('pointerout', () => {
            buttonBg.clear();
            
            // Return to normal state
            buttonBg.fillStyle(0x1a5276, 1);
            buttonBg.fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 10);
            
            buttonBg.fillStyle(0x2980b9, 0.7);
            buttonBg.fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight/2, 10);
            
            buttonBg.lineStyle(3, 0x3498db);
            buttonBg.strokeRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 10);
            
            // Return to normal scale
            this.confirmButton.setScale(1);
        });
        
        this.confirmButton.on('pointerdown', () => {
            // Validate all ships are placed by recounting them
            this.updateShipCounter();
            
            console.log(`Checking ships: ${this.currentShipIndex}/${this.shipConfigs.length}`);
            
            // Force a recount of placed ships to ensure accuracy
            let actualPlacedCount = 0;
            for (const ship of this.playerShips) {
                if (ship && ship.getGridPosition() !== null) {
                    actualPlacedCount++;
                }
            }
            
            console.log(`Actual placed ships: ${actualPlacedCount}/${this.shipConfigs.length}`);
            
            // Use the actual count for validation
            if (actualPlacedCount >= this.shipConfigs.length) {
                console.log('Player1SetupScene: Transitioning to next scene');
                
                // Store player 1's data in the registry for later access
                this.registry.set('player1Grid', this.playerGrid);
                this.registry.set('player1Ships', this.playerShips);
                
                // Check the game mode
                const gameMode = this.registry.get('gameMode');
                
                // Transition to the appropriate scene based on game mode
                if (gameMode === 'cpu') {
                    this.scene.start('CPUBattleScene');
                } else {
                    this.scene.start('Player2SetupScene');
                }
            } else {
                // Show warning that not all ships are placed
                const warningText = this.add.text(
                    this.cameras.main.width / 2,
                    this.cameras.main.height - 100,
                    `Place all ships before confirming! (${actualPlacedCount}/${this.shipConfigs.length})`,
                    {
                        fontFamily: 'Arial',
                        fontSize: '24px',
                        color: '#ff0000',
                        stroke: '#000000',
                        strokeThickness: 3
                    }
                );
                warningText.setOrigin(0.5);
                
                // Fade out the warning after a few seconds
                this.tweens.add({
                    targets: warningText,
                    alpha: 0,
                    delay: 2000,
                    duration: 1000,
                    onComplete: () => {
                        warningText.destroy();
                    }
                });
            }
        });
    }

    private createRandomButton(): void {
        const x = this.playerGrid.getX();
        const y = this.playerGrid.getY() + this.playerGrid.getHeight()/2 + 120; // Position below confirm button
        
        // Create a container for the button
        const randomButton = this.add.container(x, y);
        
        // Button dimensions
        const buttonWidth = 200;
        const buttonHeight = 60;
        
        // Create button background with naval theme
        const buttonBg = this.add.graphics();
        buttonBg.fillStyle(0x1a3a5a, 1); // Darker blue for contrast
        buttonBg.fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 10);
        
        // Add metallic highlight
        buttonBg.fillStyle(0x2980b9, 0.5);
        buttonBg.fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight/2, 10);
        
        // Add border with wave pattern
        buttonBg.lineStyle(3, 0x67e8f9);
        buttonBg.strokeRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 10);
        
        // Add wave pattern inside the button
        const waveGraphics = this.add.graphics();
        waveGraphics.lineStyle(2, 0x67e8f9, 0.4);
        
        // Draw wave pattern
        for (let i = 0; i < 2; i++) {
            const y = -10 + i * 20;
            waveGraphics.beginPath();
            for (let x = -buttonWidth/2 + 10; x < buttonWidth/2 - 10; x += 20) {
                const startX = x;
                const startY = y;
                const endX = x + 10;
                const endY = y + (i % 2 === 0 ? 5 : -5);
                waveGraphics.moveTo(startX, startY);
                waveGraphics.lineTo(endX, endY);
            }
            waveGraphics.strokePath();
        }
        
        // Add rivets to corners for naval look
        const rivetPositions = [
            { x: -buttonWidth/2 + 10, y: -buttonHeight/2 + 10 },
            { x: buttonWidth/2 - 10, y: -buttonHeight/2 + 10 },
            { x: -buttonWidth/2 + 10, y: buttonHeight/2 - 10 },
            { x: buttonWidth/2 - 10, y: buttonHeight/2 - 10 }
        ];
        
        const rivets = rivetPositions.map(pos => {
            const rivet = this.add.circle(pos.x, pos.y, 5, 0xd0d0d0);
            rivet.setStrokeStyle(1, 0x808080);
            return rivet;
        });
        
        // Add dice icon
        const diceIcon = this.add.text(-70, 0, '🎲', {
            fontSize: '28px'
        });
        diceIcon.setOrigin(0.5);
        
        // Add text
        const buttonText = this.add.text(10, 0, 'RANDOM FLEET', {
            fontFamily: 'Impact',
            fontSize: '24px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        });
        buttonText.setOrigin(0.5);
        
        // Add all elements to the container
        randomButton.add([buttonBg, waveGraphics, ...rivets, diceIcon, buttonText]);
        
        // Make the button interactive
        randomButton.setSize(buttonWidth, buttonHeight);
        randomButton.setInteractive({ useHandCursor: true });
        
        // Add hover and click effects
        randomButton.on('pointerover', () => {
            buttonBg.clear();
            
            // Brighter background on hover
            buttonBg.fillStyle(0x2980b9, 1);
            buttonBg.fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 10);
            
            // Brighter highlight
            buttonBg.fillStyle(0x3498db, 0.7);
            buttonBg.fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight/2, 10);
            
            // Brighter border
            buttonBg.lineStyle(3, 0x67e8f9);
            buttonBg.strokeRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 10);
            
            // Scale up slightly
            randomButton.setScale(1.05);
            
            // Rotate dice icon
            this.tweens.add({
                targets: diceIcon,
                angle: 15,
                duration: 100,
                ease: 'Sine.easeInOut',
                yoyo: true
            });
        });
        
        randomButton.on('pointerout', () => {
            buttonBg.clear();
            
            // Return to normal state
            buttonBg.fillStyle(0x1a3a5a, 1);
            buttonBg.fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 10);
            
            buttonBg.fillStyle(0x2980b9, 0.5);
            buttonBg.fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight/2, 10);
            
            buttonBg.lineStyle(3, 0x67e8f9);
            buttonBg.strokeRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 10);
            
            // Return to normal scale
            randomButton.setScale(1);
        });
        
        randomButton.on('pointerdown', () => {
            // Play sound if available
            if (this.sound.get('click')) {
                this.sound.play('click', { volume: 0.7 });
            }
            
            // Add a quick animation
            this.tweens.add({
                targets: randomButton,
                scale: 0.95,
                duration: 100,
                ease: 'Sine.easeInOut',
                yoyo: true,
                onComplete: () => {
                    // Place ships randomly
                    this.placeShipsRandomly();
                }
            });
            
            // Shake dice animation
            this.tweens.add({
                targets: diceIcon,
                angle: { from: -20, to: 20 },
                duration: 50,
                repeat: 5,
                ease: 'Sine.easeInOut',
                yoyo: true
            });
        });
    }

    private placeShipsRandomly(): void {
        // First, reset all ships to their original positions
        this.playerShips.forEach(ship => {
            // Get the ship's current grid position
            const gridPos = ship.getGridPosition();
            
            // If the ship was placed on the grid, remove it
            if (gridPos) {
                this.playerGrid.removeShip(
                    gridPos.row, 
                    gridPos.col, 
                    ship.getType(), 
                    ship.isHorizontalOrientation()
                );
            }
            
            // Reset the ship's placement
            ship.resetPlacement();
        });
        
        // Reset the ship counter
        this.currentShipIndex = 0;
        
        // Create a copy of the ships array to work with
        const shipsToPlace = [...this.playerShips];
        
        // Shuffle the ships to randomize placement order (larger ships first is better)
        shipsToPlace.sort((a, b) => b.getType() - a.getType());
        
        // Try to place each ship
        for (const ship of shipsToPlace) {
            let placed = false;
            let attempts = 0;
            const maxAttempts = 100; // Prevent infinite loops
            
            while (!placed && attempts < maxAttempts) {
                attempts++;
                
                // Keep current orientation - don't randomize it
                const isHorizontal = ship.isHorizontalOrientation();
                
                // Get random position
                const row = Math.floor(Math.random() * 10);
                const col = Math.floor(Math.random() * 10);
                
                // Check if the ship can be placed at these coordinates
                if (this.playerGrid.canPlaceShip(ship.getType(), row, col, isHorizontal)) {
                    // Get the world coordinates for the grid cell
                    const cellCoords = this.playerGrid.getWorldCoordinates(row, col);
                    
                    // Place the ship on the grid
                    ship.place(cellCoords.x, cellCoords.y, this.playerGrid.getCellSize());
                    
                    // Update the grid data
                    this.playerGrid.placeShip(ship, row, col);
                    
                    // Mark the ship as placed
                    ship.markAsPlaced(row, col);
                    
                    placed = true;
                }
            }
            
            // If we couldn't place the ship after max attempts, just leave it off the grid
            if (!placed) {
                console.warn(`Could not place ship of type ${ship.getType()} after ${maxAttempts} attempts`);
            }
        }
        
        // Update the ship counter
        this.updateShipCounter();
        
        // Add a visual effect to show the random placement
        const flash = this.add.rectangle(
            this.playerGrid.getX(),
            this.playerGrid.getY(),
            this.playerGrid.getWidth() + 20,
            this.playerGrid.getHeight() + 20,
            0x67e8f9,
            0.5
        );
        
        this.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 500,
            ease: 'Sine.easeOut',
            onComplete: () => {
                flash.destroy();
            }
        });
    }

    private createShipsForPlacement(): void {
        const gridSize = this.playerGrid.getCellSize();
        const startX = 100;
        const startY = 150;
        const spacing = 60;
        
        // Create ships based on configurations
        this.shipConfigs.forEach((config, index) => {
            // Calculate position (arrange in columns)
            const col = Math.floor(index / 5);
            const row = index % 5;
            const x = startX + col * (gridSize * 5);
            const y = startY + row * spacing;
            
            // Create the ship
            const ship = new Ship(this, config, false);
            
            // Position the ship
            ship.placeOriginal(x, y);
            
            // Add to the ships array
            this.playerShips.push(ship);
        });
    }

    private setupShipPlacementEvents(): void {
        // Listen for ship pickup events
        this.events.on('ship-pickup', this.handleShipPickup, this);
        
        // Listen for ship drop events
        this.events.on('ship-drop', this.handleShipDrop, this);
    }

    private selectShip(ship: Ship): void {
        this.selectedShip = ship;
    }

    private handleShipDrop(ship: Ship, x: number, y: number): void {
        // Get the grid coordinates for the drop position
        const gridCoords = this.playerGrid.getGridCoordinates(x, y);
        
        if (gridCoords) {
            const { row, col } = gridCoords;
            const isHorizontal = ship.isHorizontalOrientation();
            
            // Check if the ship can be placed at these coordinates
            if (this.playerGrid.canPlaceShip(ship.getType(), row, col, isHorizontal)) {
                // Get the world coordinates for the grid cell
                const cellCoords = this.playerGrid.getWorldCoordinates(row, col);
                
                // Place the ship on the grid
                ship.place(cellCoords.x, cellCoords.y, this.playerGrid.getCellSize());
                
                // Update the grid data
                this.playerGrid.placeShip(ship, row, col);
                
                // Mark the ship as placed
                ship.markAsPlaced(row, col);
                
                // Select this ship
                this.selectShip(ship);
                
                // Update the ship counter by counting all placed ships
                this.updateShipCounter();
                
                return;
            }
        }
        
        // If we get here, the ship couldn't be placed, so reset it
        ship.resetPlacement();
    }

    private updateShipCounter(): void {
        // Only proceed if the scene is active and not transitioning
        if (!this.scene.isActive()) return;
        
        // Count how many ships are actually placed on the grid
        let placedCount = 0;
        
        for (const ship of this.playerShips) {
            if (ship && ship.getGridPosition() !== null) {
                placedCount++;
            }
        }
        
        // Update the current ship index
        this.currentShipIndex = placedCount;
        
        // Only emit the event if we're still active
        try {
            // Find the ship counter text object
            const shipCounterText = this.children.list.find(
                child => child instanceof Phaser.GameObjects.Text && 
                        child.text.includes('Ships placed:')
            );
            
            // Only update if the text object exists
            if (shipCounterText && shipCounterText instanceof Phaser.GameObjects.Text) {
                shipCounterText.setText(`Ships placed: ${this.currentShipIndex}/${this.shipConfigs.length}`);
                
                // Change color to green when all ships are placed
                if (this.currentShipIndex >= this.shipConfigs.length) {
                    shipCounterText.setColor('#00ff00');
                } else {
                    shipCounterText.setColor('#ffffff');
                }
            }
            
            // Emit the event only if we have listeners
            if (this.events.listenerCount('ship-placed') > 0) {
                this.events.emit('ship-placed');
            }
        } catch (error) {
            console.warn('Error updating ship counter:', error);
        }
        
        console.log(`Ships placed: ${this.currentShipIndex}/${this.shipConfigs.length}`);
    }

    private handleShipPickup(ship: Ship): void {
        // Get the ship's current grid position
        const gridPos = ship.getGridPosition();
        
        // If the ship was placed on the grid, remove it
        if (gridPos) {
            this.playerGrid.removeShip(
                gridPos.row, 
                gridPos.col, 
                ship.getType(), 
                ship.isHorizontalOrientation()
            );
            
            // Update the ship counter
            this.updateShipCounter();
        }
        
        // Select this ship
        this.selectShip(ship);
    }

    shutdown() {
        // Clean up event listeners
        this.events.off('ship-pickup', this.handleShipPickup, this);
        this.events.off('ship-drop', this.handleShipDrop, this);
        this.events.off('ship-placed');
        
        // Destroy game objects
        this.playerShips.forEach(ship => {
            if (ship && ship.active) {
                ship.destroy();
            }
        });
        
        if (this.rotateButton && this.rotateButton.active) {
            this.rotateButton.destroy();
        }
        
        if (this.confirmButton && this.confirmButton.active) {
            this.confirmButton.destroy();
        }
        
        // Clear arrays
        this.playerShips = [];
    }

    update(time: number, delta: number): void {
        // Update water animation
        super.update(time, delta);
        
        // Any additional update logic...
    }

    // Reset the ship counter and placement state
    private resetShipCounter(): void {
        this.currentShipIndex = 0;
        this.playerShips = [];
        
        // Clear any existing grid data from the registry
        if (this.registry.has('player1Grid')) {
            this.registry.remove('player1Grid');
        }
        if (this.registry.has('player1Ships')) {
            this.registry.remove('player1Ships');
        }
        
        console.log('Ship counter and placement state reset');
    }
} 