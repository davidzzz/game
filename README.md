# Arcade Mini-Game Collection (React + TypeScript)

A React + TypeScript mini-arcade app with multiple selectable games and different gameplay styles.

## Included games
- **2048**
  - Classic 4x4 merge gameplay
  - Keyboard + on-screen controls
  - Score + persistent best score
  - Endless mode unlock after hitting 2048
- **Tic Tac Toe**
  - **Player vs Computer** mode (computer plays optimally)
  - **Computer vs Computer** mode (both sides play optimal moves automatically)
- **Snake**
  - Keyboard-controlled snake gameplay
  - Growing snake and increasing speed as score rises
- **Pacman**
  - Maze navigation and pellet collection
  - Chase ghost and win/lose conditions
- **Bomberman**
  - Grid movement with bombs and blast zones
  - Obstacles, enemies, and level survival mechanics
- **Number Bubble Hunt**
  - A target number is shown each level
  - Click bubble expressions that evaluate to the target
  - Multiple levels with increasing difficulty (more bubbles, tighter timers, mixed operations)
  - Lives, scoring, and level progression
- **Chess**
  - Player (White) vs Computer (Black)
  - Legal move validation, check/checkmate/stalemate detection
  - Four AI difficulty levels: Beginner, Intermediate, Advanced, Professional

## Number Bubble Hunt objective
1. Watch the **Target Number** at the top of the game.
2. Click only bubbles whose math expression equals that target.
3. Clear all required matching bubbles before time runs out.
4. Avoid wrong clicks to preserve lives.
5. Advance through progressively harder levels.

## Component structure
- `src/App.tsx`: top-level game selector
- `src/games/Game2048.tsx`: all 2048 logic/UI
- `src/games/TicTacToeGame.tsx`: all Tic Tac Toe logic/UI
- `src/games/SnakeGame.tsx`: all Snake logic/UI
- `src/games/PacmanGame.tsx`: all Pacman logic/UI
- `src/games/BombermanGame.tsx`: all Bomberman logic/UI
- `src/games/NumberBubbleGame.tsx`: all Number Bubble Hunt logic/UI
- `src/games/ChessGame.tsx`: all Chess logic/UI

## Scripts
- `npm run dev` - start development server.
- `npm run build` - type-check and build for production.
- `npm run preview` - preview production build locally.
