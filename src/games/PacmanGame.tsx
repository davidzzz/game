import { useEffect, useMemo, useState } from 'react';

type Point = { x: number; y: number };
type Direction = 'up' | 'down' | 'left' | 'right';

const MAZE_TEMPLATE = [
  '###############',
  '#.............#',
  '#.###.###.###.#',
  '#.............#',
  '#.###.#.#.###.#',
  '#.....#.#.....#',
  '###.#.#.#.#.###',
  '#...#.....#...#',
  '#.###.###.###.#',
  '#.............#',
  '###############'
];

const width = MAZE_TEMPLATE[0].length;
const height = MAZE_TEMPLATE.length;

const parsePellets = () => {
  const pellets = new Set<string>();
  MAZE_TEMPLATE.forEach((row, y) => {
    row.split('').forEach((cell, x) => {
      if (cell === '.') pellets.add(`${x},${y}`);
    });
  });
  return pellets;
};

const isWall = (x: number, y: number) => {
  if (x < 0 || y < 0 || x >= width || y >= height) return true;
  return MAZE_TEMPLATE[y][x] === '#';
};

const movePoint = (point: Point, direction: Direction): Point => {
  if (direction === 'up') return { x: point.x, y: point.y - 1 };
  if (direction === 'down') return { x: point.x, y: point.y + 1 };
  if (direction === 'left') return { x: point.x - 1, y: point.y };
  return { x: point.x + 1, y: point.y };
};

const allDirections: Direction[] = ['up', 'down', 'left', 'right'];

const PacmanGame = () => {
  const [pacman, setPacman] = useState<Point>({ x: 1, y: 1 });
  const [ghost, setGhost] = useState<Point>({ x: 13, y: 9 });
  const [direction, setDirection] = useState<Direction>('right');
  const [queuedDirection, setQueuedDirection] = useState<Direction>('right');
  const [pellets, setPellets] = useState<Set<string>>(() => parsePellets());
  const [score, setScore] = useState(0);
  const [running, setRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);

  const pelletCount = useMemo(() => parsePellets().size, []);

  const reset = () => {
    setPacman({ x: 1, y: 1 });
    setGhost({ x: 13, y: 9 });
    setDirection('right');
    setQueuedDirection('right');
    setPellets(parsePellets());
    setScore(0);
    setRunning(false);
    setGameOver(false);
    setWon(false);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const keyMap: Record<string, Direction> = {
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowLeft: 'left',
        ArrowRight: 'right'
      };

      const next = keyMap[event.key];
      if (!next) return;
      event.preventDefault();
      setQueuedDirection(next);
      setRunning(true);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (!running || gameOver || won) return;

    const interval = window.setInterval(() => {
      setPacman((previousPacman) => {
        const tryQueued = movePoint(previousPacman, queuedDirection);
        const canUseQueued = !isWall(tryQueued.x, tryQueued.y);

        const nextDirection = canUseQueued ? queuedDirection : direction;
        const candidate = movePoint(previousPacman, nextDirection);

        if (isWall(candidate.x, candidate.y)) return previousPacman;
        if (canUseQueued) setDirection(queuedDirection);

        setPellets((previousPellets) => {
          const key = `${candidate.x},${candidate.y}`;
          if (!previousPellets.has(key)) return previousPellets;

          const nextPellets = new Set(previousPellets);
          nextPellets.delete(key);
          setScore((value) => value + 10);
          if (nextPellets.size === 0) {
            setWon(true);
            setRunning(false);
          }
          return nextPellets;
        });

        return candidate;
      });

      setGhost((previousGhost) => {
        const possible = allDirections
          .map((nextDirection) => movePoint(previousGhost, nextDirection))
          .filter((point) => !isWall(point.x, point.y));

        if (possible.length === 0) return previousGhost;

        const chaseMove = possible.sort((a, b) => {
          const aDistance = Math.abs(a.x - pacman.x) + Math.abs(a.y - pacman.y);
          const bDistance = Math.abs(b.x - pacman.x) + Math.abs(b.y - pacman.y);
          return aDistance - bDistance;
        })[0];

        return chaseMove;
      });
    }, 180);

    return () => window.clearInterval(interval);
  }, [direction, gameOver, pacman.x, pacman.y, queuedDirection, running, won]);

  useEffect(() => {
    if ((pacman.x === ghost.x && pacman.y === ghost.y) && !won) {
      setGameOver(true);
      setRunning(false);
    }
  }, [ghost.x, ghost.y, pacman.x, pacman.y, won]);

  const cells = MAZE_TEMPLATE.flatMap((row, y) =>
    row.split('').map((cell, x) => {
      const key = `${x},${y}`;
      const hasPellet = pellets.has(key);
      const isPacman = pacman.x === x && pacman.y === y;
      const isGhost = ghost.x === x && ghost.y === y;

      let className = 'pac-cell';
      if (cell === '#') className += ' pac-wall';
      if (hasPellet) className += ' pac-pellet';
      if (isPacman) className += ' pac-pacman';
      if (isGhost) className += ' pac-ghost';

      return <div key={key} className={className} />;
    })
  );

  return (
    <section>
      <div className="controls">
        <strong>Score: {score} / {pelletCount * 10}</strong>
        <button type="button" onClick={reset}>Restart</button>
      </div>
      <div className="status" role="status">
        {!running && !gameOver && !won && 'Press arrow keys to move Pacman.'}
        {running && 'Collect all pellets and avoid the ghost.'}
        {gameOver && 'Caught by the ghost! Restart to play again.'}
        {won && 'You cleared the maze!'}
      </div>
      <div
        className="pac-board"
        style={{ gridTemplateColumns: `repeat(${width}, 1fr)` }}
        aria-label="Pacman board"
      >
        {cells}
      </div>
    </section>
  );
};

export default PacmanGame;
