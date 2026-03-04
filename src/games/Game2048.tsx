import { useEffect, useMemo, useState } from 'react';
import type { Direction } from '../components/types';

type MoveResult = {
  board: number[][];
  moved: boolean;
  scoreGained: number;
};

const BOARD_SIZE = 4;
const TARGET_TILE = 2048;
const BEST_SCORE_KEY = 'game-2048-best-score';

const createEmptyBoard = () =>
  Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(0));

const randomTileValue = () => (Math.random() < 0.9 ? 2 : 4);

const addRandomTile = (board: number[][]) => {
  const emptyCells: Array<[number, number]> = [];
  board.forEach((row, rowIndex) => {
    row.forEach((value, colIndex) => {
      if (value === 0) emptyCells.push([rowIndex, colIndex]);
    });
  });
  if (emptyCells.length === 0) return board;

  const [row, col] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  const nextBoard = board.map((line) => [...line]);
  nextBoard[row][col] = randomTileValue();
  return nextBoard;
};

const initializeBoard = () => addRandomTile(addRandomTile(createEmptyBoard()));

const mergeLine = (line: number[]) => {
  const compact = line.filter((value) => value !== 0);
  const result: number[] = [];
  let score = 0;

  for (let i = 0; i < compact.length; i += 1) {
    if (compact[i] === compact[i + 1]) {
      const merged = compact[i] * 2;
      result.push(merged);
      score += merged;
      i += 1;
    } else {
      result.push(compact[i]);
    }
  }

  while (result.length < BOARD_SIZE) result.push(0);
  return { merged: result, score };
};

const moveLeft = (board: number[][]): MoveResult => {
  let moved = false;
  let scoreGained = 0;

  const nextBoard = board.map((row) => {
    const { merged, score } = mergeLine(row);
    if (!moved && merged.some((value, index) => value !== row[index])) moved = true;
    scoreGained += score;
    return merged;
  });

  return { board: nextBoard, moved, scoreGained };
};

const rotateClockwise = (board: number[][]) =>
  board[0].map((_, colIndex) => board.map((row) => row[colIndex]).reverse());

const rotateCounterClockwise = (board: number[][]) =>
  board[0].map((_, colIndex) => board.map((row) => row[BOARD_SIZE - 1 - colIndex]));

const reverseRows = (board: number[][]) => board.map((row) => [...row].reverse());

const moveBoard = (board: number[][], direction: Direction): MoveResult => {
  if (direction === 'left') return moveLeft(board);

  if (direction === 'right') {
    const moved = moveLeft(reverseRows(board));
    return { board: reverseRows(moved.board), moved: moved.moved, scoreGained: moved.scoreGained };
  }

  if (direction === 'up') {
    const moved = moveLeft(rotateCounterClockwise(board));
    return {
      board: rotateClockwise(moved.board),
      moved: moved.moved,
      scoreGained: moved.scoreGained
    };
  }

  const moved = moveLeft(rotateClockwise(board));
  return {
    board: rotateCounterClockwise(moved.board),
    moved: moved.moved,
    scoreGained: moved.scoreGained
  };
};

const hasWon = (board: number[][]) => board.some((row) => row.some((value) => value >= TARGET_TILE));

const canMove = (board: number[][]) => {
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      const value = board[row][col];
      if (value === 0) return true;
      if (col < BOARD_SIZE - 1 && value === board[row][col + 1]) return true;
      if (row < BOARD_SIZE - 1 && value === board[row + 1][col]) return true;
    }
  }
  return false;
};

const getTileClass = (value: number) => (value === 0 ? 'tile tile-empty' : `tile tile-${Math.min(value, 4096)}`);

const Game2048 = () => {
  const [board, setBoard] = useState<number[][]>(() => initializeBoard());
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => {
    const stored = localStorage.getItem(BEST_SCORE_KEY);
    return stored ? Number(stored) : 0;
  });
  const [hasReachedGoal, setHasReachedGoal] = useState(false);
  const [endlessMode, setEndlessMode] = useState(false);

  const gameOver = useMemo(() => !canMove(board), [board]);
  const gameWon = useMemo(() => hasWon(board), [board]);

  useEffect(() => {
    localStorage.setItem(BEST_SCORE_KEY, String(bestScore));
  }, [bestScore]);

  useEffect(() => {
    if (gameWon && !hasReachedGoal) setHasReachedGoal(true);
  }, [gameWon, hasReachedGoal]);

  const performMove = (direction: Direction) => {
    if (gameOver || (hasReachedGoal && !endlessMode)) return;
    const result = moveBoard(board, direction);
    if (!result.moved) return;

    const nextScore = score + result.scoreGained;
    setBoard(addRandomTile(result.board));
    setScore(nextScore);
    if (nextScore > bestScore) setBestScore(nextScore);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const keys: Record<string, Direction> = {
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowLeft: 'left',
        ArrowRight: 'right'
      };
      const direction = keys[event.key];
      if (!direction) return;
      event.preventDefault();
      performMove(direction);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const reset = () => {
    setBoard(initializeBoard());
    setScore(0);
    setHasReachedGoal(false);
    setEndlessMode(false);
  };

  return (
    <>
      <div className="scores">
        <div className="score-card"><span>Score</span><strong>{score}</strong></div>
        <div className="score-card"><span>Best</span><strong>{bestScore}</strong></div>
      </div>

      <div className="controls">
        <button type="button" onClick={reset}>New Game</button>
        <label>
          <input
            type="checkbox"
            checked={endlessMode}
            onChange={(event) => setEndlessMode(event.target.checked)}
            disabled={!hasReachedGoal}
          />
          Endless mode
        </label>
      </div>

      <div className="status" role="status">
        {gameOver && 'Game over! Start a new game to try again.'}
        {!gameOver && hasReachedGoal && !endlessMode && 'You reached 2048! Enable endless mode to keep going.'}
        {!gameOver && hasReachedGoal && endlessMode && 'Endless mode enabled. Keep climbing!'}
      </div>

      <div className="board" aria-label="2048 board">
        {board.flat().map((value, index) => (
          <div className={getTileClass(value)} key={index}>{value !== 0 ? value : ''}</div>
        ))}
      </div>

      <div className="touch-controls">
        <button onClick={() => performMove('up')} type="button">↑</button>
        <div>
          <button onClick={() => performMove('left')} type="button">←</button>
          <button onClick={() => performMove('down')} type="button">↓</button>
          <button onClick={() => performMove('right')} type="button">→</button>
        </div>
      </div>
    </>
  );
};

export default Game2048;
