import { useState } from 'react';
import Game2048 from './games/Game2048';
import TicTacToeGame from './games/TicTacToeGame';

type GameType = '2048' | 'tic-tac-toe';

const App = () => {
  const [selectedGame, setSelectedGame] = useState<GameType>('2048');

  return (
    <main className="app">
      <section className="container">
        <header className="header game-switcher-header">
          <div>
            <h1>Arcade</h1>
            <p>Choose between 2048 and Tic Tac Toe.</p>
          </div>
          <div className="switcher" role="group" aria-label="Select game">
            <button
              type="button"
              className={selectedGame === '2048' ? 'active' : ''}
              onClick={() => setSelectedGame('2048')}
            >
              2048
            </button>
            <button
              type="button"
              className={selectedGame === 'tic-tac-toe' ? 'active' : ''}
              onClick={() => setSelectedGame('tic-tac-toe')}
            >
              Tic Tac Toe
            </button>
          </div>
        </header>

        {selectedGame === '2048' ? <Game2048 /> : <TicTacToeGame />}
      </section>
    </main>
  );
};

export default App;
