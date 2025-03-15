import Phaser from 'phaser';
import { Grid, Ship, ShipType, ShipConfig } from '../objects';
import { BattleScene } from './BattleScene';

export class CPUBattleScene extends BattleScene {
    // CPU targeting variables
    private cpuHitStack: {row: number, col: number}[] = [];
    private cpuLastHit: {row: number, col: number} | null = null;
    private cpuHuntMode: boolean = false;
    private cpuTargetDirections: string[] = ['up', 'right', 'down', 'left'];
    private cpuCurrentDirection: string | null = null;
    private cpuAttackDelay: number = 1500; // Increased delay to better simulate a real player (1.5 seconds)
    private cpuShipConfigs: ShipConfig[] = [];
    private cpuConsecutiveHits: number = 0; // Track consecutive hits to add variable timing

    // Add a property to track the CPU move timer
    private cpuMoveTimer: Phaser.Time.TimerEvent | null = null;

    constructor() {
        // Call the parent constructor with a different key
        super('CPUBattleScene');
    }

    init(): void {
        // Call parent init first
        super.init();
        
        // Reset CPU targeting variables
        this.cpuHitStack = [];
        this.cpuLastHit = null;
        this.cpuHuntMode = false;
        this.cpuCurrentDirection = null;
        this.cpuConsecutiveHits = 0;
        
        // Reset hit cells maps to ensure they're empty
        this.player1HitCells.clear();
        this.player2HitCells.clear();
        
        // Initialize CPU ship configurations
        this.cpuShipConfigs = [
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
        
        console.log('CPUBattleScene initialized');
    }

    create(data?: any): void {
        super.create(data);
        
        // Create and place CPU ships randomly
        this.createAndPlaceCPUShips();
        
        // Update UI to indicate CPU opponent
        this.updateGameStatus('BATTLE AGAINST CPU');
        this.updateTurnText('YOUR TURN');
        
        // Update grid label to show CPU instead of PLAYER 2
        this.updateGridLabels('CPU');
        
        // Listen for turn changes to trigger CPU moves
        this.events.on('turnChanged', this.onCPUTurnChanged, this);
        
        console.log('CPUBattleScene created');
    }

    // Create and place CPU ships randomly
    private createAndPlaceCPUShips(): void {
        console.log('Creating and placing CPU ships');
        
        // Clear any existing ships
        this.player2Ships = [];
        
        // Create ships based on configurations
        this.cpuShipConfigs.forEach((config) => {
            // Create the ship
            const ship = new Ship(this, config, true);
            
            // Add to the ships array
            this.player2Ships.push(ship);
        });
        
        // Place ships randomly on the grid
        this.placeCPUShipsRandomly();
        
        // Calculate total ship cells for player 2 (CPU)
        this.totalShipCells2 = this.calculateTotalShipCells(this.player2Ships);
        
        console.log(`CPU has ${this.totalShipCells2} ship cells`);
        
        // Update the registry with the CPU ships
        this.registry.set('player2Ships', this.player2Ships);
        
        // Initialize visibility map for CPU ships
        this.player2Ships.forEach(ship => {
            this.shipVisibilityMap.set(ship, {visible: false, destroyed: false});
            // Ensure ships are invisible
            ship.setVisible(false);
            ship.setAlpha(0);
        });
        
        // Update ship visibility
        this.updateShipVisibility();
    }
    
    // Place CPU ships randomly on the grid
    private placeCPUShipsRandomly(): void {
        // Sort ships by size (larger ships first)
        const shipsToPlace = [...this.player2Ships];
        shipsToPlace.sort((a, b) => b.getType() - a.getType());
        
        // Try to place each ship
        for (const ship of shipsToPlace) {
            let placed = false;
            let attempts = 0;
            const maxAttempts = 100; // Prevent infinite loops
            
            while (!placed && attempts < maxAttempts) {
                attempts++;
                
                // Randomly decide orientation
                const isHorizontal = Math.random() > 0.5;
                if (ship.isHorizontalOrientation() !== isHorizontal) {
                    ship.rotate();
                }
                
                // Get random position
                const row = Math.floor(Math.random() * 10);
                const col = Math.floor(Math.random() * 10);
                
                // Check if the ship can be placed at these coordinates
                if (this.player2Grid.canPlaceShip(ship.getType(), row, col, isHorizontal)) {
                    // Get the world coordinates for the grid cell
                    const cellCoords = this.player2Grid.getWorldCoordinates(row, col);
                    
                    // Place the ship on the grid
                    ship.place(cellCoords.x, cellCoords.y, this.player2Grid.getCellSize());
                    
                    // Update the grid data
                    this.player2Grid.placeShip(ship, row, col);
                    
                    // Mark the ship as placed
                    ship.markAsPlaced(row, col);
                    
                    // Set the ship to be invisible initially
                    ship.setVisible(false);
                    ship.setAlpha(0);
                    
                    placed = true;
                }
            }
            
            // If we couldn't place the ship after max attempts, log a warning
            if (!placed) {
                console.warn(`Could not place CPU ship of type ${ship.getType()} after ${maxAttempts} attempts`);
            }
        }
    }

    // Override the onCPUTurnChanged method from BattleScene
    protected onCPUTurnChanged(): void {
        // If it's the CPU's turn (player 2), make a move after a delay
        if (!this.isPlayer1Turn) {
            console.log('CPU turn - scheduling move');
            
            // Cancel any existing CPU move timers to prevent multiple moves
            if (this.cpuMoveTimer) {
                this.cpuMoveTimer.remove();
            }
            
            // Add a delay to simulate CPU thinking
            this.cpuMoveTimer = this.time.delayedCall(
                this.cpuAttackDelay, 
                this.makeCPUMove, 
                [], 
                this
            );
        }
    }

    // Smart CPU move logic
    protected makeCPUMove(): void {
        // Reset the timer reference
        this.cpuMoveTimer = null;
        
        // Check if the game is over before making a move
        if (this.checkGameOver()) {
            console.log('Game is over, CPU will not make a move');
            return;
        }
        
        // Ensure it's actually the CPU's turn
        if (this.isPlayer1Turn) {
            console.log('Not CPU turn, skipping CPU move');
            return;
        }
        
        console.log('CPU making a move');
        
        // Determine the target cell
        let targetRow: number;
        let targetCol: number;
        
        if (this.cpuHuntMode && this.cpuLastHit) {
            // In hunt mode, try to find adjacent cells to hit
            const nextTarget = this.getNextTargetFromHuntMode();
            
            if (nextTarget) {
                // Use the calculated target
                targetRow = nextTarget.row;
                targetCol = nextTarget.col;
            } else {
                // If no valid target found in hunt mode, get a random target
                const randomTarget = this.getRandomTarget();
                targetRow = randomTarget.row;
                targetCol = randomTarget.col;
            }
        } else {
            // Get a random target
            const randomTarget = this.getRandomTarget();
            targetRow = randomTarget.row;
            targetCol = randomTarget.col;
        }
        
        // Attack the target cell
        this.handleCPUAttack(targetRow, targetCol);
    }

    // Get a random target that hasn't been attacked yet
    private getRandomTarget(): {row: number, col: number} {
        const gridSize = 10; // Assuming 10x10 grid
        let row: number;
        let col: number;
        let attempts = 0;
        
        // Keep trying until we find a cell that hasn't been attacked yet
        // or until we've tried too many times
        do {
            row = Math.floor(Math.random() * gridSize);
            col = Math.floor(Math.random() * gridSize);
            attempts++;
            
            // Prevent infinite loop
            if (attempts > 100) {
                console.error('Too many attempts to find random target');
                break;
            }
        } while (this.player1HitCells.has(`${row},${col}`));
        
        return { row, col };
    }

    // Get the next target based on hunt mode logic
    private getNextTargetFromHuntMode(): {row: number, col: number} | null {
        if (!this.cpuLastHit) return null;
        
        const { row, col } = this.cpuLastHit;
        const gridSize = 10; // Assuming 10x10 grid
        
        // If we have a direction, continue in that direction
        if (this.cpuCurrentDirection) {
            let nextRow = row;
            let nextCol = col;
            
            // Calculate next position based on direction
            switch (this.cpuCurrentDirection) {
                case 'up':
                    nextRow = row - 1;
                    break;
                case 'right':
                    nextCol = col + 1;
                    break;
                case 'down':
                    nextRow = row + 1;
                    break;
                case 'left':
                    nextCol = col - 1;
                    break;
            }
            
            // Check if the next position is valid
            if (
                nextRow >= 0 && nextRow < gridSize &&
                nextCol >= 0 && nextCol < gridSize &&
                !this.player1HitCells.has(`${nextRow},${nextCol}`)
            ) {
                return { row: nextRow, col: nextCol };
            } else {
                // If we hit the edge or an already hit cell, try the opposite direction
                this.cpuCurrentDirection = this.getOppositeDirection(this.cpuCurrentDirection);
                
                // If we have a previous hit in the stack, use it as the new starting point
                if (this.cpuHitStack.length > 0) {
                    // FIX: Don't recursively call, just return null and let the next call handle it
                    // This prevents infinite recursion
                    this.cpuLastHit = this.cpuHitStack[0]; // Use the first hit as reference
                    return null; // Return null instead of recursively calling
                }
            }
        }
        
        // If we don't have a direction yet, try each direction
        for (const direction of this.shuffleDirections()) {
            let nextRow = row;
            let nextCol = col;
            
            // Calculate next position based on direction
            switch (direction) {
                case 'up':
                    nextRow = row - 1;
                    break;
                case 'right':
                    nextCol = col + 1;
                    break;
                case 'down':
                    nextRow = row + 1;
                    break;
                case 'left':
                    nextCol = col - 1;
                    break;
            }
            
            // Check if the next position is valid
            if (
                nextRow >= 0 && nextRow < gridSize &&
                nextCol >= 0 && nextCol < gridSize &&
                !this.player1HitCells.has(`${nextRow},${nextCol}`)
            ) {
                this.cpuCurrentDirection = direction;
                return { row: nextRow, col: nextCol };
            }
        }
        
        // If no valid direction found, return null
        return null;
    }

    // Get the opposite direction
    private getOppositeDirection(direction: string): string {
        switch (direction) {
            case 'up': return 'down';
            case 'right': return 'left';
            case 'down': return 'up';
            case 'left': return 'right';
            default: return 'up';
        }
    }

    // Shuffle the directions array for more unpredictable targeting
    private shuffleDirections(): string[] {
        const directions = [...this.cpuTargetDirections];
        
        // Fisher-Yates shuffle
        for (let i = directions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [directions[i], directions[j]] = [directions[j], directions[i]];
        }
        
        return directions;
    }

    // Handle CPU attack logic
    private handleCPUAttack(row: number, col: number): void {
        // Mark the cell as hit
        this.player1HitCells.set(`${row},${col}`, true);
        
        // Get the cell coordinates
        const cellCoords = this.player1Grid.getWorldCoordinates(row, col);
        
        // Add a visual indicator of the CPU's target before attacking
        const targetIndicator = this.add.circle(cellCoords.x, cellCoords.y, 20, 0xff0000, 0.5);
        
        // Animate the target indicator
        this.tweens.add({
            targets: targetIndicator,
            scale: { from: 0.5, to: 1.5 },
            alpha: { from: 0.8, to: 0 },
            duration: 500,
            onComplete: () => {
                targetIndicator.destroy();
                
                // Check if there's a ship at this position
                const shipAtPosition = this.player1Grid.getShipAt(row, col);
                
                if (shipAtPosition) {
                    // Hit a ship!
                    console.log(`CPU hit a ship at ${row},${col}!`);
                    
                    // Create hit marker
                    const hitMarker = this.add.image(cellCoords.x, cellCoords.y, 'hit');
                    hitMarker.setScale(0.8);
                    hitMarker.setDepth(20);
                    this.player1HitMarkers.push(hitMarker);
                    
                    // Play explosion sound
                    try {
                        if (this.sound.get('explosion')) {
                            console.log('Playing explosion sound for CPU hit');
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
                    
                    // Update CPU targeting variables
                    this.cpuHuntMode = true;
                    
                    // If this is the first hit on a ship, save it as the last hit
                    if (!this.cpuLastHit) {
                        this.cpuLastHit = { row, col };
                    } else {
                        // If we already have a last hit, add it to the stack
                        // and update the last hit to this new position
                        this.cpuHitStack.push(this.cpuLastHit);
                        this.cpuLastHit = { row, col };
                    }
                    
                    // Increment hit counter
                    this.hits2++;
                    
                    // Increment consecutive hits counter
                    this.cpuConsecutiveHits++;
                    
                    // Check if the ship is fully hit
                    const { isFullyHit, cells } = this.isShipFullyHit(shipAtPosition);
                    
                    if (isFullyHit) {
                        // Ship destroyed!
                        console.log('CPU destroyed a ship!');
                        
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
                        this.updateGameStatus(`CPU destroyed your ${this.getShipTypeName(shipAtPosition.getType())}!`);
                        
                        // Reset hunt mode since we destroyed the ship
                        this.cpuHuntMode = false;
                        this.cpuCurrentDirection = null;
                        this.cpuLastHit = null;
                        
                        // Check if there are more hits in the stack
                        if (this.cpuHitStack.length > 0) {
                            this.cpuLastHit = this.cpuHitStack.pop() || null;
                            this.cpuHuntMode = this.cpuLastHit !== null;
                        }
                        
                        // Update ship visibility
                        this.updateShipVisibility();
                        
                        // Check if the game is over
                        if (this.checkGameOver()) {
                            return;
                        }
                    } else {
                        // Ship hit but not destroyed
                        this.updateGameStatus(`CPU hit your ship!`);
                    }
                    
                    // CPU gets another turn after a hit
                    this.time.delayedCall(this.cpuAttackDelay, () => {
                        // Only make another move if the game isn't over
                        if (!this.checkGameOver()) {
                            this.makeCPUMove();
                        }
                    });
                    
                } else {
                    // Miss
                    console.log(`CPU missed at ${row},${col}`);
                    
                    // Create miss marker
                    const missMarker = this.add.image(cellCoords.x, cellCoords.y, 'miss');
                    missMarker.setScale(0.8);
                    missMarker.setDepth(20);
                    this.player1MissMarkers.push(missMarker);
                    
                    // Play miss sound
                    try {
                        if (this.sound.get('missplunge')) {
                            console.log('Playing miss sound for CPU');
                            const missSound = this.sound.add('missplunge', { volume: 0.5 });
                            missSound.play();
                        } else {
                            console.warn('Miss sound not found, adding it now');
                            const missSound = this.sound.add('missplunge', { volume: 0.5 });
                            missSound.play();
                        }
                    } catch (error) {
                        console.error('Error playing miss sound:', error);
                    }
                    
                    // Add miss effect
                    this.addMissEffect(cellCoords.x, cellCoords.y);
                    
                    // Update game status
                    this.updateGameStatus(`CPU missed!`);
                    
                    // Reset consecutive hits counter
                    this.cpuConsecutiveHits = 0;
                    
                    // Check if the game is over
                    if (this.checkGameOver()) {
                        return;
                    }
                    
                    // Switch turns after a miss
                    this.isPlayer1Turn = true;
                    this.updateTurnText('YOUR TURN');
                    this.updateShipVisibility();
                    
                    // Emit the turnChanged event to notify listeners
                    this.events.emit('turnChanged');
                }
            }
        });
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

    // Method to check if the game is over
    protected checkGameOver(): boolean {
        if (this.hits1 >= this.totalShipCells2) {
            // Player 1 wins
            this.gameOver('PLAYER 1 WINS!');
            return true;
        } else if (this.hits2 >= this.totalShipCells1) {
            // CPU wins
            this.gameOver('CPU WINS!');
            return true;
        }
        return false;
    }

    // Override updateShipVisibility to ensure CPU ships are always hidden unless destroyed
    protected updateShipVisibility(): void {
        console.log("Updating ship visibility in CPU mode");
        
        // Update visibility state in our map
        [...this.player1Ships, ...this.player2Ships].forEach(ship => {
            const state = this.shipVisibilityMap.get(ship);
            if (state) {
                // If the ship is destroyed, keep it visible
                if (state.destroyed) {
                    state.visible = true;
                } else {
                    // In CPU mode, only show player 1's ships
                    // CPU ships (player 2) are always hidden
                    state.visible = this.player1Ships.includes(ship);
                }
            }
        });
        
        // Apply the visibility states
        this.applyShipVisibility();
    }
    
    // Override applyShipVisibility to ensure CPU ships are properly hidden
    protected applyShipVisibility(): void {
        this.shipVisibilityMap.forEach((state, ship) => {
            ship.setVisible(state.visible);
            
            if (state.destroyed) {
                ship.setAlpha(1);
                ship.setTint(0x880000); // Dark red for destroyed ships
                ship.setDepth(20); // Higher depth for destroyed ships
            } else if (this.player2Ships.includes(ship)) {
                // Always keep CPU ships invisible unless destroyed
                ship.setVisible(false);
                ship.setAlpha(0);
            }
        });
    }

    // Override the shutdown method to clean up event listeners
    shutdown(): void {
        // Remove our specific event listener
        this.events.off('turnChanged', this.onCPUTurnChanged, this);
        
        // Cancel any pending CPU move timer
        if (this.cpuMoveTimer) {
            this.cpuMoveTimer.remove();
            this.cpuMoveTimer = null;
        }
        
        // Call the parent shutdown method
        super.shutdown();
    }

    // Switch turns between player and CPU
    protected switchTurn(): void {
        this.isPlayer1Turn = true;
        this.updateTurnText('YOUR TURN');
        this.updateShipVisibility();
        
        // Emit an event that the turn has changed
        this.events.emit('turnChanged');
    }

    // Override the handleAttack method from BattleScene to properly handle player attacks in CPU mode
    protected handleAttack(row: number, col: number): void {
        // Only allow attacks when it's the player's turn
        if (this.isPlayer1Turn) {
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
                console.log(`Hit a CPU ship at ${row},${col}!`);
                
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
                
                // Play miss sound
                try {
                    if (this.sound.get('missplunge')) {
                        console.log('Playing miss sound');
                        const missSound = this.sound.add('missplunge', { volume: 0.5 });
                        missSound.play();
                    } else {
                        console.warn('Miss sound not found, adding it now');
                        const missSound = this.sound.add('missplunge', { volume: 0.5 });
                        missSound.play();
                    }
                } catch (error) {
                    console.error('Error playing miss sound:', error);
                }
                
                // Add miss effect
                this.addMissEffect(cellCoords.x, cellCoords.y);
                
                // Update game status
                this.updateGameStatus(`Miss!`);
                
                // Check if the game is over
                if (this.checkGameOver()) {
                    return;
                }
                
                // Switch turns after a miss - this is the key part that was missing
                this.isPlayer1Turn = false;
                this.updateTurnText('CPU TURN');
                this.updateShipVisibility();
                
                // Emit the turnChanged event to notify listeners
                this.events.emit('turnChanged');
            }
        }
    }
} 