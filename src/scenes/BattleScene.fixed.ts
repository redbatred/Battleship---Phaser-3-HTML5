import Phaser from 'phaser';
import { Grid, Ship, ShipType } from '../objects';
import { BaseScene } from './BaseScene';
import RexUIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin';

export class BattleScene extends BaseScene {
    private player1Grid!: Grid;
    private player2Grid!: Grid;
    private player1Ships: Ship[] = [];
    private player2Ships: Ship[] = [];
    private isPlayer1Turn: boolean = true;
    private player1HitCells: Map<string, boolean> = new Map();
    private player2HitCells: Map<string, boolean> = new Map();
    private player1HitMarkers: Phaser.GameObjects.Image[] = [];
    private player2HitMarkers: Phaser.GameObjects.Image[] = [];
    private player1MissMarkers: Phaser.GameObjects.Image[] = [];
    private player2MissMarkers: Phaser.GameObjects.Image[] = [];
    private player1DestroyedShips: Phaser.GameObjects.Rectangle[] = [];
    private player2DestroyedShips: Phaser.GameObjects.Rectangle[] = [];
    private gameStatus!: Phaser.GameObjects.Text;
    private turnText!: Phaser.GameObjects.Text;
    private menuButton!: Phaser.GameObjects.Container;
    private hits1: number = 0;
    private hits2: number = 0;
    private totalShipCells1: number = 0;
    private totalShipCells2: number = 0;
    private destroyedShips: Set<Ship>;
    private shipVisibilityMap: Map<Ship, { visible: boolean, destroyed: boolean }>;
    protected targetIndicator?: Phaser.GameObjects.Rectangle;

    constructor() {
        super({ key: 'BattleScene' });
        this.destroyedShips = new Set<Ship>();
        this.shipVisibilityMap = new Map();
    }

    init(): void {
        // Get the grids and ships from the registry
        this.player1Grid = this.registry.get('player1Grid');
        this.player1Ships = this.registry.get('player1Ships') || [];
        this.player2Grid = this.registry.get('player2Grid');
        this.player2Ships = this.registry.get('player2Ships') || [];
        
        // Store original grids for cleanup
        this.registry.set('originalPlayer1Grid', this.player1Grid);
        this.registry.set('originalPlayer2Grid', this.player2Grid);
        
        // Reset turn to player 1
        this.isPlayer1Turn = true;
        
        // Reset hit counters
        this.hits1 = 0;
        this.hits2 = 0;
        
        // Reset destroyed ships tracking
        this.destroyedShips.clear();
        this.shipVisibilityMap.clear();
        
        // Initialize visibility map for all ships
        const allShips = [...this.player1Ships];
        if (Array.isArray(this.player2Ships)) {
            allShips.push(...this.player2Ships);
        }
        
        allShips.forEach(ship => {
            this.shipVisibilityMap.set(ship, {visible: false, destroyed: false});
        });
        
        // Calculate total ship cells for win condition
        this.totalShipCells1 = this.calculateTotalShipCells(this.player1Ships);
        this.totalShipCells2 = this.calculateTotalShipCells(this.player2Ships);
        
        console.log(`Player 1 has ${this.totalShipCells1} ship cells`);
        console.log(`Player 2 has ${this.totalShipCells2} ship cells`);
    }

    create(): void {
        super.create();
        
        console.log('BattleScene: create');
        
        // Get the game mode
        const gameMode = this.registry.get('gameMode');
        const isCPUMode = gameMode === 'cpu';
        
        // Create new grids since the original ones might not render properly
        this.recreateGrids();
        
        // Create UI elements
        this.createUI();
        
        // Set up input handlers for the grids
        this.setupInputHandlers();
        
        // Add debug end game button
        this.createDebugEndGameButton();
        
        // Start with player 1's turn
        this.updateTurnText(`${this.isPlayer1Turn ? 'Player 1' : 'Player 2'}'s turn`);
        this.updateGameStatus('Click on Player 2\'s grid to attack');
        
        // Update ship visibility
        this.updateShipVisibility();
        
        // Debug ship visibility
        this.debugShipVisibility();
        
        // Set up event listeners
        this.events.on('endTurn', this.switchTurn, this);
        
        // If in CPU mode, add CPU label
        if (isCPUMode) {
            const screenWidth = this.cameras.main.width;
            const cpuLabel = this.add.text(
                screenWidth - 150,
                30,
                'CPU OPPONENT',
                {
                    fontFamily: 'Impact',
                    fontSize: '20px',
                    color: '#ff0000',
                    stroke: '#000000',
                    strokeThickness: 2
                }
            );
            cpuLabel.setOrigin(0.5);
            
            // Add a pulsing effect to the CPU label
            this.tweens.add({
                targets: cpuLabel,
                scale: { from: 1, to: 1.1 },
                duration: 1000,
                ease: 'Sine.easeInOut',
                yoyo: true,
                repeat: -1
            });
            
            // Add difficulty indicator
            const difficultyLabel = this.add.text(
                screenWidth - 150,
                60,
                'DIFFICULTY: SMART',
                {
                    fontFamily: 'Arial',
                    fontSize: '14px',
                    color: '#ffffff',
                    stroke: '#000000',
                    strokeThickness: 1
                }
            );
            difficultyLabel.setOrigin(0.5);
            
            // Listen for turn changes to handle CPU moves
            this.events.on('turnChanged', this.onCPUTurnChanged, this);
        }
    }

