import Phaser from 'phaser';
import { Ship, ShipType, ShipConfig } from '../objects';
import { Grid } from '../objects';

export class GameScene extends Phaser.Scene {
    private playerGrid!: Grid;
    private enemyGrid!: Grid;
    private playerShips: Ship[] = [];
    private enemyShips: Ship[] = [];
    private isPlayerTurn: boolean = true;
    private gameStatus!: Phaser.GameObjects.Text;
    private turnText!: Phaser.GameObjects.Text;
    private isSetupPhase: boolean = true;
    private currentShipIndex: number = 0;
    private shipConfigs: ShipConfig[] = [];
    private currentShip: Ship | null = null;
    private rotateButton!: Phaser.GameObjects.Container;
    private confirmButton!: Phaser.GameObjects.Container;
    private selectedShip: Ship | null = null;
    
    // Ocean background layers
    private waterLayer1!: Phaser.GameObjects.TileSprite;
    private waterLayer2!: Phaser.GameObjects.TileSprite;
    private waterLayer3!: Phaser.GameObjects.TileSprite;
    private waterLayer4!: Phaser.GameObjects.TileSprite;
    private waterRipples!: Phaser.GameObjects.Graphics;
    private waveTime: number = 0;
    private bubbles!: Phaser.GameObjects.Particles.ParticleEmitter;
    private gameMode: 'cpu' | 'twoPlayer' = 'cpu';

    constructor() {
        super({ key: 'GameScene' });
        // Don't set registry here - it's not initialized yet
    }

    init(): void {
        // Set game mode from registry here instead of in constructor
        this.gameMode = this.registry.get('gameMode') || 'cpu';
    }

    create(): void {
        // This scene is now only used for CPU mode
        this.createOceanBackground();
        this.initShipConfigs();
        
        // Create grids
        const screenWidth = this.cameras.main.width;
        const screenHeight = this.cameras.main.height;
        
        this.playerGrid = new Grid(this, 300, screenHeight/2, 10, 10, 'Your Fleet');
        this.enemyGrid = new Grid(this, 900, screenHeight/2, 10, 10, 'Enemy Fleet');
        
        // Create UI
        this.createUI();
        
        // Start setup phase
        this.startSetupPhase();
    }

    update(time: number, delta: number): void {
        // Update water effects
        this.updateWaterRipples();
        
        // Animate water layers
        this.waterLayer1.tilePositionX += 0.05;
        this.waterLayer2.tilePositionX -= 0.1;
        this.waterLayer3.tilePositionX += 0.2;
        this.waterLayer4.tilePositionY += 0.1;
        
        // Update wave time
        this.waveTime += delta / 1000;
    }

    private createUI(): void {
        // Game title
        const titleText = this.add.text(
            this.cameras.main.width / 2,
            50,
            'BATTLESHIP',
            {
                fontFamily: 'Arial',
                fontSize: '48px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4
            }
        );
        titleText.setOrigin(0.5);

        // Game status text
        this.gameStatus = this.add.text(
            this.cameras.main.width / 2,
            100,
            '',
            {
                fontFamily: 'Arial',
                fontSize: '24px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 2
            }
        );
        this.gameStatus.setOrigin(0.5);

        // Turn indicator
        this.turnText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height - 50,
            '',
            {
                fontFamily: 'Arial',
                fontSize: '28px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 3
            }
        );
        this.turnText.setOrigin(0.5);

        // Home button
        const homeButton = this.add.text(
            100,
            50,
            'MENU',
            {
                fontFamily: 'Arial',
                fontSize: '24px',
                color: '#ffffff',
                backgroundColor: '#333333',
                padding: { x: 10, y: 5 }
            }
        );
        homeButton.setInteractive({ useHandCursor: true });
        homeButton.on('pointerdown', () => {
            // Completely shutdown current game
            this.scene.stop();
            this.scene.start('MainMenuScene');
        });

        // Create a stylish naval-themed rotate button
        this.createRotateButton();
        
