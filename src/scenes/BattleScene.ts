import Phaser from 'phaser';
import { Grid, Ship, ShipType } from '../objects';
import { BaseScene } from './BaseScene';

export class BattleScene extends BaseScene {
    protected player1Grid!: Grid;
    protected player2Grid!: Grid;
    protected player1Ships: Ship[] = [];
    protected player2Ships: Ship[] = [];
    protected isPlayer1Turn: boolean = true;
    protected gameStatus!: Phaser.GameObjects.Text;
    protected turnText!: Phaser.GameObjects.Text;
    protected menuButton!: Phaser.GameObjects.Container;
    protected hits1: number = 0;
    protected hits2: number = 0;
    protected totalShipCells1: number = 0;
    protected totalShipCells2: number = 0;
    protected destroyedShips: Set<Ship> = new Set<Ship>();
    protected shipVisibilityMap: Map<Ship, {visible: boolean, destroyed: boolean}> = new Map();
    protected player1DestroyedShips: Phaser.GameObjects.Rectangle[] = [];
    protected player2DestroyedShips: Phaser.GameObjects.Rectangle[] = [];
    protected player1HitCells: Map<string, boolean> = new Map();
    protected player2HitCells: Map<string, boolean> = new Map();
    protected player1HitMarkers: Phaser.GameObjects.Image[] = [];
    protected player2HitMarkers: Phaser.GameObjects.Image[] = [];
    protected player1MissMarkers: Phaser.GameObjects.Image[] = [];
    protected player2MissMarkers: Phaser.GameObjects.Image[] = [];
    protected targetIndicator?: Phaser.GameObjects.Rectangle;

    constructor(key: string = 'BattleScene') {
        super({ key });
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
        
        // Reset hit cells tracking
        this.player1HitCells.clear();
        this.player2HitCells.clear();
        
        // Clear hit markers
        this.player1HitMarkers = [];
        this.player2HitMarkers = [];
        this.player1MissMarkers = [];
        this.player2MissMarkers = [];
        this.player1DestroyedShips = [];
        this.player2DestroyedShips = [];
        
        // Initialize visibility map for all ships
        const allShips = [...this.player1Ships];
        if (Array.isArray(this.player2Ships)) {
            allShips.push(...this.player2Ships);
        }
        
        allShips.forEach(ship => {
            this.shipVisibilityMap.set(ship, {visible: false, destroyed: false});
        });
        
        // Calculate total ship cells for each player
        this.totalShipCells1 = this.calculateTotalShipCells(this.player1Ships);
        this.totalShipCells2 = this.calculateTotalShipCells(this.player2Ships);
        
        console.log(`Player 1 has ${this.totalShipCells1} ship cells`);
        console.log(`Player 2 has ${this.totalShipCells2} ship cells`);
    }

