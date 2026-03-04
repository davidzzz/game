import { useEffect, useMemo, useState } from 'react';

type Point = { x: number; y: number };
type Direction = 'up' | 'down' | 'left' | 'right';

const GRID_SIZE = 16;
const INITIAL_SNAKE: Point[] = [
  { x: 8, y: 8 },
  { x: 7, y: 8 },
  { x: 6, y: 8 }
];

const randomFood = (snake: Point[]): Point => {
  while (true) {
    const point = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE)
    };

    if (!snake.some((segment) => segment.x === point.x && segment.y === point.y)) {
      return point;
    }
  }
};

const SnakeGame = () => {
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [direction, setDirection] = useState<Direction>('right');
  const [food, setFood] = useState<Point>(() => randomFood(INITIAL_SNAKE));
  const [running, setRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);

  const speedMs = useMemo(() => Math.max(90, 170 - score * 4), [score]);

  const reset = () => {
    setSnake(INITIAL_SNAKE);
    setDirection('right');
    setFood(randomFood(INITIAL_SNAKE));
    setRunning(false);
    setGameOver(false);
    setScore(0);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const keyMap: Record<string, Direction> = {
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowLeft: 'left',
        ArrowRight: 'right'
      };

      const nextDirection = keyMap[event.key];
      if (!nextDirection) return;
      event.preventDefault();
      setRunning(true);

      const opposite =
        (direction === 'up' && nextDirection === 'down') ||
        (direction === 'down' && nextDirection === 'up') ||
        (direction === 'left' && nextDirection === 'right') ||
        (direction === 'right' && nextDirection === 'left');

      if (!opposite) setDirection(nextDirection);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [direction]);

  useEffect(() => {
    if (!running || gameOver) return;

    const interval = window.setInterval(() => {
      setSnake((previous: Point[]) => {
        const head = previous[0];
        const nextHead = { ...head };

        if (direction === 'up') nextHead.y -= 1;
        if (direction === 'down') nextHead.y += 1;
        if (direction === 'left') nextHead.x -= 1;
        if (direction === 'right') nextHead.x += 1;

        const outOfBounds =
          nextHead.x < 0 ||
          nextHead.x >= GRID_SIZE ||
          nextHead.y < 0 ||
          nextHead.y >= GRID_SIZE;

        const hitSelf = previous.some((segment: Point) => segment.x === nextHead.x && segment.y === nextHead.y);
        if (outOfBounds || hitSelf) {
          setGameOver(true);
          setRunning(false);
          return previous;
        }

        const ateFood = nextHead.x === food.x && nextHead.y === food.y;
        const nextSnake = [nextHead, ...previous];

        if (ateFood) {
          setScore((value: number) => value + 10);
          setFood(randomFood(nextSnake));
          return nextSnake;
        }

        nextSnake.pop();
        return nextSnake;
      });
    }, speedMs);

    return () => window.clearInterval(interval);
  }, [direction, food.x, food.y, gameOver, running, speedMs]);

  const cells = Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, index) => {
    const x = index % GRID_SIZE;
    const y = Math.floor(index / GRID_SIZE);
    const isHead = snake[0].x === x && snake[0].y === y;
    const isSnake = snake.some((segment: Point) => segment.x === x && segment.y === y);
    const isFood = food.x === x && food.y === y;

    let className = 'snake-cell';
    if (isFood) className += ' snake-food';
    if (isSnake) className += ' snake-body';
    if (isHead) className += ' snake-head';
    return <div key={index} className={className} />;
  });

  return (
    <section>
      <div className="controls">
        <strong>Score: {score}</strong>
        <button type="button" onClick={reset}>Restart</button>
      </div>
      <div className="status" role="status">
        {!running && !gameOver && 'Press arrow keys to start.'}
        {running && 'Use arrow keys to keep moving.'}
        {gameOver && 'Game over! Press restart to try again.'}
      </div>
      <div className="snake-board" aria-label="Snake board">
        {cells}
      </div>
    </section>
  );
};

export default SnakeGame;
