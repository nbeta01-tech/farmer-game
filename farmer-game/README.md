# Farmer Harvest Game - Summary

## Overview
Farmer Harvest is a browser-based JavaScript game where you control a farmer to collect crops while avoiding scarecrows and crows.  
The project highlights JavaScript concepts like **arrow functions**, **bind**, and the use of **`this`** in different contexts.

## How to Run
1. Install **Python**.
2. Start a local server with:  
   ```bash
   py -m http.server 8000
   ```
3. Open [http://localhost:8000/farmer-game/index.html](http://localhost:8000/farmer-game/index.html) in a browser.
4. Click **Start** to begin playing.

## Gameplay
- Use **arrow keys** to move the farmer.  
- Collect crops to earn **points**.  
- Avoid **scarecrows** (static) and **crows** (moving).  
- Press **P** to pause/resume, **Reset** to restart.  
- Reach the goal before **time runs out** to advance levels.  

## New Features
1. Different crop types with unique point values.  
2. Increasing difficulty with faster spawns.  
3. Crows move and deduct points on collision.  
4. Multi-level progression with new goals.  
5. Farmer sprite animation.  
6. Improved UI with score, time, and goals.  

## JavaScript Features
- **Arrow functions**: Used for RAF loop and callbacks to keep lexical `this`.  
- **bind(this)**: Used in Input handlers to fix `this`.  
- **this keyword**: Works differently in RAF, event listeners, and methods.  

## Project Files
- `index.html`  
- `style.css`  
- `index.js`  
- `Game.js`  
- `Farmer.js`  
- `Crop.js`  
- `Obstacle.js`  
- `BaseEntity.js`  
- `Utils.js`  
- `config.json`  
- `sprites/`
