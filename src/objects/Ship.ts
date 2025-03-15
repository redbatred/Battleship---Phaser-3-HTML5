import Phaser from 'phaser';

export enum ShipType {
    Small = 1,    // 1-cell ship (4 of these)
    Medium = 2,   // 2-cell ship (3 of these)
    Large = 3,    // 3-cell ship (2 of these)
    Huge = 4      // 4-cell ship (1 of these)
}

export interface ShipConfig {
    type: ShipType;
    imageKey: string;
}

export class Ship extends Phaser.GameObjects.Container {
    private shipType: ShipType;
    private image: Phaser.GameObjects.Sprite;
    private isHorizontal: boolean = false; // Default to vertical orientation
    private gridSize: number = 40; // Default grid size
    private isPlaced: boolean = false;
    private originalX: number = 0;
    private originalY: number = 0;
    private isDragging: boolean = false;
    private gridRow: number = -1;
    private gridCol: number = -1;

    constructor(scene: Phaser.Scene, config: ShipConfig, isEnemy: boolean = false) {
        super(scene, 0, 0);
        
        this.shipType = config.type;
        
        console.log(`Creating ship of type ${config.type} with image key ${config.imageKey}`);
        
        // Create the ship image
        this.image = scene.add.sprite(0, 0, config.imageKey);
        this.add(this.image);
        
        // Make sure the image is visible and has no padding
        this.image.setVisible(true);
        this.image.setAlpha(1);
        
        // Remove any default padding that might be causing gaps
        this.image.setOrigin(0.5, 0.5);
        
        console.log(`Ship image created with dimensions: ${this.image.width}x${this.image.height}`);
        
        // Set interactive properties if not an enemy ship
        if (!isEnemy) {
            // Make the container interactive with a rectangular hit area
            this.setInteractive(new Phaser.Geom.Rectangle(
                -this.image.width / 2, 
                -this.image.height / 2, 
                this.image.width, 
                this.image.height
            ), Phaser.Geom.Rectangle.Contains);
            
            // Enable dragging
            scene.input.setDraggable(this);
            
            // Set up drag events
            this.on('dragstart', this.onDragStart, this);
            this.on('drag', this.onDrag, this);
            this.on('dragend', this.onDragEnd, this);
            
            // Add hover effect
            this.on('pointerover', this.onPointerOver, this);
            this.on('pointerout', this.onPointerOut, this);
        } else {
            // Enemy ships are not visible initially
            this.setVisible(false);
        }
        
        // Set a high depth to ensure visibility
        this.setDepth(10);
        
        // Add to the scene
        scene.add.existing(this);
        
        // Make sure the container is visible
        this.setVisible(true);
        this.setAlpha(1);
        
        console.log(`Ship added to scene at position (${this.x}, ${this.y})`);
        
        // Debug: Add a visible marker at the ship's position
        const marker = scene.add.circle(0, 0, 5, 0x00ff00);
        this.add(marker);
        marker.setDepth(1);
    }
    
    place(x: number, y: number, gridSize: number): void {
        this.gridSize = gridSize;
        
        // Set exact position with no rounding that might cause gaps
        this.setPosition(Math.floor(x), Math.floor(y));
        this.originalX = x;
        this.originalY = y;
        
        console.log(`Placing ship at position (${x}, ${y}) with grid size ${gridSize}`);
        
        // Reset the image position to exact center
        this.image.setPosition(0, 0);
        
        // Set the angle based on orientation
        this.image.setAngle(this.isHorizontal ? 90 : 0);
        
        // Scale the ship to match the grid size based on ship type
        const cellCount = this.shipType;
        
        if (this.isHorizontal) {
            // For horizontal ships, width should be exactly cellCount * gridSize
            const width = cellCount * gridSize;
            const height = gridSize;
            this.image.setDisplaySize(width, height);
        } else {
            // For vertical ships, height should be exactly cellCount * gridSize
            const width = gridSize;
            const height = cellCount * gridSize;
            this.image.setDisplaySize(width, height);
        }
        
        // Update the hit area to match the grid dimensions exactly
        if (this.input && this.input.hitArea) {
            const hitArea = this.input.hitArea as Phaser.Geom.Rectangle;
            
            if (this.isHorizontal) {
                // When horizontal, width is cellCount * gridSize
                const width = cellCount * gridSize;
                const height = gridSize;
                
                hitArea.setTo(
                    -width / 2,
                    -height / 2,
                    width,
                    height
                );
            } else {
                // When vertical, height is cellCount * gridSize
                const width = gridSize;
                const height = cellCount * gridSize;
                
                hitArea.setTo(
                    -width / 2,
                    -height / 2,
                    width,
                    height
                );
            }
            
            console.log(`Set hitbox for ${this.isHorizontal ? 'horizontal' : 'vertical'} ship: ${this.image.displayWidth}x${this.image.displayHeight}`);
        }
        
        console.log(`Ship placed with dimensions: ${this.image.displayWidth}x${this.image.displayHeight}`);
    }
    
