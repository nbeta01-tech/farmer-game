// Game.js
import { Farmer } from './Farmer.js';
import { Crop } from './Crop.js';
import { Scarecrow, Crow } from './Obstacle.js';

// All Arrow comments are related to Q1.A
// bind is for Q1.B

// Config & helpers (global for simplicity; could be imported if modularized further)
// G3: Moved dynamic configs to instance; globals for fixed values
const State = Object.freeze({ MENU: "MENU", PLAYING: "PLAYING", PAUSED: "PAUSED", GAME_OVER: "GAME_OVER", WIN: "WIN" });

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const aabb = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

/**
 * Input handler class for managing keyboard events.
 */
class Input {
    /**
     * Creates a new Input handler.
     * @param {Game} game - The game instance to pass events to.
     */
    constructor(game) {
        this.game = game;
        this.keys = new Set();
        this._onKeyDown = this.onKeyDown.bind(this); // bind #1: necessary because onKeyDown is a regular method; event listener calls it with dynamic 'this' = window (event target). bind sets 'this' to Input instance. Arrow function alternative: define onKeyDown as arrow for lexical binding, but bind keeps it as reusable method
        this._onKeyUp = this.onKeyUp.bind(this);   // bind #2: same as #1; fixes dynamic 'this' rebinding in event callback to ensure 'this.keys' accesses Input's Set
        window.addEventListener("keydown", this._onKeyDown);
        window.addEventListener("keyup", this._onKeyUp);
    }

    /**
     * Handles key down events, adding to set and pausing on 'P'.
     * @param {KeyboardEvent} e - The key down event.
     */
    onKeyDown(e) {
        if (e.key === "p" || e.key === "P") this.game.togglePause();
        this.keys.add(e.key);
    }

    /**
     * Handles key up events, removing from set.
     * @param {KeyboardEvent} e - The key up event.
     */
    onKeyUp(e) { 
        this.keys.delete(e.key); 
    }

    /**
     * Cleans up event listeners.
     */
    dispose() {
        window.removeEventListener("keydown", this._onKeyDown);
        window.removeEventListener("keyup", this._onKeyUp);
    }
}

/**
 * Main Game class orchestrating entities, updates, rendering, and UI.
 */
export class Game {
    /**
     * Creates a new Game instance.
     * @param {HTMLCanvasElement} canvas - The canvas element to render on.
     */
    constructor(canvas) {
        if (!canvas) {
            console.error("Canvas #game not found. Check index.html IDs.");
            return;
        }
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.state = State.MENU;

        // G3: Dynamic dimensions (could be from config, but fixed here)
        this.WIDTH = 900;
        this.HEIGHT = 540;
        this.TILE = 30;

        // world
        this.player = new Farmer(this.WIDTH / 2 - 17, this.HEIGHT - 80);
        this.crops = [];
        this.obstacles = [];

        // Level system (G1) - defaults until config loads
        this.currentLevel = 1;
        this.levelGoals = [15, 30, 45];  // Cumulative points to advance each level
        this.timeLimits = [60, 60, 60];  // G3: Per-level time limits (fallback)
        this.baseSpawnEvery = [0.8, 0.6, 0.4];  // Faster crop spawns per level
        this.baseCrowSpawnEvery = [5, 4, 3];    // More frequent crows per level

        // Crow spawn timing (for moving obstacles) Q2. D Moving obstacles (crows)
        this._accumCrow = 0;
        this.crowSpawnEvery = this.baseCrowSpawnEvery[0];  // Level-based

        // timing Q2.B Difficulty curve with spawn rate increase
        this.lastTime = 0;
        this.timeLeft = this.timeLimits[0];  // Fallback (G3: no GAME_LEN)
        this.spawnEvery = this.baseSpawnEvery[0]; // Initial spawn interval; level-based base, decreases over time
        this._accumSpawn = 0;

        // score & goal
        this.score = 0;
        this.goal = this.levelGoals[0];  // Initial level goal

        // G3: Load configurable difficulty from JSON
        this.configLoaded = false;
        this.config = null;
        this.loadConfig();

        // input & resize
        this.input = new Input(this);
        this._onResize = this.onResize.bind(this);
        window.addEventListener("resize", this._onResize);

        // UI
        const get = id => document.getElementById(id) || console.error(`#${id} not found`);
        this.ui = {
            score: get("score"),
            time: get("time"),
            goal: get("goal"),
            status: get("status"),
            start: get("btnStart"),
            reset: get("btnReset"),
        };
        if (this.ui.goal) {
            this.updateGoalUI();  // Set initial progress display
        }
        if (this.ui.start) this.ui.start.addEventListener("click", () => this.start()); // Q1.C arrow: lexical 'this' binds to Game (constructor scope), so this.start() calls Game's method; regular anon function would set 'this' = button element
        if (this.ui.reset) this.ui.reset.addEventListener("click", () => this.reset()); // Q1.C same lexical binding for reset; event listener context preserved without bind
        // RAF loop as arrow function → lexical `this`
        this.tick = (ts) => {
            //Q1.A arrow function: lexical 'this' binds to Game instance (from constructor scope), so this.update() and this.render() refer to the game; a regular function would set 'this' to window (global) in RAF callback
            const dt = Math.min((ts - this.lastTime) / 1000, 0.033); // ~30ms cap
            this.lastTime = ts;
            this.update(dt);
            this.render();
            requestAnimationFrame(this.tick);
        };
    }

