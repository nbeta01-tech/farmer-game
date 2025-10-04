// Farmer.js
import { Entity } from './BaseEntity.js';
import {Crow, Scarecrow} from './Obstacle.js';  // G1: Import Crow for collision check
import { clamp, aabb, WIDTH, HEIGHT } from './Utils.js';  // G1: Import shared helpers and Crow for collision check

/**
 * The player-controlled Farmer entity, handling movement and input.
 */
export class Farmer extends Entity {
    /**
     * Creates a new Farmer.
     * @param {number} x - Initial x position.
     * @param {number} y - Initial y position.
     */
    constructor(x, y) {
        super(x, y, 34, 34);
        this.speed = 260;
        this.vx = 0;
        this.vy = 0;
        this.color = "#8b5a2b";

        // G2: Sprite animation setup
        this.sprite = new Image();
        this.sprite.src = 'sprites/farmer.png';  // 4x4 sprite sheet: rows=down/left/right/up, cols=walk frames
        this.frameWidth = 48;
        this.frameHeight = 48;
        this.currentFrame = 0;   // Current animation frame (0-3)
        this.currentRow = 0;     // Current direction row (0=down,1=left,2=right,3=up)
        this.frameTime = 0;      // Accumulator for frame advance (dt-based)
        this.frameDuration = 0.15;  // Seconds per frame for walk cycle
        this.isMoving = false;
    }

    /**
     * Handles keyboard input to set movement velocities.
     * @param {Input} input - The input handler providing key states.
     */
    handleInput(input) {
        const L = input.keys.has("ArrowLeft"), R = input.keys.has("ArrowRight");
        const U = input.keys.has("ArrowUp"), D = input.keys.has("ArrowDown");
        this.vx = (R - L) * this.speed;
        this.vy = (D - U) * this.speed;
    }

    /**
     * Updates the Farmer's position, clamping to bounds and checking static collisions.
     * @param {number} dt - Delta time in seconds.
     * @param {Game} game - The game instance for obstacle checks.
     */
    update(dt, game) {
        // G2: Update animation if sprite loaded
        if (this.sprite.complete) {
            this.isMoving = Math.abs(this.vx) + Math.abs(this.vy) > 0;
            if (this.isMoving) {
                this.frameTime += dt;
                if (this.frameTime >= this.frameDuration) {
                    this.currentFrame = (this.currentFrame + 1) % 4;  // Cycle through walk frames
                    this.frameTime = 0;
                }
                // Determine direction row based on velocity (prioritize vertical if tied)
                // let row = 0;  // Default: down
                if (Math.abs(this.vy) >= Math.abs(this.vx)) {
                    this.currentRow = this.vy > 0 ? 0 : 3;  // Down or up
                } else {
                    this.currentRow = this.vx > 0 ? 2 : 1;  // Right or left
                }
            } else {
                this.currentFrame = 0;  // Idle/standing frame
                this.frameTime = 0;
            }
        }

        // G2: ... (animation unchanged)
        // try movement
        const oldX = this.x, oldY = this.y;
        this.x = clamp(this.x + this.vx * dt, 0, game.WIDTH - this.w);  // G3: Use game.WIDTH
        this.y = clamp(this.y + this.vy * dt, 0, game.HEIGHT - this.h); // G3: Use game.HEIGHT
        // block through static obstacles only (scarecrows); crows don't block, just penalize
        const hitStatic = game.obstacles.some(o => !(o instanceof Crow) && aabb(this, o));
        if (hitStatic) { this.x = oldX; this.y = oldY; }
    }

    /**
     * Draws the Farmer (body and hat) on the canvas.
     * @param {CanvasRenderingContext2D} ctx - The 2D rendering context.
     */
    draw(ctx) {
        ctx.imageSmoothingEnabled = false; // prevent blurry pixels
        if (this.sprite && this.sprite.complete) {
            const sx = this.currentFrame * this.frameWidth;
            const sy = this.currentRow * this.frameHeight;
            ctx.drawImage(
                this.sprite,
                sx, sy, this.frameWidth, this.frameHeight,  // source crop
                this.x, this.y, this.w, this.h             // destination size
            );
        } else {
            // fallback if sprite not loaded
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.w, this.h);
        }
    }
}