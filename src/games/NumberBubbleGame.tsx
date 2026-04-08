import { useCallback, useEffect, useMemo, useState } from 'react';

type Operation = 'add' | 'sub' | 'mul' | 'div';

type LevelConfig = {
  bubbleCount: number;
  matchesRequired: number;
  numberMax: number;
  timeLimit: number;
  operations: Operation[];
};

type Bubble = {
  id: number;
  label: string;
  value: number;
  left: number;
  top: number;
  size: number;
  drift: number;
  popped: boolean;
};

const LEVELS: LevelConfig[] = [
  { bubbleCount: 6, matchesRequired: 2, numberMax: 8, timeLimit: 25, operations: ['add'] },
  { bubbleCount: 7, matchesRequired: 2, numberMax: 10, timeLimit: 24, operations: ['add', 'sub'] },
  { bubbleCount: 8, matchesRequired: 3, numberMax: 12, timeLimit: 24, operations: ['add', 'sub'] },
  { bubbleCount: 9, matchesRequired: 3, numberMax: 14, timeLimit: 22, operations: ['add', 'sub', 'mul'] },
  { bubbleCount: 10, matchesRequired: 3, numberMax: 16, timeLimit: 22, operations: ['add', 'sub', 'mul'] },
  { bubbleCount: 11, matchesRequired: 4, numberMax: 18, timeLimit: 21, operations: ['add', 'sub', 'mul'] },
  { bubbleCount: 12, matchesRequired: 4, numberMax: 20, timeLimit: 20, operations: ['add', 'sub', 'mul', 'div'] },
  { bubbleCount: 13, matchesRequired: 4, numberMax: 24, timeLimit: 19, operations: ['add', 'sub', 'mul', 'div'] },
  { bubbleCount: 14, matchesRequired: 5, numberMax: 28, timeLimit: 18, operations: ['add', 'sub', 'mul', 'div'] },
  { bubbleCount: 15, matchesRequired: 5, numberMax: 32, timeLimit: 17, operations: ['add', 'sub', 'mul', 'div'] },
  { bubbleCount: 16, matchesRequired: 6, numberMax: 36, timeLimit: 16, operations: ['add', 'sub', 'mul', 'div'] },
  { bubbleCount: 17, matchesRequired: 6, numberMax: 40, timeLimit: 15, operations: ['add', 'sub', 'mul', 'div'] }
];

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const buildMatchingExpression = (target: number, operation: Operation): { label: string; value: number } => {
  if (operation === 'add') {
    const left = randomInt(0, target);
    const right = target - left;
    return { label: `${left} + ${right}`, value: target };
  }

  if (operation === 'sub') {
    const right = randomInt(0, 12);
    const left = target + right;
    return { label: `${left} - ${right}`, value: target };
  }

  if (operation === 'mul') {
    const factors = Array.from({ length: target }, (_, index) => index + 1).filter((num) => target % num === 0);
    const left = factors[randomInt(0, factors.length - 1)];
    const right = target / left;
    return { label: `${left} × ${right}`, value: target };
  }

  const divisor = randomInt(1, 12);
  const dividend = target * divisor;
  return { label: `${dividend} ÷ ${divisor}`, value: target };
};

const buildDecoyExpression = (target: number, max: number, operation: Operation): { label: string; value: number } => {
  const wrongValue = target + randomInt(-6, 6) || target + 1;
  const safeWrongValue = Math.max(0, Math.min(max + 10, wrongValue === target ? target + 2 : wrongValue));

  if (operation === 'add') {
    const left = randomInt(0, safeWrongValue);
    const right = safeWrongValue - left;
    return { label: `${left} + ${right}`, value: safeWrongValue };
  }

  if (operation === 'sub') {
    const right = randomInt(0, 12);
    const left = safeWrongValue + right;
    return { label: `${left} - ${right}`, value: safeWrongValue };
  }

  if (operation === 'mul') {
    const left = randomInt(1, Math.max(2, Math.floor(Math.sqrt(safeWrongValue + 8))));
    const right = randomInt(1, Math.max(2, Math.floor((safeWrongValue + 10) / left)));
    return { label: `${left} × ${right}`, value: left * right };
  }

  const divisor = randomInt(1, 10);
  const result = safeWrongValue + randomInt(1, 3);
  const dividend = result * divisor;
  return { label: `${dividend} ÷ ${divisor}`, value: result };
};

const createLevelBubbles = (level: LevelConfig, target: number): Bubble[] => {
  const bubbles: Bubble[] = [];
  const ops = level.operations;

  for (let index = 0; index < level.matchesRequired; index += 1) {
    const expression = buildMatchingExpression(target, ops[index % ops.length]);
    bubbles.push({
      id: index,
      ...expression,
      left: randomInt(5, 75),
      top: randomInt(5, 70),
      size: randomInt(76, 112),
      drift: randomInt(5, 20),
      popped: false
    });
  }

  while (bubbles.length < level.bubbleCount) {
    const operation = ops[randomInt(0, ops.length - 1)];
    const expression = buildDecoyExpression(target, level.numberMax, operation);

    if (expression.value === target) {
      continue;
    }

    bubbles.push({
      id: bubbles.length,
      ...expression,
      left: randomInt(5, 75),
      top: randomInt(5, 70),
      size: randomInt(76, 112),
      drift: randomInt(5, 20),
      popped: false
    });
  }

  return bubbles.sort(() => Math.random() - 0.5);
};

