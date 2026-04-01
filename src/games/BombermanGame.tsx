import { useEffect, useMemo, useState } from 'react';

type Point = { x: number; y: number };
type Direction = 'up' | 'down' | 'left' | 'right';
type Difficulty = 'easy' | 'normal' | 'hard' | 'extreme';
type CellType = 'empty' | 'wall' | 'block' | 'door-hidden' | 'door-revealed' | 'powerup';

type Enemy = {
  id: number;
  x: number;
  y: number;
  moveEvery: number;
  cooldown: number;
};

type Bomb = {
  id: number;
  x: number;
  y: number;
  timer: number;
};

const WIDTH = 13;
const HEIGHT = 11;
const BOMB_TIMER = 7;
const directions: Array<{ dir: Direction; dx: number; dy: number }> = [
  { dir: 'up', dx: 0, dy: -1 },
  { dir: 'down', dx: 0, dy: 1 },
  { dir: 'left', dx: -1, dy: 0 },
  { dir: 'right', dx: 1, dy: 0 }
];

const difficultyConfig: Record<Difficulty, { label: string; enemies: number; speedPool: number[] }> = {
  easy: { label: 'Easy', enemies: 2, speedPool: [3, 4] },
  normal: { label: 'Normal', enemies: 4, speedPool: [2, 3, 4] },
  hard: { label: 'Hard', enemies: 6, speedPool: [1, 2, 3] },
  extreme: { label: 'Extreme', enemies: 8, speedPool: [1, 1, 2] }
};

const keyOf = (x: number, y: number) => `${x},${y}`;

const isInside = (x: number, y: number) => x >= 0 && y >= 0 && x < WIDTH && y < HEIGHT;

const createMap = () => {
  const board: CellType[][] = Array.from({ length: HEIGHT }, (_, y) =>
    Array.from({ length: WIDTH }, (_, x) => {
      const border = x === 0 || y === 0 || x === WIDTH - 1 || y === HEIGHT - 1;
      const pillar = x % 2 === 0 && y % 2 === 0;
      if (border || pillar) return 'wall';
      return Math.random() < 0.5 ? 'block' : 'empty';
    })
  );

  board[1][1] = 'empty';
  board[1][2] = 'empty';
  board[2][1] = 'empty';

  const blockPoints: Point[] = [];
  for (let y = 1; y < HEIGHT - 1; y += 1) {
    for (let x = 1; x < WIDTH - 1; x += 1) {
      if (board[y][x] === 'block') blockPoints.push({ x, y });
    }
  }

  if (blockPoints.length === 0) {
    board[3][3] = 'block';
    blockPoints.push({ x: 3, y: 3 });
  }

  const doorPoint = blockPoints[Math.floor(Math.random() * blockPoints.length)];
  board[doorPoint.y][doorPoint.x] = 'door-hidden';

  const powerupCount = Math.max(2, Math.floor(blockPoints.length * 0.12));
  for (let i = 0; i < powerupCount; i += 1) {
    const point = blockPoints[Math.floor(Math.random() * blockPoints.length)];
    if ((point.x === doorPoint.x && point.y === doorPoint.y) || board[point.y][point.x] === 'powerup') continue;
    board[point.y][point.x] = 'powerup';
  }

  return board;
};

