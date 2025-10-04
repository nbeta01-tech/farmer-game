// =========================
// Farmer Harvest — no libs
// =========================

// ---- Config & helpers ----

// All Arrow comments are related to Q1.A
const WIDTH = 900, HEIGHT = 540;
const TILE = 30;           // for a subtle grid
const GAME_LEN = 60;       // seconds
const GOAL = 15;           // crops to win

const State = Object.freeze({ MENU: "MENU", PLAYING: "PLAYING", PAUSED: "PAUSED", GAME_OVER: "GAME_OVER", WIN: "WIN" });

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const aabb = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

// ---- Base Entity ----
class Entity {
    constructor(x, y, w, h) { this.x = x; this.y = y; this.w = w; this.h = h; this.dead = false; }
    update(dt, game) { }
    draw(ctx) { }
}

// ---- Farmer (player) ----
class Farmer extends Entity {
    constructor(x, y) {
        super(x, y, 34, 34);
        this.speed = 260;
        this.vx = 0; this.vy = 0;
        this.color = "#8b5a2b";
    }
    handleInput(input) {
        const L = input.keys.has("ArrowLeft"), R = input.keys.has("ArrowRight");
        const U = input.keys.has("ArrowUp"), D = input.keys.has("ArrowDown");
        this.vx = (R - L) * this.speed;
        this.vy = (D - U) * this.speed;
    }
    update(dt, game) {
        // try movement
        const oldX = this.x, oldY = this.y;
        this.x = clamp(this.x + this.vx * dt, 0, WIDTH - this.w);
        this.y = clamp(this.y + this.vy * dt, 0, HEIGHT - this.h);
        // block through static obstacles only (scarecrows); crows don't block, just penalize
        const hitStatic = game.obstacles.some(o => !(o instanceof Crow) && aabb(this, o));
        if (hitStatic) { this.x = oldX; this.y = oldY; }
    }
    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.w, this.h);
        ctx.fillStyle = "#c28e0e";
        ctx.fillRect(this.x + 4, this.y - 6, this.w - 8, 8);        // hat brim
        ctx.fillRect(this.x + 10, this.y - 18, this.w - 20, 12);    // hat top
    }
}