    private calculateTotalShipCells(ships: Ship[]): number {
        if (!Array.isArray(ships)) {
            return 0;
        }
        return ships.reduce((total, ship) => total + ship.getType(), 0);
    }

    private recreateGrids(): void {
        const screenWidth = this.cameras.main.width;
        
        // We'll create our own grid visuals instead of using the Grid class
        // This prevents the small grid in the top-left corner
        
        // Position player 1's ships
        if (Array.isArray(this.player1Ships)) {
            this.player1Ships.forEach(ship => {
                const pos = ship.getGridPosition();
                if (pos) {
                    const { row, col } = pos;
                    const cellCoords = this.player1Grid.getWorldCoordinates(row, col);
                    
                    // Place the ship at the correct position
                    ship.place(cellCoords.x, cellCoords.y, this.player1Grid.getCellSize());
                    
                    // Update the grid data
                    this.player1Grid.placeShip(ship, row, col);
                    
                    // Make sure the ship is marked as placed
                    ship.markAsPlaced(row, col);
                    
                    // Set initial visibility state
                    ship.setVisible(false);
                    ship.setDepth(10);
                }
            });
        }
        
        // Position player 2's ships
        if (Array.isArray(this.player2Ships)) {
            this.player2Ships.forEach(ship => {
                const pos = ship.getGridPosition();
                if (pos) {
                    const { row, col } = pos;
                    const cellCoords = this.player2Grid.getWorldCoordinates(row, col);
                    
                    // Place the ship at the correct position
                    ship.place(cellCoords.x, cellCoords.y, this.player2Grid.getCellSize());
                    
                    // Update the grid data
                    this.player2Grid.placeShip(ship, row, col);
                    
                    // Make sure the ship is marked as placed
                    ship.markAsPlaced(row, col);
                    
                    // Set initial visibility state
                    ship.setVisible(false);
                    ship.setDepth(10);
                }
            });
        }
        
        // Apply initial visibility
        this.applyShipVisibility();
    }

    protected updateShipVisibility(): void {
        console.log("Updating ship visibility");
        
        // Update visibility state in our map
        const allShips = [...this.player1Ships];
        if (Array.isArray(this.player2Ships)) {
            allShips.push(...this.player2Ships);
        }
        
        allShips.forEach(ship => {
            const state = this.shipVisibilityMap.get(ship);
            if (state) {
                // If the ship is destroyed, keep it visible
                if (state.destroyed) {
                    state.visible = true;
                } else {
                    // Otherwise, show only the current player's ships
                    if (this.isPlayer1Turn) {
                        state.visible = this.player1Ships.includes(ship);
                    } else {
                        state.visible = this.player2Ships.includes(ship);
                    }
                }
            }
        });
        
        // Apply the visibility states
        this.applyShipVisibility();
    }

    private applyShipVisibility(): void {
        // Apply visibility to player 1 ships
        if (Array.isArray(this.player1Ships)) {
            this.player1Ships.forEach(ship => {
                const state = this.shipVisibilityMap.get(ship);
                if (state) {
                    ship.setVisible(state.visible);
                }
            });
        }
        
        // Apply visibility to player 2 ships
        if (Array.isArray(this.player2Ships)) {
            this.player2Ships.forEach(ship => {
                const state = this.shipVisibilityMap.get(ship);
                if (state) {
                    ship.setVisible(state.visible);
                }
            });
        }
    }

