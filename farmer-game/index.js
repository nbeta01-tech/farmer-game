// index.js
import { Game } from './Game.js';

// ---- Boot ----
const canvas = document.getElementById("game");
const game = new Game(canvas);
// Click "Start" in the UI to begin.

// Debug handle
window.game = game;