// ---- Crop (collectible) ---- Updated for Q2(a): Different crop types with distinct point values
class Crop extends Entity {
    constructor(x, y, type = "wheat") {
        super(x, y, 20, 26);
        this.type = type;
        // Assign points based on type: wheat=1, pumpkin=3, golden_apple=5
        this.points = { wheat: 1, pumpkin: 3, golden_apple: 5 }[type] || 1;
        this.sway = Math.random() * Math.PI * 2;
    }
    update(dt, game) { this.sway += dt * 2; }
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

// ---- Scarecrow (obstacle) ----
class Scarecrow extends Entity {
    constructor(x, y) { super(x, y, 26, 46); }
    draw(ctx) {
        const { x, y, w, h } = this;
        ctx.fillStyle = "#9b7653";
        ctx.fillRect(x + w / 2 - 3, y, 6, h); // pole
        ctx.fillStyle = "#c28e0e";
        ctx.beginPath(); ctx.arc(x + w / 2, y + 10, 10, 0, Math.PI * 2); ctx.fill(); // head
        ctx.strokeStyle = "#6b4f2a"; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(x, y + 18); ctx.lineTo(x + w, y + 18); ctx.stroke(); // arms
    }
}

// ---- Crow (moving obstacle) ---- Q2.D Moving obstacles (crows)
class Crow extends Entity {
    constructor(x, y) {
        super(x, y, 20, 16);
        this.vx = (Math.random() - 0.5) * 2 * 150 + 100;  // Random horizontal speed: 100-200 px/s, direction varies
        this.color = "#000";
    }
    update(dt, game) {
        this.x += this.vx * dt;
        // Wrap around screen edges
        if (this.x < -this.w) this.x = WIDTH;
        if (this.x > WIDTH) this.x = -this.w;
    }
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

// ---- Input (uses .bind to control `this`) ----
// bind is for Q1.B
class Input {
    constructor(game) {
        this.game = game;
        this.keys = new Set();
        this._onKeyDown = this.onKeyDown.bind(this); // bind #1: necessary because onKeyDown is a regular method; event listener calls it with dynamic 'this' = window (event target). bind sets 'this' to Input instance. Arrow function alternative: define onKeyDown as arrow for lexical binding, but bind keeps it as reusable method
        this._onKeyUp = this.onKeyUp.bind(this);   // bind #2: same as #1; fixes dynamic 'this' rebinding in event callback to ensure 'this.keys' accesses Input's Set
        window.addEventListener("keydown", this._onKeyDown);
        window.addEventListener("keyup", this._onKeyUp);
    }
    onKeyDown(e) {
        if (e.key === "p" || e.key === "P") this.game.togglePause();
        this.keys.add(e.key);
    }
    onKeyUp(e) { this.keys.delete(e.key); }
    dispose() {
        window.removeEventListener("keydown", this._onKeyDown);
        window.removeEventListener("keyup", this._onKeyUp);
    }
}

// ---- Game ----
class Game {
    constructor(canvas) {
        if (!canvas) {
            console.error("Canvas #game not found. Check index.html IDs.");
            return;
        }
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.state = State.MENU;

        // world
        this.player = new Farmer(WIDTH / 2 - 17, HEIGHT - 80);
        this.crops = [];
        this.obstacles = [];
        // Crow spawn timing (for moving obstacles) Q2. D Moving obstacles (crows)
        this._accumCrow = 0;
        this.crowSpawnEvery = 5;  // Spawn crows every 5 seconds

        // timing Q2.B Difficulty curve with spawn rate increase
        this.lastTime = 0;
        this.timeLeft = GAME_LEN;
        this.spawnEvery = 0.8; // Initial spawn interval; decreases over time for difficulty curve
        this._accumSpawn = 0;

        // score & goal
        this.score = 0;
        this.goal = GOAL;

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
        if (this.ui.goal) this.ui.goal.textContent = String(this.goal);
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

    onResize() {
        // fixed canvas size for simplicity; handle DPR here if desired
    }

    start() {
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

    reset() {
        this.state = State.MENU;
        this.player = new Farmer(WIDTH / 2 - 17, HEIGHT - 80);
        this.crops.length = 0;
        this.obstacles.length = 0;
        // place a couple of scarecrows Q2. D Moving obstacles (crows)
        this.obstacles.push(new Scarecrow(200, 220), new Scarecrow(650, 160));
        this._accumCrow = 0;  // Reset crow accumulator
        this.score = 0;
        this.timeLeft = GAME_LEN;
        this._accumSpawn = 0;
        this.lastTime = performance.now();
        // place a couple of scarecrows
        this.obstacles.push(new Scarecrow(200, 220), new Scarecrow(650, 160));
        this.syncUI();
        if (this.ui.status) this.ui.status.textContent = "Menu";
    }

    togglePause() {
        if (this.state === State.PLAYING) {
            this.state = State.PAUSED;
            if (this.ui.status) this.ui.status.textContent = "Paused";
        } else if (this.state === State.PAUSED) {
            this.state = State.PLAYING;
            if (this.ui.status) this.ui.status.textContent = "Playing…";
        }
    }

    syncUI() {
        if (this.ui.score) this.ui.score.textContent = String(this.score);
        if (this.ui.time) this.ui.time.textContent = Math.ceil(this.timeLeft);
        if (this.ui.goal) this.ui.goal.textContent = String(this.goal);
    }
// Q2.A Different crop types with distinct point values
    spawnCrop() {
        const gx = Math.floor(Math.random() * ((WIDTH - 2 * TILE) / TILE)) * TILE + TILE;
        const gy = Math.floor(Math.random() * ((HEIGHT - 2 * TILE) / TILE)) * TILE + TILE;
        // Random type: 30% wheat (1pt), 50% pumpkin (3pt), 20% golden_apple (5pt)
        const rand = Math.random();
        const type = rand < 0.3 ? "wheat" : rand < 0.8 ? "pumpkin" : "golden_apple";
        this.crops.push(new Crop(gx, gy, type));
    }

    update(dt) {
        if (this.state !== State.PLAYING) return;

        // countdown
        this.timeLeft = clamp(this.timeLeft - dt, 0, GAME_LEN);
        if (this.timeLeft <= 0) {
            this.state = (this.score >= this.goal) ? State.WIN : State.GAME_OVER;
            if (this.ui.status) this.ui.status.textContent = (this.state === State.WIN) ? "You Win!" : "Game Over";
            this.syncUI();
            return;
        }

        // player
        this.player.handleInput(this.input);
        this.player.update(dt, this);

        // spawn crops Q2. B Difficulty curve with spawn rate increase
        // Spawn crows (moving obstacles)
        this._accumCrow += dt;
        while (this._accumCrow >= this.crowSpawnEvery) {
            this._accumCrow -= this.crowSpawnEvery;
            const cx = Math.random() * WIDTH;
            this.obstacles.push(new Crow(cx, 50));  // Spawn at top
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
                crow.x = Math.random() * WIDTH;
                crow.y = 50;
            });
        }
        // Difficulty curve: decrease spawn interval from 0.8s to 0.3s as time progresses (higher density)
        this.spawnEvery = 0.8 - (0.5 * (1 - this.timeLeft / GAME_LEN));  // Linear ramp: 0.8 at start, 0.3 at end
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
            if (this.score >= this.goal) {
                this.state = State.WIN;
                if (this.ui.status) this.ui.status.textContent = "You Win!";
            }
        }
        this.crops = this.crops.filter(c => !c.dead);    // arrow #3: lexical 'this' from Game; filter's callback captures update()'s scope, avoiding 'this' rebinding on array method call
        this.crops.forEach(c => c.update(dt, this));                         // arrow #4: lexical 'this' ensures the explicit 'this' passed to c.update is the Game instance; regular function would dynamically bind 'this' to the Crop or array

        // timer UI
        if (this.ui.time) this.ui.time.textContent = Math.ceil(this.timeLeft);
    }

    render() {
        const ctx = this.ctx;
        if (!ctx) return;

        ctx.clearRect(0, 0, WIDTH, HEIGHT);

        // field background (grid)
        ctx.fillStyle = "#dff0d5";
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
        ctx.strokeStyle = "#c7e0bd";
        ctx.lineWidth = 1;
        for (let y = TILE; y < HEIGHT; y += TILE) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(WIDTH, y); ctx.stroke();
        }
        for (let x = TILE; x < WIDTH; x += TILE) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, HEIGHT); ctx.stroke();
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
        } else if (this.state === State.PAUSED) {
            ctx.fillText("Paused (press P to resume)", 20, 28);
        } else if (this.state === State.GAME_OVER) {
            ctx.fillText("Time up! Press Reset to return to Menu", 20, 28);
        } else if (this.state === State.WIN) {
            ctx.fillText("Harvest complete! Press Reset for another round", 20, 28);
        }
    }

    dispose() {
        this.input.dispose();
        window.removeEventListener("resize", this._onResize);
    }
}

// ---- Boot ----
const canvas = document.getElementById("game");
const game = new Game(canvas);
// Click "Start" in the UI to begin.