    private createUI(): void {
        const screenWidth = this.cameras.main.width;
        const screenHeight = this.cameras.main.height;
        
        // Create game status text
        this.gameStatus = this.add.text(
            screenWidth / 2, 
            50, 
            'BATTLE PHASE', 
            {
                fontFamily: 'Impact',
                fontSize: '32px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4
            }
        );
        this.gameStatus.setOrigin(0.5);
        
        // Create turn text
        this.turnText = this.add.text(
            screenWidth / 2, 
            100, 
            'PLAYER 1\'S TURN', 
            {
                fontFamily: 'Impact',
                fontSize: '28px',
                color: '#3498db',
                stroke: '#000000',
                strokeThickness: 3
            }
        );
        this.turnText.setOrigin(0.5);
        
        // Create main menu button
        this.createMainMenuButton();
        
        // Add player labels with larger, more visible text
        const player1Label = this.add.text(
            this.player1Grid.getX(),
            this.player1Grid.getY() - this.player1Grid.getHeight()/2 - 50,
            'PLAYER 1',
            {
                fontFamily: 'Impact',
                fontSize: '28px',
                color: '#3498db',
                stroke: '#000000',
                strokeThickness: 4
            }
        );
        player1Label.setOrigin(0.5);
        
        const player2Label = this.add.text(
            this.player2Grid.getX(),
            this.player2Grid.getY() - this.player2Grid.getHeight()/2 - 50,
            'PLAYER 2',
            {
                fontFamily: 'Impact',
                fontSize: '28px',
                color: '#e74c3c',
                stroke: '#000000',
                strokeThickness: 4
            }
        );
        player2Label.setOrigin(0.5);
    }

    private createMainMenuButton(): void {
        // Create a container for the button
        this.menuButton = this.add.container(100, 50);
        
        // Button background
        const bg = this.add.graphics();
        bg.fillStyle(0x3498db, 0.8);
        bg.fillRoundedRect(-75, -20, 150, 40, 10);
        bg.lineStyle(2, 0xffffff);
        bg.strokeRoundedRect(-75, -20, 150, 40, 10);
        
        // Button text
        const text = this.add.text(0, 0, 'MAIN MENU', {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#ffffff',
            fontStyle: 'bold'
        });
        text.setOrigin(0.5);
        
        // Add to container
        this.menuButton.add([bg, text]);
        
        // Make interactive
        this.menuButton.setSize(150, 40);
        this.menuButton.setInteractive({ useHandCursor: true });
        
        // Add hover effect
        this.menuButton.on('pointerover', () => {
            bg.clear();
            bg.fillStyle(0x2980b9, 0.9);
            bg.fillRoundedRect(-75, -20, 150, 40, 10);
            bg.lineStyle(2, 0xffffff);
            bg.strokeRoundedRect(-75, -20, 150, 40, 10);
        });
        
        this.menuButton.on('pointerout', () => {
            bg.clear();
            bg.fillStyle(0x3498db, 0.8);
            bg.fillRoundedRect(-75, -20, 150, 40, 10);
            bg.lineStyle(2, 0xffffff);
            bg.strokeRoundedRect(-75, -20, 150, 40, 10);
        });
        
        // Add click handler
        this.menuButton.on('pointerdown', () => {
            this.returnToMainMenu();
        });
    }

    private returnToMainMenu(): void {
        // Clean up and return to main menu
        this.scene.start('MainMenuScene');
    }

    private setupInputHandlers(): void {
        // Make the grids interactive
        this.makeGridInteractive(this.player1Grid, true);
        this.makeGridInteractive(this.player2Grid, false);
    }