    placeOriginal(x: number, y: number): void {
        // Set exact position with no rounding that might cause gaps
        this.setPosition(Math.floor(x), Math.floor(y));
        this.originalX = x;
        this.originalY = y;
        
        console.log(`Placing ship at position (${x}, ${y}) with original dimensions`);
        
        // Reset the image position to exact center
        this.image.setPosition(0, 0);
        
        // Do NOT set angle or resize the image - keep it exactly as loaded
        
        // Update the hit area to match the original image dimensions
        if (this.input && this.input.hitArea) {
            const hitArea = this.input.hitArea as Phaser.Geom.Rectangle;
            
            hitArea.setTo(
                -this.image.width / 2,
                -this.image.height / 2,
                this.image.width,
                this.image.height
            );
            
            console.log(`Set hitbox to original dimensions: ${this.image.width}x${this.image.height}`);
        }
        
        console.log(`Ship placed with original dimensions: ${this.image.width}x${this.image.height}`);
    }
    
    private resizeToFitGrid(): void {
        // Calculate the width and height based on ship type and orientation
        const cellCount = this.shipType;
        
        console.log(`Resizing ship to fit grid. Cell count: ${cellCount}, Grid size: ${this.gridSize}`);
        
        // Get the original aspect ratio of the image
        const originalWidth = this.image.width;
        const originalHeight = this.image.height;
        const aspectRatio = originalWidth / originalHeight;
        
        if (this.isHorizontal) {
            // Horizontal ship - maintain aspect ratio
            // For horizontal ships, we want the width to be exactly cellCount * gridSize
            const targetWidth = this.gridSize * cellCount;
            
            // Calculate height based on the aspect ratio, but cap it at gridSize
            const heightBasedOnAspect = targetWidth / aspectRatio;
            const targetHeight = Math.min(heightBasedOnAspect, this.gridSize);
            
            // Set the display size
            this.image.setDisplaySize(targetWidth, targetHeight);
            
            // Center the image vertically within the grid cell
            this.image.setY(0);
            
            console.log(`Set horizontal ship size to ${this.image.displayWidth}x${this.image.displayHeight}`);
        } else {
            // Vertical ship - maintain aspect ratio
            // For vertical ships, we want the height to be exactly cellCount * gridSize
            const targetHeight = this.gridSize * cellCount;
            
            // Calculate width based on the aspect ratio, but cap it at gridSize
            const widthBasedOnAspect = targetHeight * aspectRatio;
            const targetWidth = Math.min(widthBasedOnAspect, this.gridSize);
            
            // Set the display size
            this.image.setDisplaySize(targetWidth, targetHeight);
            
            // Center the image horizontally within the grid cell
            this.image.setX(0);
            
            console.log(`Set vertical ship size to ${this.image.displayWidth}x${this.image.displayHeight}`);
        }
        
        // Update the hit area to match the new size
        if (this.input && this.input.hitArea) {
            this.input.hitArea.setTo(
                -this.image.displayWidth / 2,
                -this.image.displayHeight / 2,
                this.image.displayWidth,
                this.image.displayHeight
            );
            console.log(`Updated hit area to match new size: ${this.image.displayWidth}x${this.image.displayHeight}`);
        }
    }
    
