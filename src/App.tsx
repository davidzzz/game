import { useState } from 'react';
import Game2048 from './games/Game2048';
import PacmanGame from './games/PacmanGame';
import SnakeGame from './games/SnakeGame';
import TicTacToeGame from './games/TicTacToeGame';
import BombermanGame from './games/BombermanGame';
import NumberBubbleGame from './games/NumberBubbleGame';
import ChessGame from './games/ChessGame';

type GameType = '2048' | 'tic-tac-toe' | 'snake' | 'pacman' | 'bomberman' | 'number-bubbles' | 'chess';

const App = () => {
  const [selectedGame, setSelectedGame] = useState<GameType>('2048');

  return (
    <main className="app">
      <section className="container">
        <header className="header game-switcher-header">
          <div>
            <h1>Arcade</h1>
            <p>Choose a game to play.</p>
          </div>
          <div className="switcher" role="group" aria-label="Select game">
            <button type="button" className={selectedGame === '2048' ? 'active' : ''} onClick={() => setSelectedGame('2048')}>
              2048
            </button>
            <button type="button" className={selectedGame === 'tic-tac-toe' ? 'active' : ''} onClick={() => setSelectedGame('tic-tac-toe')}>
              Tic Tac Toe
            </button>
            <button type="button" className={selectedGame === 'snake' ? 'active' : ''} onClick={() => setSelectedGame('snake')}>
              Snake
            </button>
            <button type="button" className={selectedGame === 'pacman' ? 'active' : ''} onClick={() => setSelectedGame('pacman')}>
              Pacman
            </button>
            <button type="button" className={selectedGame === 'bomberman' ? 'active' : ''} onClick={() => setSelectedGame('bomberman')}>
              Bomberman
            </button>
            <button type="button" className={selectedGame === 'number-bubbles' ? 'active' : ''} onClick={() => setSelectedGame('number-bubbles')}>
              Number Bubbles
            </button>
            <button type="button" className={selectedGame === 'chess' ? 'active' : ''} onClick={() => setSelectedGame('chess')}>
              Chess
            </button>
          </div>
        </header>

        {selectedGame === '2048' && <Game2048 />}
        {selectedGame === 'tic-tac-toe' && <TicTacToeGame />}
        {selectedGame === 'snake' && <SnakeGame />}
        {selectedGame === 'pacman' && <PacmanGame />}
        {selectedGame === 'bomberman' && <BombermanGame />}
        {selectedGame === 'number-bubbles' && <NumberBubbleGame />}
        {selectedGame === 'chess' && <ChessGame />}
      </section>
    </main>
  );
};

export default App;