    private makeGridInteractive(grid: Grid, isPlayer1Grid: boolean): void {
        const gridWidth = grid.getWidth();
        const gridHeight = grid.getHeight();
        const gridX = grid.getX() - gridWidth / 2;
        const gridY = grid.getY() - gridHeight / 2;
        
        // Create an interactive zone over the grid
        const interactiveZone = this.add.zone(gridX, gridY, gridWidth, gridHeight);
        interactiveZone.setOrigin(0, 0);
        interactiveZone.setInteractive();
        
        // Set cursor to pointer when hovering over the grid
        if (interactiveZone.input) {
            interactiveZone.input.cursor = 'pointer';
        }
        
        // Handle clicks on the grid
        interactiveZone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            // Only allow clicks on the enemy grid during your turn
            if ((isPlayer1Grid && !this.isPlayer1Turn) || (!isPlayer1Grid && this.isPlayer1Turn)) {
                this.handleAttack(pointer, grid, isPlayer1Grid);
            }
        });
        
        // Handle hover over the grid
        interactiveZone.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            // Only show target indicator on the enemy grid during your turn
            if ((isPlayer1Grid && !this.isPlayer1Turn) || (!isPlayer1Grid && this.isPlayer1Turn)) {
                this.showTargetIndicator(pointer, grid);
            }
        });
        
        // Handle pointer leaving the grid
        interactiveZone.on('pointerout', () => {
            if (this.targetIndicator) {
                this.targetIndicator.setVisible(false);
            }
        });
    }

    protected updateGameStatus(message: string): void {
        this.gameStatus.setText(message);
    }

    protected updateTurnText(text: string): void {
        this.turnText.setText(text);
        
        // Set color based on whose turn it is
        if (text.includes('Player 1')) {
            this.turnText.setColor('#3498db');
        } else if (text.includes('Player 2')) {
            this.turnText.setColor('#e74c3c');
        } else {
            this.turnText.setColor('#ffffff');
        }
    }

    private debugShipVisibility(): void {
        console.log("--- DEBUG SHIP VISIBILITY ---");
        console.log(`Destroyed ships count: ${this.destroyedShips.size}`);
        
        console.log("Player 1 ships:");
        if (Array.isArray(this.player1Ships)) {
            this.player1Ships.forEach((ship, index) => {
                console.log(`Ship ${index}: visible=${ship.visible}, alpha=${ship.alpha}, destroyed=${this.destroyedShips.has(ship)}`);
            });
        }
        
        console.log("Player 2 ships:");
        if (Array.isArray(this.player2Ships)) {
            this.player2Ships.forEach((ship, index) => {
                console.log(`Ship ${index}: visible=${ship.visible}, alpha=${ship.alpha}, destroyed=${this.destroyedShips.has(ship)}`);
            });
        }
    }

    private createDebugEndGameButton(): void {
        // Create a debug button to force end the game
        const debugButton = this.add.container(this.cameras.main.width - 100, 50);
        
        // Button background
        const bg = this.add.graphics();
        bg.fillStyle(0xff0000, 0.7);
        bg.fillRoundedRect(-75, -20, 150, 40, 10);
        bg.lineStyle(2, 0xffffff);
        bg.strokeRoundedRect(-75, -20, 150, 40, 10);
        
        // Button text
        const text = this.add.text(0, 0, 'END GAME', {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#ffffff',
            fontStyle: 'bold'
        });
        text.setOrigin(0.5);
        
        // Add to container
        debugButton.add([bg, text]);
        
        // Make interactive
        debugButton.setSize(150, 40);
        debugButton.setInteractive({ useHandCursor: true });
        
        // Add click handler
        debugButton.on('pointerdown', () => {
            // Force end the game
            this.endGame('Player 1 wins!');
        });
    }

    private switchTurn(): void {
        this.isPlayer1Turn = !this.isPlayer1Turn;
        this.updateTurnText(`${this.isPlayer1Turn ? 'Player 1' : 'Player 2'}'s turn`);
        this.updateShipVisibility();
        
        // Emit an event that the turn has changed
        this.events.emit('turnChanged');
    }

    private onCPUTurnChanged(): void {
        // If it's the CPU's turn (player 2), make a move after a delay
        if (!this.isPlayer1Turn) {
            // Add a delay to simulate CPU thinking
            this.time.delayedCall(800, this.makeCPUMove, [], this);
        }
    }

    private makeCPUMove(): void {
        // CPU move logic would go here
        console.log("CPU making a move");
    }

    private endGame(result: string): void {
        // End game logic would go here
        console.log("Game ended:", result);
    }

    private showTargetIndicator(pointer: Phaser.Input.Pointer, grid: Grid): void {
        // Target indicator logic would go here
        console.log("Showing target indicator");
    }

    private handleAttack(pointer: Phaser.Input.Pointer, grid: Grid, isPlayer1Grid: boolean): void {
        // Attack handling logic would go here
        console.log("Handling attack");
    }

    shutdown() {
        // Clean up event listeners
        this.events.off('endTurn', this.switchTurn, this);
        this.events.off('turnChanged', this.onCPUTurnChanged, this);
        
        // Clean up event listeners and game objects
        if (Array.isArray(this.player1Ships)) {
            this.player1Ships.forEach(ship => ship.destroy());
        }
        
        if (Array.isArray(this.player2Ships)) {
            this.player2Ships.forEach(ship => ship.destroy());
        }
        
        // Clean up hit markers
        this.player1HitMarkers.forEach(marker => marker.destroy());
        this.player2HitMarkers.forEach(marker => marker.destroy());
        this.player1MissMarkers.forEach(marker => marker.destroy());
        this.player2MissMarkers.forEach(marker => marker.destroy());
        
        // Clean up destroyed ship indicators
        this.player1DestroyedShips.forEach(rect => rect.destroy());
        this.player2DestroyedShips.forEach(rect => rect.destroy());
        
        // Clear collections
        this.player1HitCells.clear();
        this.player2HitCells.clear();
        this.player1HitMarkers = [];
        this.player2HitMarkers = [];
        this.player1MissMarkers = [];
        this.player2MissMarkers = [];
        this.player1DestroyedShips = [];
        this.player2DestroyedShips = [];
        this.destroyedShips.clear();
        this.shipVisibilityMap.clear();
    }
} 