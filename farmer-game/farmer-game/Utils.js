// Utils.js

// ---- Config & helpers ----
export const WIDTH = 900, HEIGHT = 540;
export const TILE = 30;           // for a subtle grid
export const GAME_LEN = 60;       // seconds per level

export const State = Object.freeze({ MENU: "MENU", PLAYING: "PLAYING", PAUSED: "PAUSED", GAME_OVER: "GAME_OVER", WIN: "WIN" });

export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
export const aabb = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

// G1 Level System: Define level goals (points to complete each level) and difficulties (base spawn interval, crow spawn interval, num scarecrows)
export const LEVEL_GOALS = [15, 25, 35];  // Level 1: 15pts, Level 2: 25pts, Level 3: 35pts
export const LEVEL_DIFFICULTIES = [
    { baseSpawnEvery: 0.8, crowEvery: 5, scarecrows: 2 },    // Level 1: easy
    { baseSpawnEvery: 0.6, crowEvery: 3, scarecrows: 3 },    // Level 2: medium
    { baseSpawnEvery: 0.4, crowEvery: 2, scarecrows: 4 }     // Level 3: hard
];

// Helper to get random position avoiding edges
export const randomPos = (minX = TILE, maxX = WIDTH - TILE, minY = TILE, maxY = HEIGHT - TILE) => ({
    x: Math.random() * (maxX - minX) + minX,
    y: Math.random() * (maxY - minY) + minY
});