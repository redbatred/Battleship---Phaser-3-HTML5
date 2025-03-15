import Phaser from 'phaser';
import { Ship, ShipType } from './Ship';

export class Grid extends Phaser.GameObjects.Container {
    private rows: number;
    private cols: number;
    private cellSize: number;
    private cells: (Ship | null)[][];
    private gridGraphics: Phaser.GameObjects.Graphics;
    private label: string;
    private gridContainer: Phaser.GameObjects.Container;

    constructor(scene: Phaser.Scene, x: number, y: number, rows: number, cols: number, label: string) {
        super(scene, x, y);
        this.rows = rows;
        this.cols = cols;
        this.cellSize = 40; // Default cell size
        this.label = label;
        
        // Initialize the grid cells
        this.cells = Array(rows).fill(null).map(() => Array(cols).fill(null));
        
        // Create a container for the grid
        this.gridContainer = scene.add.container(x, y);
        
        // Draw the grid
        this.gridGraphics = scene.add.graphics();
        this.drawGrid();
        
        // Add the grid label
        const labelText = scene.add.text(0, -30, label, {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        });
        labelText.setOrigin(0.5, 0.5);
        
        // Add elements to the container
        this.gridContainer.add([this.gridGraphics, labelText]);
    }
    
    private drawGrid(): void {
        this.gridGraphics.clear();
        
        // Calculate the total width and height of the grid
        const width = this.cols * this.cellSize;
        const height = this.rows * this.cellSize;
        
        // Center the grid on the provided coordinates
        const startX = -width / 2;
        const startY = -height / 2;
        
        // Draw the grid background
        this.gridGraphics.fillStyle(0x0077be, 0.3); // Light blue with transparency
        this.gridGraphics.fillRect(startX, startY, width, height);
        
        // Draw the grid lines
        this.gridGraphics.lineStyle(1, 0xffffff, 0.5);
        
        // Draw horizontal lines
        for (let i = 0; i <= this.rows; i++) {
            const y = startY + i * this.cellSize;
            this.gridGraphics.moveTo(startX, y);
            this.gridGraphics.lineTo(startX + width, y);
        }
        
        // Draw vertical lines
        for (let i = 0; i <= this.cols; i++) {
            const x = startX + i * this.cellSize;
            this.gridGraphics.moveTo(x, startY);
            this.gridGraphics.lineTo(x, startY + height);
        }
        
        this.gridGraphics.strokePath();
    }
    
    getGridCoordinates(worldX: number, worldY: number): { row: number, col: number } | null {
        // Calculate the grid bounds
        const gridWidth = this.cols * this.cellSize;
        const gridHeight = this.rows * this.cellSize;
        const gridLeft = this.x - gridWidth / 2;
        const gridTop = this.y - gridHeight / 2;
        
        // Check if the point is within the grid bounds
        if (worldX < gridLeft || worldX >= gridLeft + gridWidth || 
            worldY < gridTop || worldY >= gridTop + gridHeight) {
            return null;
        }
        
        // Calculate the row and column indices
        const col = Math.floor((worldX - gridLeft) / this.cellSize);
        const row = Math.floor((worldY - gridTop) / this.cellSize);
        
        // Ensure the indices are within bounds
        if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
            return { row, col };
        }
        
        return null;
    }
    
    getWorldCoordinates(row: number, col: number): { x: number, y: number } {
        // Calculate the grid bounds
        const gridWidth = this.cols * this.cellSize;
        const gridHeight = this.rows * this.cellSize;
        const gridLeft = this.x - gridWidth / 2;
        const gridTop = this.y - gridHeight / 2;
        
        // Calculate the center of the cell
        const cellX = gridLeft + col * this.cellSize + this.cellSize / 2;
        const cellY = gridTop + row * this.cellSize + this.cellSize / 2;
        
        return { x: cellX, y: cellY };
    }
    
    canPlaceShip(shipType: ShipType, row: number, col: number, isHorizontal: boolean): boolean {
        const length = shipType;
        
        // Check if the ship would go out of bounds
        if (isHorizontal) {
            if (col + length > this.cols) {
                console.log(`Ship placement invalid: horizontal ship of length ${length} at col ${col} would exceed grid width ${this.cols}`);
                return false;
            }
        } else {
            if (row + length > this.rows) {
                console.log(`Ship placement invalid: vertical ship of length ${length} at row ${row} would exceed grid height ${this.rows}`);
                return false;
            }
        }
        
        // Check if any of the cells are already occupied
        for (let i = 0; i < length; i++) {
            const checkRow = isHorizontal ? row : row + i;
            const checkCol = isHorizontal ? col + i : col;
            
            if (this.cells[checkRow][checkCol] !== null) {
                console.log(`Ship placement invalid: cell at (${checkRow}, ${checkCol}) is already occupied`);
                return false;
            }
        }
        
        console.log(`Ship placement valid: ${isHorizontal ? 'horizontal' : 'vertical'} ship of length ${length} at (${row}, ${col})`);
        return true;
    }
    
    placeShip(ship: Ship, row: number, col: number): boolean {
        const shipType = ship.getType();
        const isHorizontal = ship.isHorizontalOrientation();
        
        if (!this.canPlaceShip(shipType, row, col, isHorizontal)) {
            return false;
        }
        
        // Place the ship in the grid cells
        const length = shipType;
        for (let i = 0; i < length; i++) {
            const placeRow = isHorizontal ? row : row + i;
            const placeCol = isHorizontal ? col + i : col;
            
            this.cells[placeRow][placeCol] = ship;
            console.log(`Placed ship in cell (${placeRow}, ${placeCol})`);
        }
        
        return true;
    }
    
    removeShip(row: number, col: number, shipType: ShipType, isHorizontal: boolean): void {
        const length = shipType;
        
        // Remove the ship from the grid cells
        for (let i = 0; i < length; i++) {
            const removeRow = isHorizontal ? row : row + i;
            const removeCol = isHorizontal ? col + i : col;
            
            // Check if the cell is within bounds
            if (removeRow >= 0 && removeRow < this.rows && 
                removeCol >= 0 && removeCol < this.cols) {
                this.cells[removeRow][removeCol] = null;
            }
        }
    }
    
    handleCellClick(row: number, col: number): void {
        // This will be implemented for attack handling
        console.log(`Cell clicked: (${row}, ${col})`);
    }
    
    isAllShipsSunk(): boolean {
        // This is a placeholder. In a real implementation, 
        // this would check if all ships on this grid are sunk
        return false;
    }
    
    getCellSize(): number {
        console.log(`Grid cell size: ${this.cellSize}`);
        return this.cellSize;
    }
    
    public getX(): number {
        return this.x;
    }
    
    public getY(): number {
        return this.y;
    }

    public getWidth(): number {
        return this.cellSize * this.cols;
    }

    public getHeight(): number {
        return this.rows * this.cellSize;
    }

    // Get the ship at a specific grid position
    public getShipAt(row: number, col: number): Ship | null {
        if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) {
            return null;
        }
        return this.cells[row][col];
    }
} 