const NumberBubbleGame = () => {
  const [levelIndex, setLevelIndex] = useState(0);
  const [targetNumber, setTargetNumber] = useState(4);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [foundMatches, setFoundMatches] = useState(0);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(LEVELS[0].timeLimit);
  const [message, setMessage] = useState('Click every bubble expression that equals the target number!');
  const [completed, setCompleted] = useState(false);

  const activeLevel = LEVELS[levelIndex];

  const loadLevel = useCallback(
    (index: number) => {
      const level = LEVELS[index];
      const nextTarget = randomInt(2, level.numberMax);
      setTargetNumber(nextTarget);
      setBubbles(createLevelBubbles(level, nextTarget));
      setFoundMatches(0);
      setLives(3);
      setTimeLeft(level.timeLimit);
      setCompleted(false);
      setMessage('Find all matching expressions before time runs out.');
    },
    []
  );

  useEffect(() => {
    loadLevel(levelIndex);
  }, [levelIndex, loadLevel]);

  useEffect(() => {
    if (completed) {
      return;
    }

    const timer = window.setInterval(() => {
      setTimeLeft((previous) => {
        if (previous <= 1) {
          window.clearInterval(timer);
          setMessage('Time up! Try this level again.');
          setLives(0);
          return 0;
        }

        return previous - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [completed, levelIndex]);

  useEffect(() => {
    if (foundMatches === activeLevel.matchesRequired) {
      const isLastLevel = levelIndex === LEVELS.length - 1;
      setCompleted(true);
      setScore((previous) => previous + activeLevel.matchesRequired * 15 + timeLeft);
      setMessage(isLastLevel ? 'Amazing! You beat every level.' : 'Great work! Move on to the next level.');
    }
  }, [foundMatches, activeLevel.matchesRequired, levelIndex, timeLeft]);

  const handleBubbleClick = (bubble: Bubble) => {
    if (bubble.popped || completed || lives <= 0) {
      return;
    }

    setBubbles((previous) => previous.map((item) => (item.id === bubble.id ? { ...item, popped: true } : item)));

    if (bubble.value === targetNumber) {
      setFoundMatches((previous) => previous + 1);
      setScore((previous) => previous + 10);
      setMessage('Correct! Keep going.');
      return;
    }

    setScore((previous) => Math.max(0, previous - 4));
    setLives((previous) => {
      const remaining = previous - 1;
      if (remaining <= 0) {
        setMessage('No lives left! Restart this level.');
      } else {
        setMessage(`Wrong answer. ${remaining} ${remaining === 1 ? 'life' : 'lives'} left.`);
      }
      return remaining;
    });
  };

  const levelLabel = useMemo(() => `${levelIndex + 1}/${LEVELS.length}`, [levelIndex]);

  return (
    <section>
      <div className="header">
        <div>
          <h2>Number Bubble Hunt</h2>
          <p>Target Number: <strong>{targetNumber}</strong></p>
        </div>
        <div className="scores">
          <div className="score-card"><span>Level</span><strong>{levelLabel}</strong></div>
          <div className="score-card"><span>Score</span><strong>{score}</strong></div>
          <div className="score-card"><span>Time</span><strong>{timeLeft}s</strong></div>
        </div>
      </div>

      <div className="controls">
        <span><strong>Lives:</strong> {lives}</span>
        <button type="button" onClick={() => loadLevel(levelIndex)}>Restart Level</button>
      </div>

      <p className="status">{message}</p>

      <div className="bubble-arena" role="group" aria-label="Math bubbles">
        {bubbles.map((bubble) => (
          <button
            key={bubble.id}
            type="button"
            className={`bubble ${bubble.popped ? 'bubble-popped' : ''}`}
            style={{
              left: `${bubble.left}%`,
              top: `${bubble.top}%`,
              width: `${bubble.size}px`,
              height: `${bubble.size}px`,
              animationDuration: `${8 + bubble.drift / 2}s`
            }}
            onClick={() => handleBubbleClick(bubble)}
            disabled={bubble.popped || completed || lives <= 0}
          >
            {bubble.label}
          </button>
        ))}
      </div>

      <div className="controls">
        <button type="button" onClick={() => setLevelIndex((previous) => Math.max(0, previous - 1))} disabled={levelIndex === 0}>
          Previous Level
        </button>
        <button
          type="button"
          onClick={() => setLevelIndex((previous) => Math.min(LEVELS.length - 1, previous + 1))}
          disabled={levelIndex === LEVELS.length - 1 || (!completed && lives > 0)}
        >
          Next Level
        </button>
      </div>
    </section>
  );
};

export default NumberBubbleGame;
