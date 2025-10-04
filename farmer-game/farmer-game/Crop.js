// Crop.js
import { Entity } from './BaseEntity.js';

/**
 * Collectible Crop entity with varying types and point values (wheat=1, pumpkin=3, golden_apple=5).
 */
export class Crop extends Entity {
    /**
     * Creates a new Crop.
     * @param {number} x - Initial x position.
     * @param {number} y - Initial y position.
     * @param {string} [type="wheat"] - Crop type ("wheat", "pumpkin", "golden_apple").
     */
    constructor(x, y, type = "wheat") {
        super(x, y, 20, 26);
        this.type = type;
        // Assign points based on type: wheat=1, pumpkin=3, golden_apple=5
        this.points = { wheat: 1, pumpkin: 3, golden_apple: 5 }[type] || 1;
        this.sway = Math.random() * Math.PI * 2;
    }

    /**
     * Updates the crop's animation (sway for wheat).
     * @param {number} dt - Delta time in seconds.
     * @param {Game} game - The game instance (unused here).
     */
    update(dt, game) { 
        this.sway += dt * 2; 
    }

    /**
     * Draws the crop based on its type.
     * @param {CanvasRenderingContext2D} ctx - The 2D rendering context.
     */
    draw(ctx) {
        const { x, y, w, h } = this;
        if (this.type === "wheat") {
            // Wheat: thin stalk with small head
            ctx.strokeStyle = "#2f7d32";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(x + w / 2, y + h);
            ctx.quadraticCurveTo(x + w / 2 + Math.sin(this.sway) * 3, y + h / 2, x + w / 2, y);
            ctx.stroke();
            ctx.fillStyle = "#d9a441";
            ctx.beginPath();
            ctx.ellipse(x + w / 2, y, 8, 6, 0, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === "pumpkin") {
            // Pumpkin: orange circle on short stem
            ctx.strokeStyle = "#2f7d32";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x + w / 2, y + h);
            ctx.lineTo(x + w / 2, y + h - 4);
            ctx.stroke();
            ctx.fillStyle = "#ff7518";
            ctx.beginPath();
            ctx.arc(x + w / 2, y + 2, 10, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === "golden_apple") {
            // Golden apple: gold circle with shine
            ctx.strokeStyle = "#2f7d32";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x + w / 2, y + h);
            ctx.lineTo(x + w / 2, y + h - 6);
            ctx.stroke();
            ctx.fillStyle = "#ffd700";
            ctx.beginPath();
            ctx.arc(x + w / 2, y + 3, 9, 0, Math.PI * 2);
            ctx.fill();
            // Shine effect
            ctx.fillStyle = "rgba(255,255,255,0.5)";
            ctx.beginPath();
            ctx.arc(x + w / 2 - 3, y, 4, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}