    /**
     * Handles window resize (stub for fixed-size canvas).
     */
    onResize() {
        // fixed canvas size for simplicity; handle DPR here if desired
    }

    /**
     * Starts or resumes the game (waits for config if loading).
     */
    start() {
        if (!this.configLoaded) {
            if (this.ui.status) this.ui.status.textContent = "Loading config...";
            setTimeout(() => this.start(), 100);  // Retry in 100ms
            return;
        }
        if (this.state === State.MENU || this.state === State.GAME_OVER || this.state === State.WIN) {
            this.reset();
            this.state = State.PLAYING;
            if (this.ui.status) this.ui.status.textContent = "Playing…";
            requestAnimationFrame(this.tick);
        } else if (this.state === State.PAUSED) {
            this.state = State.PLAYING;
            if (this.ui.status) this.ui.status.textContent = "Playing…";
        }
    }

    /**
     * Resets the game to menu state (Level 1).
     */
    reset() {
        this.state = State.MENU;
        this.currentLevel = 1;  // G1: Reset to Level 1
        // G3: Use fallbacks if config not loaded yet
        this.goal = this.levelGoals?.[0] ?? 15;
        this.spawnEvery = this.baseSpawnEvery?.[0] ?? 0.8;
        this.crowSpawnEvery = this.baseCrowSpawnEvery?.[0] ?? 5;
        this.player = new Farmer(this.WIDTH / 2 - 17, this.HEIGHT - 80);  // G3: Use instance props
        this.crops.length = 0;
        this.obstacles.length = 0;
        this._accumCrow = 0;  // Reset crow accumulator
        this.score = 0;
        this.timeLeft = this.timeLimits?.[0] ?? 60;  // G3: Use config time limit or fallback
        this._accumSpawn = 0;
        this.lastTime = performance.now();
        this.placeScarecrows();  // G1: Place level-based scarecrows
        this.updateGoalUI();     // G1: Update goal display
        this.syncUI();
        if (this.ui.status) this.ui.status.textContent = "Menu";
    }

    /**
     * Toggles pause state.
     */
    togglePause() {
        if (this.state === State.PLAYING) {
            this.state = State.PAUSED;
            if (this.ui.status) this.ui.status.textContent = "Paused";
        } else if (this.state === State.PAUSED) {
            this.state = State.PLAYING;
            if (this.ui.status) this.ui.status.textContent = "Playing…";
        }
    }

    /**
     * Synchronizes UI elements with current game state.
     */
    syncUI() {
        if (this.ui.score) this.ui.score.textContent = String(this.score);
        if (this.ui.time) this.ui.time.textContent = Math.ceil(this.timeLeft);
        this.updateGoalUI();  // G1/G3: Always use progress display (overrides simple goal)
    }

    /**
     * Loads and parses config.json for difficulty settings.
     * Sets this.configLoaded = true on success/fallback.
     */
    async loadConfig() {
        try {
            const response = await fetch('config.json');
            if (!response.ok) throw new Error('Config not found');
            this.config = await response.json();
        } catch (e) {
            console.warn('Config load failed, using defaults:', e);
            this.config = {
                levels: [
                    { goal: 15, timeLimit: 60, spawnRate: 0.8, crowRate: 5 },
                    { goal: 30, timeLimit: 60, spawnRate: 0.6, crowRate: 4 },
                    { goal: 45, timeLimit: 60, spawnRate: 0.4, crowRate: 3 }
                ]
            };
        }
        this.applyConfig();
        this.configLoaded = true;
    }

    /**
     * Applies loaded config to game properties (level goals, rates, etc.).
     */
    applyConfig() {
        const levels = this.config.levels;
        this.levelGoals = levels.map(l => l.goal);
        this.timeLimits = levels.map(l => l.timeLimit);  // G3: Per-level time limits
        this.baseSpawnEvery = levels.map(l => l.spawnRate);
        this.baseCrowSpawnEvery = levels.map(l => l.crowRate);
    }

