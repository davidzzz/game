# Arcade: 2048 + Tic Tac Toe + Snake + Pacman (React + TypeScript)

A React + TypeScript mini-arcade app with four selectable games.

## Included games
- **2048**
  - Classic 4x4 gameplay
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

## Component structure
- `src/App.tsx`: top-level game selector
- `src/games/Game2048.tsx`: all 2048 logic/UI
- `src/games/TicTacToeGame.tsx`: all Tic Tac Toe logic/UI
- `src/games/SnakeGame.tsx`: all Snake logic/UI
- `src/games/PacmanGame.tsx`: all Pacman logic/UI

## Scripts
- `npm run dev` - start development server.
- `npm run build` - type-check and build for production.
- `npm run preview` - preview production build locally.
