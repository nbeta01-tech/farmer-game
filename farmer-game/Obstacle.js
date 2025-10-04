// Obstacle.js
import { Entity } from './BaseEntity.js';
import { WIDTH } from './Utils.js';  // G1: Import WIDTH for Crow wrap-around

/**
 * Static Scarecrow obstacle that blocks player movement.
 */
export class Scarecrow extends Entity {
    /**
     * Creates a new Scarecrow.
     * @param {number} x - Initial x position.
     * @param {number} y - Initial y position.
     */
    constructor(x, y) { 
        super(x, y, 26, 46); 
    }

    /**
     * Draws the Scarecrow (pole, head, arms).
     * @param {CanvasRenderingContext2D} ctx - The 2D rendering context.
     */
    draw(ctx) {
        const { x, y, w, h } = this;
        ctx.fillStyle = "#9b7653";
        ctx.fillRect(x + w / 2 - 3, y, 6, h); // pole
        ctx.fillStyle = "#c28e0e";
        ctx.beginPath(); 
        ctx.arc(x + w / 2, y + 10, 10, 0, Math.PI * 2); 
        ctx.fill(); // head
        ctx.strokeStyle = "#6b4f2a"; 
        ctx.lineWidth = 4;
        ctx.beginPath(); 
        ctx.moveTo(x, y + 18); 
        ctx.lineTo(x + w, y + 18); 
        ctx.stroke(); // arms
    }
}

/**
 * Moving Crow obstacle that deducts points on collision and wraps around screen.
 */
export class Crow extends Entity {
    /**
     * Creates a new Crow.
     * @param {number} x - Initial x position.
     * @param {number} y - Initial y position.
     */
    constructor(x, y) {
        super(x, y, 20, 16);
        this.vx = (Math.random() - 0.5) * 2 * 150 + 100;  // Random horizontal speed: 100-200 px/s, direction varies
        this.color = "#000";
    }

    /**
     * Updates the Crow's horizontal position with screen wrapping.
     * @param {number} dt - Delta time in seconds.
     * @param {Game} game - The game instance (unused here).
     */
    update(dt, game) {
        this.x += this.vx * dt;
        // Wrap around screen edges
        if (this.x < -this.w) this.x = WIDTH;
        if (this.x > WIDTH) this.x = -this.w;
    }

    /**
     * Draws the Crow (bird shape with eye).
     * @param {CanvasRenderingContext2D} ctx - The 2D rendering context.
     */
    draw(ctx) {
        const { x, y, w, h } = this;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(x, y + h / 2);
        ctx.lineTo(x + w / 2, y);
        ctx.lineTo(x + w, y + h / 2);
        ctx.lineTo(x + w / 2, y + h);
        ctx.closePath();
        ctx.fill();
        // Eye
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(x + w / 2 - 2, y + 4, 2, 0, Math.PI * 2);
        ctx.fill();
    }
}