    /**
     * Updates the goal UI to show progress toward current level (e.g., "10/15").
     */
    updateGoalUI() {
        if (this.ui.goal) {
            const target = this.levelGoals?.[this.currentLevel - 1] ?? 15;
            this.ui.goal.textContent = `${this.score}/${target}`;
        }
    }

    /**
     * Places level-based number of static Scarecrows at fixed positions.
     */
    placeScarecrows() {
        this.obstacles = [];  // Clear any existing
        const positions = [
            {x: 200, y: 220}, {x: 650, y: 160},  // Level 1+
            {x: 400, y: 300},                      // Level 2+
            {x: 100, y: 400}                       // Level 3+
        ];
        const num = 1 + this.currentLevel;  // 2/3/4 scarecrows
        for (let i = 0; i < num; i++) {
            this.obstacles.push(new Scarecrow(positions[i].x, positions[i].y));
        }
    }

    /**
     * Advances to the next level, resetting the round for higher difficulty.
     */
    advanceLevel() {
        this.currentLevel++;
        if (this.ui.status) {
            this.ui.status.textContent = `Level ${this.currentLevel} Started!`;
        }
        if (this.currentLevel > 3) {
            this.state = State.WIN;
            if (this.ui.status) this.ui.status.textContent = "All Levels Complete! You Win!";
            return;
        }
        this.goal = this.levelGoals[this.currentLevel - 1];
        this.resetRound();
    }

    /**
     * Resets the round (timer, crops, crows) for the new level without full reset.
     */
    resetRound() {
        this.timeLeft = this.timeLimits?.[this.currentLevel - 1] ?? 60;  // G3: Per-level time limit or fallback
        this.crops.length = 0;
        // Keep scarecrows, remove crows
        this.obstacles = this.obstacles.filter(o => o instanceof Scarecrow);
        this.placeScarecrows();  // Add more for new level
        this._accumSpawn = 0;
        this._accumCrow = 0;
        this.spawnEvery = this.baseSpawnEvery[this.currentLevel - 1];
        this.crowSpawnEvery = this.baseCrowSpawnEvery[this.currentLevel - 1];
        this.updateGoalUI();
        this.lastTime = performance.now();  // Reset timing
    }

    // Q2.A Different crop types with distinct point values
    /**
     * Spawns a new random Crop at a grid-aligned position.
     */
    spawnCrop() {
        const gx = Math.floor(Math.random() * ((this.WIDTH - 2 * this.TILE) / this.TILE)) * this.TILE + this.TILE;  // G3: Use instance props
        const gy = Math.floor(Math.random() * ((this.HEIGHT - 2 * this.TILE) / this.TILE)) * this.TILE + this.TILE;  // G3: Use instance props
        // Random type: 30% wheat (1pt), 50% pumpkin (3pt), 20% golden_apple (5pt)
        const rand = Math.random();
        const type = rand < 0.3 ? "wheat" : rand < 0.8 ? "pumpkin" : "golden_apple";
        this.crops.push(new Crop(gx, gy, type));
    }

