// BaseEntity.js

/**
 * Base class for all game entities, providing common properties and methods.
 */
export class Entity {
    /**
     * Creates a new Entity.
     * @param {number} x - Initial x position.
     * @param {number} y - Initial y position.
     * @param {number} w - Width of the entity.
     * @param {number} h - Height of the entity.
     */
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.dead = false;
    }

    /**
     * Updates the entity's state.
     * @param {number} dt - Delta time in seconds.
     * @param {Game} game - The game instance for context.
     */
    update(dt, game) { }

    /**
     * Draws the entity on the canvas.
     * @param {CanvasRenderingContext2D} ctx - The 2D rendering context.
     */
    draw(ctx) { }
}