        // Create confirm buttons for both players
        this.createConfirmButton();
    }

    private createRotateButton(): void {
        // Position the button to the left of the player grid with a gap
        const x = this.playerGrid.getX() - this.playerGrid.getWidth()/2 - 50; // Left of player grid with 80px gap
        const y = this.playerGrid.getY(); // Same vertical position as grid center
        
        // Create a container for the rotate button
        const container = this.add.container(x, y);
        
        // Button dimensions
        const buttonSize = 80;
        
        // Create circular background
        const buttonBg = this.add.graphics();
        buttonBg.fillStyle(0x1a5276, 1);
        buttonBg.fillCircle(0, 0, buttonSize/2);
        
        // Add metallic border
        buttonBg.lineStyle(4, 0x3498db, 0.8);
        buttonBg.strokeCircle(0, 0, buttonSize/2);
        
        // Add rivets for naval look
        const rivetPositions = [
            { x: -buttonSize/2 + 10, y: 0 },
            { x: buttonSize/2 - 10, y: 0 },
            { x: 0, y: -buttonSize/2 + 10 },
            { x: 0, y: buttonSize/2 - 10 }
        ];
        
        const rivets = rivetPositions.map(pos => {
            const rivet = this.add.circle(pos.x, pos.y, 5, 0xd0d0d0);
            rivet.setStrokeStyle(1, 0x808080);
            return rivet;
        });
        
        // Create rotate arrow icon
        const arrowGraphics = this.add.graphics();
        arrowGraphics.lineStyle(6, 0xffffff, 1);
        
        // Draw circular arrow
        const radius = buttonSize/2 - 20;
        arrowGraphics.beginPath();
        arrowGraphics.arc(0, 0, radius, Phaser.Math.DegToRad(0), Phaser.Math.DegToRad(270), true);
        arrowGraphics.strokePath();
        
        // Draw arrowhead
        arrowGraphics.lineStyle(6, 0xffffff, 1);
        arrowGraphics.beginPath();
        arrowGraphics.moveTo(0, -radius - 10);
        arrowGraphics.lineTo(0, -radius + 10);
        arrowGraphics.lineTo(10, -radius);
        arrowGraphics.strokePath();
        
        // Add label
        const label = this.add.text(0, buttonSize/2 + 15, 'ROTATE', {
            fontFamily: 'Impact',
            fontSize: '18px',
                color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        });
        label.setOrigin(0.5);
        
        // Add all elements to container
        container.add([buttonBg, ...rivets, arrowGraphics, label]);
        
        // Make button interactive
        container.setSize(buttonSize, buttonSize);
        container.setInteractive({ useHandCursor: true });
        
        // Add hover effects
        container.on('pointerover', () => {
            buttonBg.clear();
            
            // Brighter background on hover
            buttonBg.fillStyle(0x2980b9, 1);
            buttonBg.fillCircle(0, 0, buttonSize/2);
            
            // Brighter border
            buttonBg.lineStyle(4, 0x67e8f9, 1);
            buttonBg.strokeCircle(0, 0, buttonSize/2);
            
            // Scale up slightly
            container.setScale(1.1);
            
            // Play sound if available
            if (this.sound.get('click')) {
                this.sound.play('click', { volume: 0.3 });
            }
        });
        
        container.on('pointerout', () => {
            buttonBg.clear();
            
            // Return to normal state
            buttonBg.fillStyle(0x1a5276, 1);
            buttonBg.fillCircle(0, 0, buttonSize/2);
            
            buttonBg.lineStyle(4, 0x3498db, 0.8);
            buttonBg.strokeCircle(0, 0, buttonSize/2);
            
            // Return to normal scale
            container.setScale(1);
        });
        
        // Add click effect with rotation animation
        container.on('pointerdown', () => {
            // Play sound if available
            if (this.sound.get('click')) {
                this.sound.play('click', { volume: 0.5 });
            }
            
            // Add rotation animation
            this.tweens.add({
                targets: arrowGraphics,
                angle: 360,
                duration: 1500,
                ease: 'Cubic.easeInOut',
                onComplete: () => {
                    // Reset rotation when animation completes
                    arrowGraphics.setAngle(0);
                }
            });
            
            // Rotate the selected ship if any
            if (this.selectedShip && this.playerShips.includes(this.selectedShip)) {
                this.selectedShip.rotate();
            }
        });
        
        // Store the button for later use
        this.rotateButton = container;
        this.rotateButton.setVisible(false);
    }

    private createConfirmButton(): void {
        // Position the button at the bottom of player 1 grid, aligned with the grid's bottom edge
        const x = this.playerGrid.getX(); // Center of player grid
        const y = this.playerGrid.getY() + this.playerGrid.getHeight()/2 + 50; // Bottom of player grid
        
        // Create a container for the confirm button
        const container = this.add.container(x, y);
        
        // Button dimensions
        const buttonWidth = 189;
        const buttonHeight = 60;
        
        // Create metallic background
        const buttonBg = this.add.graphics();
        
        // Main button body - metallic navy blue (player 1 color)
        buttonBg.fillStyle(0x1a5276, 1);
        buttonBg.fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 10);
        
        // Add metallic highlight
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
        
        // Add anchor icon
        const anchorIcon = this.add.image(-buttonWidth/2 + 30, 0, 'miss');
        anchorIcon.setScale(0.8);
        anchorIcon.setTint(0xd4af37); // Gold color
        
        // Button text with naval style
        const buttonText = this.add.text(10, 0, 'CONFIRM FLEET', {
            fontFamily: 'Impact',
            fontSize: '24px',
                color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        });
        buttonText.setOrigin(0.5);
        
        // Add all elements to container
        container.add([buttonBg, ...rivets, anchorIcon, buttonText]);
        
        // Make button interactive
        container.setSize(buttonWidth, buttonHeight);
        container.setInteractive({ useHandCursor: true });
        
        // Add hover effects
        container.on('pointerover', () => {
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
            container.setScale(1.05);
            
            // Play sound if available
            if (this.sound.get('click')) {
                this.sound.play('click', { volume: 0.5 });
            }
        });
        
        container.on('pointerout', () => {
            buttonBg.clear();
            
            // Return to normal state
            buttonBg.fillStyle(0x1a5276, 1);
            buttonBg.fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 10);
            
            buttonBg.fillStyle(0x2980b9, 0.7);
            buttonBg.fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight/2, 10);
            
            buttonBg.lineStyle(3, 0x3498db);
            buttonBg.strokeRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 10);
            
            // Return to normal scale
            container.setScale(1);
        });
        
        container.on('pointerdown', () => {
            // Pressed state
            buttonBg.clear();
            
            // Darker background when pressed
            buttonBg.fillStyle(0x154360, 1);
            buttonBg.fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 10);
            
            buttonBg.fillStyle(0x1a5276, 0.7);
            buttonBg.fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight/2, 10);
            
            buttonBg.lineStyle(3, 0x3498db);
            buttonBg.strokeRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 10);
            
            // Scale down slightly
            container.setScale(0.95);
            
            // Check if all ships are placed based on current setup phase
            const allShipsPlaced = this.playerShips.every(ship => 
                ship.getGridPosition() !== null);
            
            if (allShipsPlaced) {
                this.startGame();
            } else {
                this.updateGameStatus('Please place all ships before starting!');
            }
        });
        
        // Store the button for later use
        this.confirmButton = container;
        this.confirmButton.setVisible(false);
    }

    private initShipConfigs(): void {
        // Small ships (1 cell) - 4 of these
        for (let i = 0; i < 4; i++) {
            this.shipConfigs.push({ type: ShipType.Small, imageKey: 'ship1' });
            
        }
        
        // Medium ships (2 cells) - 3 of these
        for (let i = 0; i < 3; i++) {
            this.shipConfigs.push({ type: ShipType.Medium, imageKey: 'ship2' });
        }
        
        // Large ships (3 cells) - 2 of these
        for (let i = 0; i < 2; i++) {
            this.shipConfigs.push({ type: ShipType.Large, imageKey: 'ship3' });
        }
        
        // Huge ship (4 cells) - 1 of these
        this.shipConfigs.push({ type: ShipType.Huge, imageKey: 'ship4' });
    }

    private startSetupPhase(): void {
        this.isSetupPhase = true;
        
        this.updateGameStatus('Drag and drop your ships onto the grid!');
        this.updateTurnText('Setup Phase');
        
        // Show setup controls
        this.rotateButton.setVisible(true);
        this.confirmButton.setVisible(true);
        
        // Create all ships and place them in a row below the player grid
        this.createShipsForPlacement();
    }

    private createShipsForPlacement(): void {
        const gridSize = 40;
        const gridX = this.playerGrid.getX();
        const startY = this.cameras.main.height - 80;
        let currentX = gridX - (this.playerGrid.getWidth() / 2);

        // 1. Small ships (4 total)
        // First row (2 ships)
        for (let i = 0; i < 2; i++) {
            const ship = new Ship(this, { type: ShipType.Small, imageKey: `ship1` });
            ship.place(currentX + (i * (gridSize + 1)), startY - gridSize - 1, gridSize);
            ship.setDepth(1000);
            ship.setInteractive({ useHandCursor: true });
            this.input.setDraggable(ship);
            this.playerShips.push(ship);
        }
        
        // Second row (2 ships)
        for (let i = 0; i < 2; i++) {
            const ship = new Ship(this, { type: ShipType.Small, imageKey: `ship1` });
            ship.place(currentX + (i * (gridSize + 1)), startY, gridSize);
            ship.setDepth(1000);
            ship.setInteractive({ useHandCursor: true });
            this.input.setDraggable(ship);
            this.playerShips.push(ship);
        }
        
        // Calculate small ships group width
        const smallShipGroupWidth = 2 * gridSize + 1;
        
        // Add 1-gap after small ships
        currentX += smallShipGroupWidth + 8;

        // 2. Add medium ships (ship2) with vertical orientation
        for (let i = 0; i < 3; i++) {
            const ship = new Ship(this, { 
                type: ShipType.Medium, 
                imageKey: 'ship2' 
            });
            
            // Load and place with original vertical orientation
            ship.placeOriginal(currentX, startY);
            
            // Set up ship properties
            ship.setDepth(1000);
            ship.setInteractive({ useHandCursor: true });
            this.input.setDraggable(ship);
            this.playerShips.push(ship);

            // Get the actual width of the ship for proper spacing
            // Add a fixed gap to ensure no overlap
            currentX += ship.width + 20; // Increased gap to 5px for better visibility
        }
        
        // 3. Large ships (2 total)
        currentX += 8;
        for (let i = 0; i < 2; i++) {
            const ship = new Ship(this, { type: ShipType.Large, imageKey: `ship3` });
            ship.place(currentX, startY, gridSize);
            ship.setDepth(1000);
            ship.setInteractive({ useHandCursor: true });
            this.input.setDraggable(ship);
            this.playerShips.push(ship);
            currentX += gridSize;
        }
        
        // 4. Huge ship (1 total)
        currentX += 8;
        const hugeShip = new Ship(this, { type: ShipType.Huge, imageKey: `ship4` });
        hugeShip.place(currentX, startY, gridSize);
        hugeShip.setDepth(1000);
        hugeShip.setInteractive({ useHandCursor: true });
        this.input.setDraggable(hugeShip);
        this.playerShips.push(hugeShip);

        // Setup events
        this.setupShipPlacementEvents();
    }

    private setupShipPlacementEvents(): void {
        // Listen for ship drop events
        this.events.on('ship-drop', this.handleShipDrop, this);
        
        // Listen for ship pickup events
        this.events.on('ship-pickup', this.handleShipPickup, this);
        
        // Make ships selectable by clicking
        this.playerShips.forEach(ship => {
            ship.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
                // Check if we're not currently dragging anything
                if (!this.input.mousePointer.isDown) {
                    this.selectShip(ship);
                }
            });
        });
        
        // Set up rotate button to rotate the selected ship
        this.rotateButton.off('pointerdown');
        this.rotateButton.on('pointerdown', () => {
            if (this.selectedShip && this.selectedShip.getGridPosition()) {
                const gridPos = this.selectedShip.getGridPosition();
                if (gridPos) {
                    const { row, col } = gridPos;
                    const shipType = this.selectedShip.getType();
                    const isHorizontal = this.selectedShip.isHorizontalOrientation();
                    
                    // First, temporarily remove the ship from the grid
                    this.playerGrid.removeShip(row, col, shipType, isHorizontal);
                    
                    // Check if rotation is valid
                    if (this.playerGrid.canPlaceShip(shipType, row, col, !isHorizontal)) {
                        // Rotate the ship
                        this.selectedShip.rotate();
                        
                        // Place ship in new orientation
                        this.playerGrid.placeShip(this.selectedShip, row, col);
                        
                        // Play rotation sound if available
                        if (this.sound.get('click')) {
                            this.sound.play('click', { volume: 0.7 });
                        }
                        
                        console.log(`Rotated ship at (${row}, ${col})`);
                    } else {
                        // If rotation is not valid, place the ship back in its original orientation
                        this.playerGrid.placeShip(this.selectedShip, row, col);
                        this.updateGameStatus('Cannot rotate ship here - not enough space!');
                    }
                }
            }
        });
    }

    private selectShip(ship: Ship): void {
        // Deselect previous ship if any
        if (this.selectedShip) {
            this.selectedShip.setTint(0xffffff);
        }
        
        // Select new ship
        this.selectedShip = ship;
        ship.setTint(0x88ff88); // Light green tint to show selection
        
        this.updateGameStatus(`Selected ${this.getShipTypeName(ship.getType())} ship`);
    }

    private handleShipDrop(ship: Ship, x: number, y: number): void {
        // Get the grid coordinates for the drop position
        const gridCoords = this.playerGrid.getGridCoordinates(x, y);
        
        if (gridCoords) {
            const { row, col } = gridCoords;
            
            // Check if the ship can be placed at this position
            const shipType = ship.getType();
            const isHorizontal = ship.isHorizontalOrientation();
            
            console.log(`Attempting to place ${isHorizontal ? 'horizontal' : 'vertical'} ship of type ${shipType} at grid position (${row}, ${col})`);
            
            if (this.playerGrid.canPlaceShip(shipType, row, col, isHorizontal)) {
                // Place the ship on the grid
                this.playerGrid.placeShip(ship, row, col);
                
                // Mark the ship as placed
                ship.markAsPlaced(row, col);
                
                // Get the exact world coordinates for the cell where the ship was dropped
                const gridPos = this.playerGrid.getWorldCoordinates(row, col);
                
                // Update the ship's position to align with the grid
                ship.setPosition(gridPos.x, gridPos.y);
                
                // Select the ship
                this.selectShip(ship);
                
                // Update game status
                this.updateGameStatus(`${this.getShipTypeName(shipType)} ship placed! You can now rotate it.`);
            } else {
                // Invalid placement, return the ship to its original position
                ship.resetPlacement();
                this.updateGameStatus('Invalid placement! Try another position.');
            }
        } else {
            // Dropped outside the grid, return the ship to its original position
            ship.resetPlacement();
        }
    }

    private handleShipPickup(ship: Ship): void {
        // Remove the ship from the grid
        const gridPos = ship.getGridPosition();
        if (gridPos) {
            this.playerGrid.removeShip(gridPos.row, gridPos.col, ship.getType(), ship.isHorizontalOrientation());
        }
    }

    private startGame(): void {
        // If this is a CPU game, transition to Player1SetupScene
        if (this.gameMode === 'cpu') {
            // Store the game mode in the registry
            this.registry.set('gameMode', 'cpu');
            
            // Transition to Player1SetupScene
            this.scene.start('Player1SetupScene');
        } else {
            // Original two-player game logic...
        }
    }

    private setupEnemyShips(): void {
        // This will be implemented to randomly place enemy ships
        console.log('Enemy ships would be set up here');
    }

    private updateGameStatus(message: string): void {
        this.gameStatus.setText(message);
    }

    private updateTurnText(text: string): void {
        this.turnText.setText(text);
    }

    private createOceanBackground(): void {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Create multiple layers of water tiles for depth and movement
        // Base layer - water1 tile
        this.waterLayer1 = this.add.tileSprite(0, 0, width, height, 'water1');
        this.waterLayer1.setOrigin(0, 0);
        this.waterLayer1.setAlpha(0.9);
        
        // Second layer - water2 tile
        this.waterLayer2 = this.add.tileSprite(0, 0, width, height, 'water2');
        this.waterLayer2.setOrigin(0, 0);
        this.waterLayer2.setAlpha(0.6);
        this.waterLayer2.setBlendMode(Phaser.BlendModes.OVERLAY);
        
        // Third layer - water1 tile (rotated)
        this.waterLayer3 = this.add.tileSprite(0, 0, width, height, 'water1');
        this.waterLayer3.setOrigin(0, 0);
        this.waterLayer3.setAlpha(0.4);
        this.waterLayer3.setAngle(90); // Rotate for variation
        this.waterLayer3.setBlendMode(Phaser.BlendModes.SCREEN);
        
        // Fourth layer - water2 tile (scaled)
        this.waterLayer4 = this.add.tileSprite(0, 0, width, height, 'water2');
        this.waterLayer4.setOrigin(0, 0);
        this.waterLayer4.setAlpha(0.3);
        this.waterLayer4.setScale(1.5); // Larger scale for different pattern
        this.waterLayer4.setBlendMode(Phaser.BlendModes.OVERLAY);
        
        // Add a subtle blue tint to enhance water appearance
        this.waterLayer1.setTint(0xadd8e6);
        this.waterLayer4.setTint(0x0077be);
        
        // Create graphics for ripple effects
        this.waterRipples = this.add.graphics();
        
        // Add bubble particles for underwater effect
        this.createBubbleEffect();
    }
    
    private updateWaterRipples(): void {
        // Clear previous ripples
        this.waterRipples.clear();
        
        // Draw subtle ripple patterns
        this.waterRipples.lineStyle(1, 0xffffff, 0.2);
        
        // Create multiple ripple lines
        for (let i = 0; i < 8; i++) {
            const yBase = 100 + i * 100;
            this.waterRipples.beginPath();
            
            // Draw a wavy line across the screen
            for (let x = 0; x < this.cameras.main.width; x += 10) {
                // Use multiple sine waves with different frequencies
                const y = yBase + 
                    Math.sin((x * 0.01) + (this.waveTime * 2) + i) * 5 + 
                    Math.sin((x * 0.03) + (this.waveTime * 1.5)) * 2;
                
                if (x === 0) {
                    this.waterRipples.moveTo(x, y);
                } else {
                    this.waterRipples.lineTo(x, y);
                }
            }
            
            this.waterRipples.strokePath();
        }
    }
    
    private createBubbleEffect(): void {
        // Create subtle bubbles for water effect
        this.bubbles = this.add.particles(0, 0, 'miss', {
            x: { min: 0, max: this.cameras.main.width },
            y: this.cameras.main.height + 10,
            speed: { min: 10, max: 30 },
            angle: { min: 265, max: 275 },
            scale: { start: 0.05, end: 0.1 },
            alpha: { start: 0.2, end: 0 },
            lifespan: { min: 5000, max: 8000 },
            quantity: 1,
            frequency: 1000,
            blendMode: Phaser.BlendModes.SCREEN,
            gravityY: -20
        });
    }

    private getShipTypeName(type: ShipType): string {
        switch (type) {
            case ShipType.Small: return 'Small';
            case ShipType.Medium: return 'Medium';
            case ShipType.Large: return 'Large';
            case ShipType.Huge: return 'Huge';
            default: return 'Unknown';
        }
    }

    shutdown() {
        // Clean up event listeners and game objects
        this.events.off('ship-pickup');
        this.events.off('ship-drop');
        
        // Destroy all ships
        this.playerShips.forEach(ship => ship.destroy());
        this.enemyShips.forEach(ship => ship.destroy());
        
        // Destroy UI elements
        if (this.rotateButton) this.rotateButton.destroy();
        if (this.confirmButton) this.confirmButton.destroy();
    }
} 