    /**
     * Updates game logic (timing, spawning, collisions, etc.) for the frame.
     * @param {number} dt - Delta time in seconds.
     */
    update(dt) {
        if (this.state !== State.PLAYING) return;

        // countdown
        const maxTime = this.timeLimits?.[this.currentLevel - 1] ?? 60;  // G3: Fallback
        this.timeLeft = clamp(this.timeLeft - dt, 0, maxTime);
        if (this.timeLeft <= 0) {
            // G1: Game Over if level goal not reached (no auto-advance on timeout)
            this.state = State.GAME_OVER;
            if (this.ui.status) this.ui.status.textContent = "Time's Up! Game Over";
            this.syncUI();
            return;
        }

        // player
        this.player.handleInput(this.input);
        this.player.update(dt, this);

        // Spawn crows (moving obstacles)
        this._accumCrow += dt;
        while (this._accumCrow >= this.crowSpawnEvery) {
            this._accumCrow -= this.crowSpawnEvery;
            const cx = Math.random() * this.WIDTH;  // G3: Use instance prop
            const cy = Math.random() * (this.HEIGHT - 100) + 50;
            this.obstacles.push(new Crow(cx, cy)); // Spawn at top
        }

        // Update moving obstacles
        this.obstacles.forEach(o => {
            if (o instanceof Crow) o.update(dt, this);  // Only crows move; scarecrows static
        });

        // Penalize on crow collision (after movement to detect hits)
        const hitCrows = this.obstacles.filter(o => o instanceof Crow && aabb(this.player, o));
        if (hitCrows.length) {
            this.score = Math.max(0, this.score - 2 * hitCrows.length);  // Deduct 2 pts per crow touched
            if (this.ui.score) this.ui.score.textContent = String(this.score);
            // Respawn hit crows at random x
            hitCrows.forEach(crow => {
                crow.x = Math.random() * this.WIDTH;  // G3: Use instance prop
                crow.y = 50;
            });
        }
        // spawn crops Q2. B Difficulty curve with spawn rate increase
        // Difficulty curve: ramp from base to base-0.5 as time progresses (higher density), clamped min 0.1
        const baseRate = this.baseSpawnEvery[this.currentLevel - 1];
        const progress = 1 - this.timeLeft / maxTime;
        this.spawnEvery = clamp(baseRate - 0.5 * progress, 0.1, baseRate);  // G3/G2.B: Dynamic per level, no GAME_LEN
        this._accumSpawn += dt;
        while (this._accumSpawn >= this.spawnEvery) {
            this._accumSpawn -= this.spawnEvery;
            this.spawnCrop();
        }

        // collect crops
        const collected = this.crops.filter(c => aabb(this.player, c));     // arrow #1: lexical 'this' binds to Game instance (enclosing scope), so this.player refers to the game's player; a regular function would lose context and set 'this' to undefined or global
        if (collected.length) {
            collected.forEach(c => c.dead = true);                             // arrow #2: lexical 'this' inherited from update() method (Game instance); no need for explicit 'this' here, but binding is preserved unlike dynamic binding in regular functions
            this.score += collected.reduce((sum, c) => sum + c.points, 0);     // Sum points from different crop types instead of fixed 1 per crop
            if (this.ui.score) this.ui.score.textContent = String(this.score);
            this.updateGoalUI();  // G1: Update progress display
            // G1: Check for level advance on score milestone (instead of win)
            if (this.score >= this.goal) {
                this.advanceLevel();
            }
        }
        this.crops = this.crops.filter(c => !c.dead);    // arrow #3: lexical 'this' from Game; filter's callback captures update()'s scope, avoiding 'this' rebinding on array method call
        this.crops.forEach(c => c.update(dt, this));                         // arrow #4: lexical 'this' ensures the explicit 'this' passed to c.update is the Game instance; regular function would dynamically bind 'this' to the Crop or array

        // timer UI
        if (this.ui.time) this.ui.time.textContent = Math.ceil(this.timeLeft);
    }

    /**
     * Renders the game scene (background, entities, UI text).
     */
    render() {
        const ctx = this.ctx;
        if (!ctx) return;

        ctx.clearRect(0, 0, this.WIDTH, this.HEIGHT);  // G3: Use instance props

        // field background (grid)
        ctx.fillStyle = "#dff0d5";
        ctx.fillRect(0, 0, this.WIDTH, this.HEIGHT);  // G3: Use instance props
        ctx.strokeStyle = "#c7e0bd";
        ctx.lineWidth = 1;
        for (let y = this.TILE; y < this.HEIGHT; y += this.TILE) {  // G3: Use instance props
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(this.WIDTH, y); ctx.stroke();
        }
        for (let x = this.TILE; x < this.WIDTH; x += this.TILE) {  // G3: Use instance props
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, this.HEIGHT); ctx.stroke();
        }

        // crops, obstacles, farmer
        this.crops.forEach(c => c.draw(ctx));                                 // arrow #5: lexical 'this' from render() (Game instance); callback doesn't use 'this' directly, but binding ensures consistency if it did (e.g., accessing game properties)
        this.obstacles.forEach(o => o.draw(ctx));                             // arrow #6: same lexical binding as #5; preserves Game's 'this' for any nested references, unlike regular functions where 'this' would be the array; now draws crows too
        this.player.draw(ctx);

        // state labels
        ctx.fillStyle = "#333";
        ctx.font = "16px system-ui, sans-serif";
        if (this.state === State.MENU) {
            ctx.fillText("Press Start to play", 20, 28);
        } else if (this.state === State.PLAYING || this.state === State.PAUSED) {
            // G1: Show current level during play
            ctx.fillText(`Level ${this.currentLevel}`, 20, 28);
            if (this.state === State.PAUSED) {
                ctx.fillText("Paused (press P to resume)", 20, 50);
            }
        } else if (this.state === State.GAME_OVER) {
            ctx.fillText("Time up! Press Reset to return to Menu", 20, 28);
        } else if (this.state === State.WIN) {
            ctx.fillText("All levels complete! Press Reset for another round", 20, 28);  // G1: Updated win text
        }
    }

    /**
     * Cleans up resources (event listeners).
     */
    dispose() {
        this.input.dispose();
        window.removeEventListener("resize", this._onResize);
    }
}