    rotate(): void {
        // Toggle orientation
        this.isHorizontal = !this.isHorizontal;

        // Simply rotate the image without changing its size
        this.image.setAngle(this.isHorizontal ? 90 : 0);

        // If the ship is placed on the grid, adjust its position
        if (this.isPlaced) {
            const cellCount = this.shipType;
            if (this.isHorizontal) {
                // For horizontal ships, offset to the right by half the ship's length
                const offsetX = (cellCount - 1) * this.gridSize / 2;
                this.image.setX(offsetX);
                this.image.setY(0);
            } else {
                // For vertical ships, offset downward by half the ship's length
                const offsetY = (cellCount - 1) * this.gridSize / 2;
                this.image.setY(offsetY);
                this.image.setX(0);
            }
        }

        // Update the hit area to match the image dimensions
        if (this.input && this.input.hitArea) {
            const hitArea = this.input.hitArea as Phaser.Geom.Rectangle;
            
            // Use the actual image dimensions for the hit area, accounting for rotation
            if (this.isHorizontal) {
                // When horizontal, swap width and height for the hitbox
                hitArea.setTo(
                    -this.image.height / 2, // Swap width and height due to rotation
                    -this.image.width / 2,
                    this.image.height,
                    this.image.width
                );
            } else {
                hitArea.setTo(
                    -this.image.width / 2,
                    -this.image.height / 2,
                    this.image.width,
                    this.image.height
                );
            }
        }
        
        console.log(`Ship rotated to ${this.isHorizontal ? 'horizontal' : 'vertical'} orientation with dimensions: ${this.image.width}x${this.image.height}`);
    }
    
    getType(): ShipType {
        return this.shipType;
    }
    
    isHorizontalOrientation(): boolean {
        return this.isHorizontal;
    }
    
    markAsPlaced(row: number, col: number): void {
        this.isPlaced = true;
        this.gridRow = row;
        this.gridCol = col;

        // Apply position offsets without resizing
        const cellCount = this.shipType;
        if (this.isHorizontal) {
            this.image.setX((cellCount - 1) * this.gridSize / 2);
        } else {
            this.image.setY((cellCount - 1) * this.gridSize / 2);
        }
    }
    
    resetPlacement(): void {
        this.isPlaced = false;
        this.gridRow = -1;
        this.gridCol = -1;
        
        // Reset the ship's position to its original position
        this.setPosition(this.originalX, this.originalY);
        
        // Reset the image position within the container
        this.image.setPosition(0, 0);
        
        // Ensure the hitbox is updated to match the ship's reset position
        if (this.input && this.input.hitArea) {
            this.input.hitArea.setTo(
                -this.image.displayWidth / 2,
                -this.image.displayHeight / 2,
                this.image.displayWidth,
                this.image.displayHeight
            );
            
            console.log(`Updated hitbox after reset: ${this.image.displayWidth}x${this.image.displayHeight}`);
        }
    }
    
    // Add method to set tint on the ship image
    setTint(color: number): void {
        this.image.setTint(color);
    }
    
    getGridPosition(): { row: number, col: number } | null {
        if (!this.isPlaced) return null;
        return { row: this.gridRow, col: this.gridCol };
    }
    
    private onDragStart(pointer: Phaser.Input.Pointer): void {
        this.isDragging = true;
        this.setDepth(100); // Bring to front while dragging
        
        // If the ship was already placed, reset its placement
        if (this.isPlaced) {
            // Emit an event to notify the grid that this ship is being moved
            this.scene.events.emit('ship-pickup', this);
            this.isPlaced = false;
        }
    }
    
    private onDrag(pointer: Phaser.Input.Pointer, dragX: number, dragY: number): void {
        this.setPosition(dragX, dragY);
    }
    
    private onDragEnd(pointer: Phaser.Input.Pointer): void {
        this.isDragging = false;
        this.setDepth(1); // Reset depth
        
        // Emit an event to check if the ship can be placed at the current position
        this.scene.events.emit('ship-drop', this, pointer.x, pointer.y);
    }
    
    private onPointerOver(): void {
        // Highlight effect when hovering
        this.image.setTint(0xaaaaff);
    }
    
    private onPointerOut(): void {
        // Remove highlight
        this.image.clearTint();
    }
    
    // Method to handle ship hit
    hit(): void {
        // Visual feedback for hit
        this.image.setTint(0xff0000);
    }
    
    // Method to check if ship is sunk (would be implemented with hit tracking)
    isSunk(): boolean {
        // Placeholder - would need hit tracking logic
        return false;
    }
} 