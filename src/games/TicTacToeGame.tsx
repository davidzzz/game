import { useEffect, useMemo, useState } from 'react';
import type { Mark, TicTacToeCell } from '../components/types';

type TicTacToeMode = 'player-vs-computer' | 'computer-vs-computer';

const winningLines = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6]
];

const getWinner = (board: TicTacToeCell[]) => {
  for (const [a, b, c] of winningLines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  if (board.every((cell) => cell !== null)) return 'draw';
  return null;
};

const getBestMove = (board: TicTacToeCell[], aiMark: Mark, currentMark: Mark): number => {
  const result = getWinner(board);
  if (result === aiMark) return 10;
  if (result && result !== 'draw' && result !== aiMark) return -10;
  if (result === 'draw') return 0;

  const availableIndices = board
    .map((cell, index) => ({ cell, index }))
    .filter(({ cell }) => cell === null)
    .map(({ index }) => index);

  const nextMark: Mark = currentMark === 'X' ? 'O' : 'X';

  if (currentMark === aiMark) {
    let bestScore = -Infinity;
    for (const index of availableIndices) {
      const nextBoard = [...board];
      nextBoard[index] = currentMark;
      bestScore = Math.max(bestScore, getBestMove(nextBoard, aiMark, nextMark) - 1);
    }
    return bestScore;
  }

  let bestScore = Infinity;
  for (const index of availableIndices) {
    const nextBoard = [...board];
    nextBoard[index] = currentMark;
    bestScore = Math.min(bestScore, getBestMove(nextBoard, aiMark, nextMark) + 1);
  }
  return bestScore;
};

const getOptimalMoveIndex = (board: TicTacToeCell[], mark: Mark) => {
  const availableIndices = board
    .map((cell, index) => ({ cell, index }))
    .filter(({ cell }) => cell === null)
    .map(({ index }) => index);

  let bestScore = -Infinity;
  let bestMove = availableIndices[0] ?? 0;

  for (const index of availableIndices) {
    const nextBoard = [...board];
    nextBoard[index] = mark;
    const score = getBestMove(nextBoard, mark, mark === 'X' ? 'O' : 'X');
    if (score > bestScore) {
      bestScore = score;
      bestMove = index;
    }
  }

  return bestMove;
};

const TicTacToeGame = () => {
  const [mode, setMode] = useState<TicTacToeMode>('player-vs-computer');
  const [board, setBoard] = useState<TicTacToeCell[]>(Array(9).fill(null));
  const [currentMark, setCurrentMark] = useState<Mark>('X');

  const result = useMemo(() => getWinner(board), [board]);

  const reset = () => {
    setBoard(Array(9).fill(null));
    setCurrentMark('X');
  };

  useEffect(() => {
    if (result) return;

    const isComputerTurn = mode === 'computer-vs-computer' || (mode === 'player-vs-computer' && currentMark === 'O');
    if (!isComputerTurn) return;

    const timer = window.setTimeout(() => {
      setBoard((previous: TicTacToeCell[]) => {
        if (getWinner(previous)) return previous;
        const nextBoard = [...previous];
        nextBoard[getOptimalMoveIndex(previous, currentMark)] = currentMark;
        return nextBoard;
      });
      setCurrentMark((previous: Mark) => (previous === 'X' ? 'O' : 'X'));
    }, mode === 'computer-vs-computer' ? 350 : 200);

    return () => window.clearTimeout(timer);
  }, [currentMark, mode, result]);

  const onCellClick = (index: number) => {
    if (mode !== 'player-vs-computer' || result || currentMark !== 'X' || board[index]) return;
    const nextBoard = [...board];
    nextBoard[index] = 'X';
    setBoard(nextBoard);
    setCurrentMark('O');
  };

  return (
    <>
      <div className="controls tic-controls">
        <div className="switcher" role="group" aria-label="Tic Tac Toe mode">
          <button
            type="button"
            className={mode === 'player-vs-computer' ? 'active' : ''}
            onClick={() => {
              setMode('player-vs-computer');
              reset();
            }}
          >
            Player vs Computer
          </button>
          <button
            type="button"
            className={mode === 'computer-vs-computer' ? 'active' : ''}
            onClick={() => {
              setMode('computer-vs-computer');
              reset();
            }}
          >
            Computer vs Computer
          </button>
        </div>
        <button type="button" onClick={reset}>Restart</button>
      </div>

      <div className="status" role="status">
        {result === null &&
          (mode === 'player-vs-computer'
            ? currentMark === 'X'
              ? 'Your turn (X).'
              : 'Computer is thinking (O)...'
            : `Computer ${currentMark} is thinking...`)}
        {result === 'draw' && 'Draw! Perfect play leads to a tie.'}
        {result === 'X' && (mode === 'player-vs-computer' ? 'You win as X!' : 'Computer X wins.')}
        {result === 'O' && (mode === 'player-vs-computer' ? 'Computer wins as O.' : 'Computer O wins.')}
      </div>

      <div className="tic-board" aria-label="Tic Tac Toe board">
        {board.map((cell: TicTacToeCell, index: number) => (
          <button
            type="button"
            key={index}
            className="tic-cell"
            onClick={() => onCellClick(index)}
            disabled={mode !== 'player-vs-computer' || currentMark !== 'X' || !!cell || !!result}
          >
            {cell ?? ''}
          </button>
        ))}
      </div>
    </>
  );
};

export default TicTacToeGame;