    create(data?: any): void {
        super.create(data);
        
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
        
        // Add end game button to bottom right
        this.createEndGameButton();
        
        // Start with player 1's turn
        this.updateTurnText('PLAYER 1\'S TURN');
        this.updateGameStatus('Click on Player 2\'s grid to attack');
        
        // Apply initial ship visibility
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

    protected calculateTotalShipCells(ships: Ship[]): number {
        if (!Array.isArray(ships)) {
            return 0;
        }
        return ships.reduce((total, ship) => total + ship.getType(), 0);
    }

    private recreateGrids(): void {
        const screenWidth = this.cameras.main.width;
        
        // We'll create our own grid visuals instead of using the Grid class
        // This prevents the small grid in the top-left corner
        
        // Calculate grid dimensions
        const gridSize = 40; // Standard cell size
        const gridWidth = gridSize * 10;
        const gridHeight = gridSize * 10;
        
        // Position grids
        const leftGridX = 300; // Far left
        const rightGridX = screenWidth - 300; // Far right
        const gridY = 360; // Vertical center
        
        // Create grid objects for game logic but don't add them to the scene
        this.player1Grid = new Grid(this, leftGridX, gridY, 10, 10, '');
        this.player2Grid = new Grid(this, rightGridX, gridY, 10, 10, '');
        
        // Manually draw the grids using graphics objects
        this.drawCustomGrid(leftGridX, gridY, gridWidth, gridHeight, gridSize, 0x3498db); // Player 1 grid (blue)
        this.drawCustomGrid(rightGridX, gridY, gridWidth, gridHeight, gridSize, 0xe74c3c); // Player 2 grid (red)
        
        // Position ships on the grids as they were placed by players
        this.positionShipsOnGrids();
        
        // Destroy any existing grid objects from previous scenes
        if (this.registry.get('originalPlayer1Grid')) {
            const originalGrid = this.registry.get('originalPlayer1Grid');
            if (originalGrid && typeof originalGrid.destroy === 'function') {
                originalGrid.destroy();
            }
        }
        
        if (this.registry.get('originalPlayer2Grid')) {
            const originalGrid = this.registry.get('originalPlayer2Grid');
            if (originalGrid && typeof originalGrid.destroy === 'function') {
                originalGrid.destroy();
            }
        }
        
        // Clear the registry to prevent memory leaks
        this.registry.remove('originalPlayer1Grid');
        this.registry.remove('originalPlayer2Grid');
    }

    private drawCustomGrid(x: number, y: number, width: number, height: number, cellSize: number, borderColor: number): void {
        // Calculate the top-left corner of the grid
        const startX = x - width / 2;
        const startY = y - height / 2;
        
        // Create a graphics object for the grid
        const graphics = this.add.graphics();
        
        // Draw the grid background
        graphics.fillStyle(0x0077be, 0.3);  // Light blue with transparency
        graphics.fillRect(startX, startY, width, height);
        
        // Draw the grid border
        graphics.lineStyle(3, borderColor, 1);
        graphics.strokeRect(startX, startY, width, height);
        
        // Draw the grid lines
        graphics.lineStyle(1, 0xffffff, 0.5);
        
        // Draw horizontal lines
        for (let i = 1; i < 10; i++) {
            const lineY = startY + i * cellSize;
            graphics.moveTo(startX, lineY);
            graphics.lineTo(startX + width, lineY);
        }
        
        // Draw vertical lines
        for (let i = 1; i < 10; i++) {
            const lineX = startX + i * cellSize;
            graphics.moveTo(lineX, startY);
            graphics.lineTo(lineX, startY + height);
        }
        
        graphics.strokePath();
    }

    private positionShipsOnGrids(): void {
        // Position player 1's ships
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
        [...this.player1Ships, ...this.player2Ships].forEach(ship => {
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

    protected applyShipVisibility(): void {
        this.shipVisibilityMap.forEach((state, ship) => {
            ship.setVisible(state.visible);
            
            if (state.destroyed) {
                ship.setAlpha(1);
                ship.setTint(0x880000); // Dark red for destroyed ships
                ship.setDepth(20); // Higher depth for destroyed ships
                this.children.bringToTop(ship);
            } else if (state.visible) {
                ship.setAlpha(0.7);
                ship.setTint(0xffffff); // White = no tint
                ship.setDepth(10);
            }
        });
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
        
        // Add fleet labels
        this.add.text(
            this.player1Grid.getX(),
            this.player1Grid.getY() + this.player1Grid.getHeight()/2 + 30,
            'Your Fleet',
            {
                fontFamily: 'Arial',
                fontSize: '20px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 2
            }
        ).setOrigin(0.5);
        
        this.add.text(
            this.player2Grid.getX(),
            this.player2Grid.getY() + this.player2Grid.getHeight()/2 + 30,
            'Enemy Fleet',
            {
                fontFamily: 'Arial',
                fontSize: '20px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 2
            }
        ).setOrigin(0.5);
        
        // Add coordinate labels (A-J, 1-10) for both grids
        this.addCoordinateLabels(this.player1Grid);
        this.addCoordinateLabels(this.player2Grid);
    }

    private addCoordinateLabels(grid: Grid): void {
        const gridWidth = grid.getWidth();
        const gridHeight = grid.getHeight();
        const cellSize = grid.getCellSize();
        const gridX = grid.getX();
        const gridY = grid.getY();
        const startX = gridX - gridWidth / 2;
        const startY = gridY - gridHeight / 2;
        
        // Add row labels (1-10)
        for (let row = 0; row < 10; row++) {
            const label = this.add.text(
                startX - 20, 
                startY + row * cellSize + cellSize / 2, 
                (row + 1).toString(), 
                { 
                    fontFamily: 'Arial', 
                    fontSize: '16px',
                    color: '#ffffff'
                }
            );
            label.setOrigin(0.5);
        }
        
        // Add column labels (A-J)
        const columns = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
        for (let col = 0; col < 10; col++) {
            const label = this.add.text(
                startX + col * cellSize + cellSize / 2, 
                startY - 20, 
                columns[col], 
                { 
                    fontFamily: 'Arial', 
                    fontSize: '16px',
                    color: '#ffffff'
                }
            );
            label.setOrigin(0.5);
        }
        
        // Add grid label (PLAYER 1 or PLAYER 2)
        const isPlayer1Grid = grid === this.player1Grid;
        const gridLabel = this.add.text(
            gridX,
            startY - 50,
            isPlayer1Grid ? 'PLAYER 1' : 'PLAYER 2',
            {
                fontFamily: 'Impact',
                fontSize: '24px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 2
            }
        );
        gridLabel.setOrigin(0.5);
    }

    private createMainMenuButton(): void {
        // Create a container for the button
        this.menuButton = this.add.container(80, 40);
        
        // Button dimensions
        const buttonWidth = 160;
        const buttonHeight = 50;
        
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
            const rivet = this.add.circle(pos.x, pos.y, 4, 0xd0d0d0);
            rivet.setStrokeStyle(1, 0x808080);
            return rivet;
        });
        
        // Add text
        const buttonText = this.add.text(0, 0, 'MAIN MENU', {
            fontFamily: 'Impact',
            fontSize: '20px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        });
        buttonText.setOrigin(0.5);
        
        // Add all elements to the container
        this.menuButton.add([buttonBg, ...rivets, buttonText]);
        
        // Make the button interactive
        this.menuButton.setSize(buttonWidth, buttonHeight);
        this.menuButton.setInteractive({ useHandCursor: true });
        
        // Add hover and click effects
        this.menuButton.on('pointerover', () => {
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
            this.menuButton.setScale(1.05);
        });
        
        this.menuButton.on('pointerout', () => {
            buttonBg.clear();
            
            // Return to normal state
            buttonBg.fillStyle(0x1a5276, 1);
            buttonBg.fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 10);
            
            buttonBg.fillStyle(0x2980b9, 0.7);
            buttonBg.fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight/2, 10);
            
            buttonBg.lineStyle(3, 0x3498db);
            buttonBg.strokeRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 10);
            
            // Return to normal scale
            this.menuButton.setScale(1);
        });
        
        this.menuButton.on('pointerdown', () => {
            // Return to main menu
            this.returnToMainMenu();
        });
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
                // This is the correct grid to attack
            } else {
                // Can't attack your own grid
                console.log(`Cannot attack your own grid. isPlayer1Grid: ${isPlayer1Grid}, isPlayer1Turn: ${this.isPlayer1Turn}`);
                return;
            }
            
            // Get the grid coordinates for the click
            const gridCoords = grid.getGridCoordinates(pointer.x, pointer.y);
            if (gridCoords) {
                const { row, col } = gridCoords;
                
                // Check if this cell has already been attacked
                const hitCells = isPlayer1Grid ? this.player1HitCells : this.player2HitCells;
                const cellKey = `${row},${col}`;
                
                if (hitCells.has(cellKey)) {
                    console.log(`Cell (${row}, ${col}) already attacked`);
                    
                    // Show a visual indicator that this cell has already been attacked
                    const cellCoords = grid.getWorldCoordinates(row, col);
                    const invalidAttackIndicator = this.add.text(
                        cellCoords.x,
                        cellCoords.y,
                        '✗',
                        {
                            fontFamily: 'Arial',
                            fontSize: '32px',
                            color: '#ff0000'
                        }
                    );
                    invalidAttackIndicator.setOrigin(0.5);
                    
                    // Add a fade out animation
                    this.tweens.add({
                        targets: invalidAttackIndicator,
                        alpha: 0,
                        y: cellCoords.y - 20,
                        duration: 800,
                        ease: 'Sine.easeOut',
                        onComplete: () => {
                            invalidAttackIndicator.destroy();
                        }
                    });
                    
                    return;
                }
                
                console.log(`Attacking grid at (${row}, ${col})`);
                this.handleAttack(row, col);
            }
        });
        
        // Add hover effect to show which cell is being targeted
        interactiveZone.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            // Only show hover effect on the enemy grid during your turn
            if ((isPlayer1Grid && !this.isPlayer1Turn) || (!isPlayer1Grid && this.isPlayer1Turn)) {
                // This is the correct grid to show hover effect
            } else {
                // Don't show hover effect on your own grid
                if (this.targetIndicator) {
                    this.targetIndicator.setVisible(false);
                }
                return;
            }
            
            // Get the grid coordinates for the hover
            const gridCoords = grid.getGridCoordinates(pointer.x, pointer.y);
            if (gridCoords) {
                const { row, col } = gridCoords;
                const cellCoords = grid.getWorldCoordinates(row, col);
                
                // Update the target indicator
                if (this.targetIndicator) {
                    this.targetIndicator.setPosition(cellCoords.x, cellCoords.y);
                    
                    // Change color if cell already attacked
                    const hitCells = isPlayer1Grid ? this.player1HitCells : this.player2HitCells;
                    const cellKey = `${row},${col}`;
                    if (hitCells.has(cellKey)) {
                        this.targetIndicator.setStrokeStyle(2, 0xff0000);
                    } else {
                        this.targetIndicator.setStrokeStyle(2, 0xffffff);
                    }
                    
                    this.targetIndicator.setVisible(true);
                }
            } else {
                // Hide the target indicator if not over a valid cell
                if (this.targetIndicator) {
                    this.targetIndicator.setVisible(false);
                }
            }
        });
        
        // Hide the target indicator when leaving the grid
        interactiveZone.on('pointerout', () => {
            if (this.targetIndicator) {
                this.targetIndicator.setVisible(false);
            }
        });
    }

    protected handleAttack(row: number, col: number): void {
        // Only allow attacks when it's the current player's turn
        if (this.isPlayer1Turn) {
            // Player 1 attacking Player 2's grid
            // Check if the cell has already been hit
            if (this.player2HitCells.has(`${row},${col}`)) {
                console.log('Cell already hit');
                return;
            }
            
            // Mark the cell as hit
            this.player2HitCells.set(`${row},${col}`, true);
            
            // Get the cell coordinates
            const cellCoords = this.player2Grid.getWorldCoordinates(row, col);
            
            // Check if there's a ship at this position
            const shipAtPosition = this.player2Grid.getShipAt(row, col);
            
            if (shipAtPosition) {
                // Hit a ship!
                console.log(`Hit a ship at ${row},${col}!`);
                
                // Create hit marker
                const hitMarker = this.add.image(cellCoords.x, cellCoords.y, 'hit');
                hitMarker.setScale(0.8);
                hitMarker.setDepth(20);
                this.player2HitMarkers.push(hitMarker);
                
                // Play explosion sound with explicit volume
                try {
                    if (this.sound.get('explosion')) {
                        console.log('Playing explosion sound');
                        const explosionSound = this.sound.add('explosion', { volume: 0.7 });
                        explosionSound.play();
                    } else {
                        console.warn('Explosion sound not found, adding it now');
                        const explosionSound = this.sound.add('explosion', { volume: 0.7 });
                        explosionSound.play();
                    }
                } catch (error) {
                    console.error('Error playing explosion sound:', error);
                }
                
                // Add hit effect
                this.addHitEffect(cellCoords.x, cellCoords.y);
                
                // Increment hit counter
                this.hits1++;
                
                // Check if the ship is fully hit
                const { isFullyHit, cells } = this.isShipFullyHit(shipAtPosition);
                
                if (isFullyHit) {
                    // Ship destroyed!
                    console.log('Ship destroyed!');
                    
                    // Mark the ship as destroyed in our visibility map
                    const visState = this.shipVisibilityMap.get(shipAtPosition);
                    if (visState) {
                        visState.destroyed = true;
                        visState.visible = true;
                    }
                    
                    // Add the ship to the destroyed set
                    this.destroyedShips.add(shipAtPosition);
                    
                    // Create a visual representation of the destroyed ship
                    this.recreateDestroyedShip(shipAtPosition, cells);
                    
                    // Update game status
                    this.updateGameStatus(`You destroyed a ${this.getShipTypeName(shipAtPosition.getType())}!`);
                    
                    // Update ship visibility
                    this.updateShipVisibility();
                    
                    // Check if the game is over
                    if (this.checkGameOver()) {
                        return;
                    }
                } else {
                    // Ship hit but not destroyed
                    this.updateGameStatus(`Hit!`);
                }
                
                // Player gets another turn after a hit
                return;
            } else {
                // Miss
                console.log(`Missed at ${row},${col}`);
                
                // Create miss marker
                const missMarker = this.add.image(cellCoords.x, cellCoords.y, 'miss');
                missMarker.setScale(0.8);
                missMarker.setDepth(20);
                this.player2MissMarkers.push(missMarker);
                
                // Add miss effect
                this.addMissEffect(cellCoords.x, cellCoords.y);
                
                // Play miss sound
                try {
                    if (this.sound.get('missplunge')) {
                        console.log('Playing miss sound');
                        const missSound = this.sound.add('missplunge', { volume: 0.7 });
                        missSound.play();
                    }
                } catch (error) {
                    console.error('Error playing miss sound:', error);
                }
                
                // Update game status
                this.updateGameStatus(`Miss!`);
                
                // Check if the game is over
                if (this.checkGameOver()) {
                    return;
                }
                
                // Switch turns after a miss
                this.switchTurn();
            }
        } else {
            // Player 2 attacking Player 1's grid
            // Check if the cell has already been hit
            if (this.player1HitCells.has(`${row},${col}`)) {
                console.log('Cell already hit');
                return;
            }
            
            // Mark the cell as hit
            this.player1HitCells.set(`${row},${col}`, true);
            
            // Get the cell coordinates
            const cellCoords = this.player1Grid.getWorldCoordinates(row, col);
            
            // Check if there's a ship at this position
            const shipAtPosition = this.player1Grid.getShipAt(row, col);
            
            if (shipAtPosition) {
                // Hit a ship!
                console.log(`Player 2 hit a ship at ${row},${col}!`);
                
                // Create hit marker
                const hitMarker = this.add.image(cellCoords.x, cellCoords.y, 'hit');
                hitMarker.setScale(0.8);
                hitMarker.setDepth(20);
                this.player1HitMarkers.push(hitMarker);
                
                // Play explosion sound with explicit volume
                try {
                    if (this.sound.get('explosion')) {
                        console.log('Playing explosion sound');
                        const explosionSound = this.sound.add('explosion', { volume: 0.7 });
                        explosionSound.play();
                    } else {
                        console.warn('Explosion sound not found, adding it now');
                        const explosionSound = this.sound.add('explosion', { volume: 0.7 });
                        explosionSound.play();
                    }
                } catch (error) {
                    console.error('Error playing explosion sound:', error);
                }
                
                // Add hit effect
                this.addHitEffect(cellCoords.x, cellCoords.y);
                
                // Increment hit counter
                this.hits2++;
                
                // Check if the ship is fully hit
                const { isFullyHit, cells } = this.isShipFullyHit(shipAtPosition);
                
                if (isFullyHit) {
                    // Ship destroyed!
                    console.log('Ship destroyed!');
                    
                    // Mark the ship as destroyed in our visibility map
                    const visState = this.shipVisibilityMap.get(shipAtPosition);
                    if (visState) {
                        visState.destroyed = true;
                        visState.visible = true;
                    }
                    
                    // Add the ship to the destroyed set
                    this.destroyedShips.add(shipAtPosition);
                    
                    // Create a visual representation of the destroyed ship
                    this.recreateDestroyedShip(shipAtPosition, cells);
                    
                    // Update game status
                    this.updateGameStatus(`Player 2 destroyed a ${this.getShipTypeName(shipAtPosition.getType())}!`);
                    
                    // Update ship visibility
                    this.updateShipVisibility();
                    
                    // Check if the game is over
                    if (this.checkGameOver()) {
                        return;
                    }
                } else {
                    // Ship hit but not destroyed
                    this.updateGameStatus(`Player 2 hit!`);
                }
                
                // Player gets another turn after a hit
                return;
            } else {
                // Miss
                console.log(`Player 2 missed at ${row},${col}`);
                
                // Create miss marker
                const missMarker = this.add.image(cellCoords.x, cellCoords.y, 'miss');
                missMarker.setScale(0.8);
                missMarker.setDepth(20);
                this.player1MissMarkers.push(missMarker);
                
                // Add miss effect
                this.addMissEffect(cellCoords.x, cellCoords.y);
                
                // Play miss sound
                try {
                    if (this.sound.get('missplunge')) {
                        console.log('Playing miss sound');
                        const missSound = this.sound.add('missplunge', { volume: 0.7 });
                        missSound.play();
                    }
                } catch (error) {
                    console.error('Error playing miss sound:', error);
                }
                
                // Update game status
                this.updateGameStatus(`Player 2 missed!`);
                
                // Check if the game is over
                if (this.checkGameOver()) {
                    return;
                }
                
                // Switch turns after a miss
                this.switchTurn();
            }
        }
    }

    protected isShipFullyHit(ship: Ship): { isFullyHit: boolean, cells: { row: number, col: number }[] } {
        // Get the grid this ship belongs to
        const isPlayer1Ship = this.player1Ships.includes(ship);
        const hitCells = isPlayer1Ship ? this.player1HitCells : this.player2HitCells;
        
        // Get the ship's position on the grid
        const gridPos = ship.getGridPosition();
        if (!gridPos) {
            return { isFullyHit: false, cells: [] };
        }
        
        const { row, col } = gridPos;
        const shipType = ship.getType();
        const isHorizontal = ship.isHorizontalOrientation();
        
        // Track all cells occupied by this ship
        const shipCells: { row: number, col: number }[] = [];
        
        // Check if all cells of the ship are hit
        let allCellsHit = true;
        
        for (let i = 0; i < shipType; i++) {
            const checkRow = isHorizontal ? row : row + i;
            const checkCol = isHorizontal ? col + i : col;
            const key = `${checkRow},${checkCol}`;
            
            shipCells.push({ row: checkRow, col: checkCol });
            
            if (!hitCells.has(key)) {
                allCellsHit = false;
            }
        }
        
        return { isFullyHit: allCellsHit, cells: shipCells };
    }

    protected recreateDestroyedShip(ship: Ship, cells: { row: number, col: number }[]): void {
        // Get the grid this ship belongs to
        const isPlayer1Ship = this.player1Ships.includes(ship);
        const grid = isPlayer1Ship ? this.player1Grid : this.player2Grid;
        
        // Sort cells to ensure we have them in order
        cells.sort((a, b) => {
            if (a.row === b.row) {
                return a.col - b.col;
            }
            return a.row - b.row;
        });
        
        // Determine if ship is horizontal or vertical
        const isHorizontal = cells.length > 1 && cells[0].row === cells[1].row;
        
        // Calculate the exact position and size based on grid cells
        const cellSize = grid.getCellSize();
        const firstCell = grid.getWorldCoordinates(cells[0].row, cells[0].col);
        const lastCell = grid.getWorldCoordinates(
            cells[cells.length - 1].row, 
            cells[cells.length - 1].col
        );
        
        // Calculate dimensions
        let width, height, x, y;
        if (isHorizontal) {
            width = cellSize * cells.length;
            height = cellSize;
            x = firstCell.x - cellSize/2 + width/2;
            y = firstCell.y;
        } else {
            width = cellSize;
            height = cellSize * cells.length;
            x = firstCell.x;
            y = firstCell.y - cellSize/2 + height/2;
        }
        
        // Create a rectangle to represent the destroyed ship
        const destroyedShip = this.add.rectangle(x, y, width, height, 0x880000, 0.7);
        destroyedShip.setStrokeStyle(2, 0xff0000);
        
        // Add to appropriate list for tracking
        if (isPlayer1Ship) {
            this.player1DestroyedShips.push(destroyedShip);
        } else {
            this.player2DestroyedShips.push(destroyedShip);
        }
        
        // Make these cells no longer clickable by adding them to the hitCells array
        cells.forEach(cell => {
            const key = `${cell.row},${cell.col}`;
            if (isPlayer1Ship) {
                this.player1HitCells.set(key, true);
            } else {
                this.player2HitCells.set(key, true);
            }
        });
        
        // Add a visual effect to highlight the destroyed ship
        this.tweens.add({
            targets: destroyedShip,
            alpha: { from: 1, to: 0.7 },
            duration: 500,
            yoyo: true,
            repeat: 2
        });
        
        console.log(`Ship destroyed at position (${x}, ${y}) with dimensions ${width}x${height}`);
    }

    protected checkGameOver(): boolean {
        if (this.hits1 >= this.totalShipCells2) {
            // Player 1 wins
            this.gameOver('PLAYER 1 WINS!');
            return true;
        } else if (this.hits2 >= this.totalShipCells1) {
            // Player 2 wins
            this.gameOver('PLAYER 2 WINS!');
            return true;
        }
        return false;
    }

    protected gameOver(result: string): void {
        // Show all ships
        this.player1Ships.forEach(ship => {
            ship.setVisible(true);
            ship.setAlpha(1);
        });
        
        if (Array.isArray(this.player2Ships)) {
            this.player2Ships.forEach(ship => {
                ship.setVisible(true);
                ship.setAlpha(1);
            });
        }
        
        // Update UI
        this.updateGameStatus('GAME OVER');
        this.updateTurnText(result);
        
        // Create a quick victory animation
        this.createVictoryAnimation(result);
        
        // Add a shorter delay before transitioning to the game over scene
        this.time.delayedCall(1500, () => {
            this.scene.start('GameOverScene', { result });
        });
    }

    private createVictoryAnimation(result: string): void {
        // Determine which player won
        const isPlayer1Win = result.includes('PLAYER 1');
        
        // Get the correct grid for the winner
        const winnerGrid = isPlayer1Win ? this.player1Grid : this.player2Grid;
        const loserGrid = isPlayer1Win ? this.player2Grid : this.player1Grid;
        
        // Find the highest depth value currently in use
        let highestDepth = 0;
        this.children.list.forEach(child => {
            if ('depth' in child && typeof child.depth === 'number' && child.depth > highestDepth) {
                highestDepth = child.depth;
            }
        });
        
        // Set victory elements to be one higher than the highest depth
        const victoryDepth = highestDepth + 1;
        console.log(`Setting victory animation depth to ${victoryDepth}`);
        
        // Create a victory flash effect
        const flash = this.add.rectangle(
            winnerGrid.getX(),
            winnerGrid.getY(),
            winnerGrid.getWidth() + 40,
            winnerGrid.getHeight() + 40,
            isPlayer1Win ? 0x3498db : 0xe74c3c,
            0.3
        );
        flash.setDepth(victoryDepth);
        
        // Animate the flash
        this.tweens.add({
            targets: flash,
            alpha: 0.7,
            scale: 1.1,
            duration: 300,
            yoyo: true,
            repeat: 2,
            ease: 'Sine.easeInOut'
        });
        
        // Add a victory text that zooms in
        const victoryText = this.add.text(
            winnerGrid.getX(),
            winnerGrid.getY(),
            'VICTORY!',
            {
                fontFamily: 'Impact',
                fontSize: '64px',
                color: isPlayer1Win ? '#3498db' : '#e74c3c',
                stroke: '#ffffff',
                strokeThickness: 6,
                shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 5, fill: true }
            }
        );
        victoryText.setOrigin(0.5);
        victoryText.setScale(0.1);
        victoryText.setAlpha(0.5);
        victoryText.setDepth(victoryDepth);
        
        // Animate the victory text
        this.tweens.add({
            targets: victoryText,
            scale: 1,
            alpha: 1,
            duration: 500,
            ease: 'Back.easeOut'
        });
        
        // Add a defeat text on the loser's grid
        const defeatText = this.add.text(
            loserGrid.getX(),
            loserGrid.getY(),
            'DEFEAT',
            {
                fontFamily: 'Impact',
                fontSize: '48px',
                color: '#888888',
                stroke: '#000000',
                strokeThickness: 4,
                shadow: { offsetX: 1, offsetY: 1, color: '#000000', blur: 3, fill: true }
            }
        );
        defeatText.setOrigin(0.5);
        defeatText.setScale(0.1);
        defeatText.setAlpha(0.5);
        defeatText.setDepth(victoryDepth);
        
        // Animate the defeat text
        this.tweens.add({
            targets: defeatText,
            scale: 1,
            alpha: 0.7,
            duration: 500,
            ease: 'Back.easeOut'
        });
    }

    protected updateGameStatus(message: string): void {
        this.gameStatus.setText(message);
    }

    protected updateTurnText(text: string): void {
        this.turnText.setText(text);
        
        // Set color based on whose turn it is
        if (text.includes('PLAYER 1')) {
            this.turnText.setColor('#3498db');
        } else if (text.includes('PLAYER 2')) {
            this.turnText.setColor('#e74c3c');
        } else {
            this.turnText.setColor('#ffffff');
        }
    }

    private returnToMainMenu(): void {
        // Show confirmation dialog
        const overlay = this.add.rectangle(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2,
            this.cameras.main.width,
            this.cameras.main.height,
            0x000000,
            0.7
        );
        
        const confirmBox = this.add.rectangle(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2,
            400,
            250,
            0x1a5276,
            1
        );
        confirmBox.setStrokeStyle(4, 0x3498db);
        
        const confirmText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 - 60,
            'Return to Main Menu?',
            {
                fontFamily: 'Impact',
                fontSize: '28px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 2
            }
        );
        confirmText.setOrigin(0.5);
        
        const warningText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 - 20,
            'Current game progress will be lost.',
            {
                fontFamily: 'Arial',
                fontSize: '18px',
                color: '#ff9999'
            }
        );
        warningText.setOrigin(0.5);
        
        // Yes button
        const yesButton = this.add.text(
            this.cameras.main.width / 2 - 80,
            this.cameras.main.height / 2 + 40,
            'YES',
            {
                fontFamily: 'Impact',
                fontSize: '24px',
                color: '#ffffff',
                backgroundColor: '#2ecc71',
                padding: { x: 20, y: 10 }
            }
        );
        yesButton.setOrigin(0.5);
        yesButton.setInteractive({ useHandCursor: true });
        
        // No button
        const noButton = this.add.text(
            this.cameras.main.width / 2 + 80,
            this.cameras.main.height / 2 + 40,
            'NO',
            {
                fontFamily: 'Impact',
                fontSize: '24px',
                color: '#ffffff',
                backgroundColor: '#e74c3c',
                padding: { x: 20, y: 10 }
            }
        );
        noButton.setOrigin(0.5);
        noButton.setInteractive({ useHandCursor: true });
        
        // Button handlers
        yesButton.on('pointerdown', () => {
            // Return to main menu
            this.scene.start('MainMenuScene');
        });
        
        noButton.on('pointerdown', () => {
            // Remove the confirmation dialog
            overlay.destroy();
            confirmBox.destroy();
            confirmText.destroy();
            warningText.destroy();
            yesButton.destroy();
            noButton.destroy();
        });
    }

    shutdown() {
        // Clean up event listeners
        this.events.off('endTurn', this.switchTurn, this);
        this.events.off('turnChanged', this.onCPUTurnChanged, this);
        
        // Clean up event listeners and game objects
        this.player1Ships.forEach(ship => ship.destroy());
        
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

    // Add this method to the BattleScene class to debug ship visibility
    private debugShipVisibility(): void {
        console.log("--- DEBUG SHIP VISIBILITY ---");
        console.log(`Destroyed ships count: ${this.destroyedShips.size}`);
        
        console.log("Player 1 ships:");
        this.player1Ships.forEach((ship, index) => {
            console.log(`Ship ${index}: visible=${ship.visible}, alpha=${ship.alpha}, destroyed=${this.destroyedShips.has(ship)}`);
        });
        
        console.log("Player 2 ships:");
        if (Array.isArray(this.player2Ships)) {
            this.player2Ships.forEach((ship, index) => {
                console.log(`Ship ${index}: visible=${ship.visible}, alpha=${ship.alpha}, destroyed=${this.destroyedShips.has(ship)}`);
            });
        }
    }

    private createEndGameButton(): void {
        const screenWidth = this.cameras.main.width;
        const screenHeight = this.cameras.main.height;
        
        // Create a container for the button
        const endGameButton = this.add.container(screenWidth - 100, screenHeight - 50);
        
        // Button dimensions
        const buttonWidth = 160;
        const buttonHeight = 50;
        
        // Create button background with naval theme
        const buttonBg = this.add.graphics();
        buttonBg.fillStyle(0x990000, 0.9);
        buttonBg.fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 10);
        
        // Add metallic highlight
        buttonBg.fillStyle(0xcc0000, 0.7);
        buttonBg.fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight/2, 10);
        
        // Add border
        buttonBg.lineStyle(3, 0xff3333);
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
        
        // Add text
        const buttonText = this.add.text(0, 0, 'END GAME', {
            fontFamily: 'Impact',
            fontSize: '20px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        });
        buttonText.setOrigin(0.5);
        
        // Add all elements to the container
        endGameButton.add([buttonBg, ...rivets, buttonText]);
        
        // Make the button interactive
        endGameButton.setSize(buttonWidth, buttonHeight);
        endGameButton.setInteractive({ useHandCursor: true });
        
        // Add hover and click effects
        endGameButton.on('pointerover', () => {
            buttonBg.clear();
            
            // Brighter background on hover
            buttonBg.fillStyle(0xcc0000, 1);
            buttonBg.fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 10);
            
            // Brighter highlight
            buttonBg.fillStyle(0xff3333, 0.7);
            buttonBg.fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight/2, 10);
            
            // Brighter border
            buttonBg.lineStyle(3, 0xff6666);
            buttonBg.strokeRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 10);
            
            // Scale up slightly
            endGameButton.setScale(1.05);
        });
        
        endGameButton.on('pointerout', () => {
            buttonBg.clear();
            
            // Return to normal state
            buttonBg.fillStyle(0x990000, 0.9);
            buttonBg.fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 10);
            
            buttonBg.fillStyle(0xcc0000, 0.7);
            buttonBg.fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight/2, 10);
            
            buttonBg.lineStyle(3, 0xff3333);
            buttonBg.strokeRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 10);
            
            // Return to normal scale
            endGameButton.setScale(1);
        });
        
        endGameButton.on('pointerdown', () => {
            // End the game immediately
            const winner = this.isPlayer1Turn ? 'PLAYER 2 WINS!' : 'PLAYER 1 WINS!';
            this.gameOver(winner);
        });
    }

    protected switchTurn(): void {
        this.isPlayer1Turn = !this.isPlayer1Turn;
        this.updateTurnText(`${this.isPlayer1Turn ? 'Player 1' : 'Player 2'}'s turn`);
        this.updateShipVisibility();
        
        // Emit an event that the turn has changed
        this.events.emit('turnChanged');
    }

    protected onCPUTurnChanged(): void {
        // If it's the CPU's turn (player 2), make a move after a delay
        if (!this.isPlayer1Turn) {
            // Add a delay to simulate CPU thinking
            this.time.delayedCall(800, this.makeCPUMove, [], this);
        }
    }

    protected makeCPUMove(): void {
        if (this.checkGameOver()) return;
        
        // Choose a random cell to attack that hasn't been hit yet
        let row: number;
        let col: number;
        
        // Keep trying until we find a cell that hasn't been attacked yet
        do {
            row = Math.floor(Math.random() * 10);
            col = Math.floor(Math.random() * 10);
        } while (this.player1HitCells.has(`${row},${col}`));
        
        // Get the world coordinates for the cell
        const cellCoords = this.player1Grid.getWorldCoordinates(row, col);
        
        // Add a visual indicator of the CPU's target
        const targetIndicator = this.add.circle(cellCoords.x, cellCoords.y, 20, 0xff0000, 0.5);
        
        // Animate the target indicator
        this.tweens.add({
            targets: targetIndicator,
            scale: { from: 0.5, to: 1.5 },
            alpha: { from: 0.8, to: 0 },
            duration: 500,
            onComplete: () => {
                targetIndicator.destroy();
                
                // Execute the attack
                this.handleAttack(row, col);
            }
        });
    }

    // Method to update grid labels based on game mode
    protected updateGridLabels(player2Label: string = 'PLAYER 2'): void {
        // Find and update the grid labels
        this.children.list.forEach(child => {
            if (child instanceof Phaser.GameObjects.Text) {
                const text = child as Phaser.GameObjects.Text;
                if (text.text === 'PLAYER 2') {
                    text.setText(player2Label);
                }
            }
        });
    }

    update(time: number, delta: number): void {
        // Update water animation
        super.update(time, delta);
        
        // Any additional update logic...
    }

    // Add visual hit effect
    protected addHitEffect(x: number, y: number): void {
        // Create a simple explosion effect using a circle that expands and fades
        const explosion = this.add.circle(x, y, 5, 0xff0000, 1);
        explosion.setDepth(30);
        
        // Animate the explosion
        this.tweens.add({
            targets: explosion,
            radius: 25,
            alpha: 0,
            duration: 500,
            ease: 'Power2',
            onComplete: () => {
                explosion.destroy();
            }
        });
        
        // Add some particles for more visual impact
        const particles = this.add.particles(x, y, 'hit', {
            speed: { min: 50, max: 150 },
            scale: { start: 0.5, end: 0 },
            lifespan: 500,
            quantity: 5,
            gravityY: 100
        });
        
        // Stop emitting after a short time
        this.time.delayedCall(200, () => {
            particles.destroy();
        });
    }

    // Add visual miss effect
    protected addMissEffect(x: number, y: number): void {
        // Create a simple splash effect using a circle that expands and fades
        const splash = this.add.circle(x, y, 5, 0x3498db, 1);
        splash.setDepth(30);
        
        // Animate the splash
        this.tweens.add({
            targets: splash,
            radius: 20,
            alpha: 0,
            duration: 500,
            ease: 'Power2',
            onComplete: () => {
                splash.destroy();
            }
        });
        
        // Add ripple effect
        const ripple1 = this.add.circle(x, y, 10, 0x3498db, 0.5);
        ripple1.setStrokeStyle(2, 0x3498db);
        ripple1.setDepth(29);
        
        const ripple2 = this.add.circle(x, y, 5, 0x3498db, 0.3);
        ripple2.setStrokeStyle(1, 0x3498db);
        ripple2.setDepth(29);
        
        // Animate the ripples
        this.tweens.add({
            targets: [ripple1, ripple2],
            radius: { from: 5, to: 30 },
            alpha: { from: 0.5, to: 0 },
            duration: 800,
            ease: 'Sine.easeOut',
            onComplete: () => {
                ripple1.destroy();
                ripple2.destroy();
            }
        });
    }

    // Get ship type name for display
    protected getShipTypeName(type: ShipType): string {
        switch (type) {
            case ShipType.Small: return 'Destroyer';
            case ShipType.Medium: return 'Submarine';
            case ShipType.Large: return 'Cruiser';
            case ShipType.Huge: return 'Battleship';
            default: return 'Ship';
        }
    }
} 