const BombermanGame = () => {
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [board, setBoard] = useState<CellType[][]>(() => createMap());
  const [player, setPlayer] = useState<Point>({ x: 1, y: 1 });
  const [bombs, setBombs] = useState<Bomb[]>([]);
  const [maxBombs, setMaxBombs] = useState(1);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [status, setStatus] = useState('Find the hidden door under a breakable block.');
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [blastCells, setBlastCells] = useState<Set<string>>(new Set());

  const config = useMemo(() => difficultyConfig[difficulty], [difficulty]);

  const resetGame = (nextDifficulty = difficulty) => {
    const nextBoard = createMap();
    const nextConfig = difficultyConfig[nextDifficulty];

    const nextEnemies: Enemy[] = [];
    let attempts = 0;
    while (nextEnemies.length < nextConfig.enemies && attempts < 500) {
      attempts += 1;
      const x = 1 + Math.floor(Math.random() * (WIDTH - 2));
      const y = 1 + Math.floor(Math.random() * (HEIGHT - 2));
      const blocked = nextBoard[y][x] === 'wall' || nextBoard[y][x] === 'block' || nextBoard[y][x] === 'door-hidden';
      const occupied = nextEnemies.some((enemy) => enemy.x === x && enemy.y === y);
      const nearSpawn = Math.abs(x - 1) + Math.abs(y - 1) < 4;
      if (blocked || occupied || nearSpawn) continue;

      const moveEvery = nextConfig.speedPool[Math.floor(Math.random() * nextConfig.speedPool.length)];
      nextEnemies.push({ id: nextEnemies.length + 1, x, y, moveEvery, cooldown: moveEvery });
    }

    setBoard(nextBoard);
    setPlayer({ x: 1, y: 1 });
    setBombs([]);
    setMaxBombs(1);
    setEnemies(nextEnemies);
    setStatus('Find the hidden door under a breakable block.');
    setGameOver(false);
    setWon(false);
    setBlastCells(new Set());
  };

  useEffect(() => {
    resetGame(difficulty);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (gameOver || won) return;

      const moveMap: Record<string, Point> = {
        ArrowUp: { x: 0, y: -1 },
        ArrowDown: { x: 0, y: 1 },
        ArrowLeft: { x: -1, y: 0 },
        ArrowRight: { x: 1, y: 0 }
      };

      if (event.code === 'Space') {
        event.preventDefault();
        setBombs((previous) => {
          const alreadyHere = previous.some((bomb) => bomb.x === player.x && bomb.y === player.y);
          if (alreadyHere || previous.length >= maxBombs) return previous;
          return [...previous, { id: Date.now() + Math.random(), x: player.x, y: player.y, timer: BOMB_TIMER }];
        });
        return;
      }

      const delta = moveMap[event.key];
      if (!delta) return;
      event.preventDefault();

      const nextX = player.x + delta.x;
      const nextY = player.y + delta.y;
      if (!isInside(nextX, nextY)) return;

      const cell = board[nextY][nextX];
      const blockedByTile = cell === 'wall' || cell === 'block' || cell === 'door-hidden';
      const blockedByBomb = bombs.some((bomb) => bomb.x === nextX && bomb.y === nextY);
      if (blockedByTile || blockedByBomb) return;

      setPlayer({ x: nextX, y: nextY });

      if (cell === 'powerup') {
        setBoard((previous) => {
          const copy = previous.map((row) => [...row]);
          copy[nextY][nextX] = 'empty';
          return copy;
        });
        setMaxBombs((value) => value + 1);
        setStatus('Power-up collected! You can place more bombs now.');
      }

      if (cell === 'door-revealed') {
        setWon(true);
        setStatus('You found the door and escaped. You win!');
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [board, bombs, gameOver, maxBombs, player.x, player.y, won]);

  useEffect(() => {
    if (gameOver || won) return;

    const interval = window.setInterval(() => {
      setBlastCells(new Set());

      setBombs((previousBombs) => {
        const queue = previousBombs.map((bomb) => ({ ...bomb, timer: bomb.timer - 1 }));
        const blast = new Set<string>();

        setBoard((previousBoard) => {
          const nextBoard = previousBoard.map((row) => [...row]);

          const processExplosion = (bomb: Bomb) => {
            const cross = [{ x: bomb.x, y: bomb.y }, ...directions.map(({ dx, dy }) => ({ x: bomb.x + dx, y: bomb.y + dy }))];
            cross.forEach((point) => {
              if (!isInside(point.x, point.y)) return;
              const cell = nextBoard[point.y][point.x];
              if (cell === 'wall') return;

              blast.add(keyOf(point.x, point.y));
              if (cell === 'block') nextBoard[point.y][point.x] = 'empty';
              if (cell === 'door-hidden') nextBoard[point.y][point.x] = 'door-revealed';
              if (cell === 'powerup') nextBoard[point.y][point.x] = 'empty';

              queue.forEach((candidate) => {
                if (candidate.timer > 0 && candidate.x === point.x && candidate.y === point.y) {
                  candidate.timer = 0;
                }
              });
            });
          };

          let exploding = queue.filter((bomb) => bomb.timer <= 0);
          const visited = new Set<number>();
          while (exploding.length > 0) {
            exploding.forEach((bomb) => {
              if (visited.has(bomb.id)) return;
              visited.add(bomb.id);
              processExplosion(bomb);
            });
            exploding = queue.filter((bomb) => bomb.timer <= 0 && !visited.has(bomb.id));
          }

          if (blast.size > 0) {
            setBlastCells(blast);

            setEnemies((previousEnemies) =>
              previousEnemies.filter((enemy) => !blast.has(keyOf(enemy.x, enemy.y)))
            );

            if (blast.has(keyOf(player.x, player.y))) {
              setGameOver(true);
              setStatus('You were caught in an explosion.');
            }
          }

          return nextBoard;
        });

        return queue.filter((bomb) => bomb.timer > 0);
      });

      setEnemies((previousEnemies) =>
        previousEnemies.map((enemy) => {
          if (enemy.cooldown > 1) {
            return { ...enemy, cooldown: enemy.cooldown - 1 };
          }

          const options = directions
            .map(({ dx, dy }) => ({ x: enemy.x + dx, y: enemy.y + dy }))
            .filter((point) => {
              if (!isInside(point.x, point.y)) return false;
              const cell = board[point.y][point.x];
              const blocked = cell === 'wall' || cell === 'block' || cell === 'door-hidden';
              const hasBomb = bombs.some((bomb) => bomb.x === point.x && bomb.y === point.y);
              return !blocked && !hasBomb;
            });

          if (options.length === 0) return { ...enemy, cooldown: enemy.moveEvery };

          const target = options[Math.floor(Math.random() * options.length)];
          return {
            ...enemy,
            x: target.x,
            y: target.y,
            cooldown: enemy.moveEvery
          };
        })
      );
    }, 180);

    return () => window.clearInterval(interval);
  }, [board, bombs, gameOver, player.x, player.y, won]);

  useEffect(() => {
    if (won || gameOver) return;
    if (enemies.some((enemy) => enemy.x === player.x && enemy.y === player.y)) {
      setGameOver(true);
      setStatus('An enemy got you. Try again!');
    }
  }, [enemies, gameOver, player.x, player.y, won]);

  const cells = board.flatMap((row, y) =>
    row.map((cell, x) => {
      const key = keyOf(x, y);
      const bombHere = bombs.some((bomb) => bomb.x === x && bomb.y === y);
      const enemyHere = enemies.some((enemy) => enemy.x === x && enemy.y === y);
      const playerHere = player.x === x && player.y === y;

      let className = 'bomber-cell';
      if (cell === 'wall') className += ' bomber-wall';
      if (cell === 'block' || cell === 'door-hidden' || cell === 'powerup') className += ' bomber-block';
      if (cell === 'door-revealed') className += ' bomber-door';
      if (blastCells.has(key)) className += ' bomber-blast';
      if (bombHere) className += ' bomber-bomb';
      if (enemyHere) className += ' bomber-enemy';
      if (playerHere) className += ' bomber-player';

      return <div key={key} className={className} />;
    })
  );

  return (
    <section>
      <div className="controls bomber-controls">
        <label>
          Difficulty
          <select value={difficulty} onChange={(event) => setDifficulty(event.target.value as Difficulty)}>
            {Object.entries(difficultyConfig).map(([value, detail]) => (
              <option key={value} value={value}>{detail.label}</option>
            ))}
          </select>
        </label>
        <button type="button" onClick={() => resetGame()}>New map</button>
      </div>

      <div className="scores">
        <div className="score-card"><span>Bombs</span><strong>{maxBombs}</strong></div>
        <div className="score-card"><span>Enemies</span><strong>{config.enemies}</strong></div>
        <div className="score-card"><span>Alive</span><strong>{enemies.length}</strong></div>
      </div>

      <div className="status" role="status">
        {!gameOver && !won && status}
        {gameOver && `${status} Press New map to restart.`}
        {won && status}
      </div>

      <div className="bomber-help">
        Move: Arrow keys · Bomb: Space · Goal: reveal and enter the hidden door.
      </div>

      <div className="bomber-board" style={{ gridTemplateColumns: `repeat(${WIDTH}, minmax(0, 1fr))` }}>
        {cells}
      </div>
    </section>
  );
};

export default BombermanGame;
