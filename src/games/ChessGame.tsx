import { useMemo, useState } from 'react';

type PieceColor = 'white' | 'black';
type PieceType = 'pawn' | 'knight' | 'bishop' | 'rook' | 'queen' | 'king';
type Difficulty = 'beginner' | 'intermediate' | 'advanced' | 'professional';

type Piece = {
  type: PieceType;
  color: PieceColor;
};

type Square = Piece | null;
type Board = Square[];

type Move = {
  from: number;
  to: number;
  promotion?: PieceType;
};

const DIFFICULTIES: Difficulty[] = ['beginner', 'intermediate', 'advanced', 'professional'];

const SEARCH_DEPTH: Record<Difficulty, number> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
  professional: 4
};

const PIECE_VALUES: Record<PieceType, number> = {
  pawn: 100,
  knight: 320,
  bishop: 330,
  rook: 500,
  queen: 900,
  king: 20000
};

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

const PIECE_UNICODE: Record<PieceColor, Record<PieceType, string>> = {
  white: {
    king: '♔',
    queen: '♕',
    rook: '♖',
    bishop: '♗',
    knight: '♘',
    pawn: '♙'
  },
  black: {
    king: '♚',
    queen: '♛',
    rook: '♜',
    bishop: '♝',
    knight: '♞',
    pawn: '♟'
  }
};

const toRow = (index: number) => Math.floor(index / 8);
const toCol = (index: number) => index % 8;
const toIndex = (row: number, col: number) => row * 8 + col;
const onBoard = (row: number, col: number) => row >= 0 && row < 8 && col >= 0 && col < 8;

const createInitialBoard = (): Board => {
  const board: Board = Array(64).fill(null);
  const backRank: PieceType[] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];

  for (let col = 0; col < 8; col += 1) {
    board[toIndex(0, col)] = { type: backRank[col], color: 'black' };
    board[toIndex(1, col)] = { type: 'pawn', color: 'black' };
    board[toIndex(6, col)] = { type: 'pawn', color: 'white' };
    board[toIndex(7, col)] = { type: backRank[col], color: 'white' };
  }

  return board;
};

const getSquareName = (index: number) => {
  const row = toRow(index);
  const col = toCol(index);
  return `${FILES[col]}${8 - row}`;
};

const applyMove = (board: Board, move: Move): Board => {
  const next = [...board];
  const movingPiece = next[move.from];
  if (!movingPiece) return board;

  next[move.from] = null;
  const destinationRow = toRow(move.to);

  if (movingPiece.type === 'pawn' && (destinationRow === 0 || destinationRow === 7)) {
    next[move.to] = {
      type: move.promotion ?? 'queen',
      color: movingPiece.color
    };
  } else {
    next[move.to] = movingPiece;
  }

  return next;
};

const getPseudoMovesForPiece = (board: Board, index: number): Move[] => {
  const piece = board[index];
  if (!piece) return [];

  const row = toRow(index);
  const col = toCol(index);
  const moves: Move[] = [];

  const addMove = (targetRow: number, targetCol: number) => {
    if (!onBoard(targetRow, targetCol)) return;
    const targetIndex = toIndex(targetRow, targetCol);
    const targetPiece = board[targetIndex];
    if (!targetPiece || targetPiece.color !== piece.color) {
      moves.push({ from: index, to: targetIndex });
    }
  };

  if (piece.type === 'pawn') {
    const direction = piece.color === 'white' ? -1 : 1;
    const startRow = piece.color === 'white' ? 6 : 1;

    const oneForwardRow = row + direction;
    if (onBoard(oneForwardRow, col) && !board[toIndex(oneForwardRow, col)]) {
      moves.push({ from: index, to: toIndex(oneForwardRow, col) });

      const twoForwardRow = row + direction * 2;
      if (row === startRow && !board[toIndex(twoForwardRow, col)]) {
        moves.push({ from: index, to: toIndex(twoForwardRow, col) });
      }
    }

    for (const colOffset of [-1, 1]) {
      const captureCol = col + colOffset;
      if (!onBoard(oneForwardRow, captureCol)) continue;
      const captureIndex = toIndex(oneForwardRow, captureCol);
      const target = board[captureIndex];
      if (target && target.color !== piece.color) {
        moves.push({ from: index, to: captureIndex });
      }
    }

    return moves;
  }

  if (piece.type === 'knight') {
    const offsets = [
      [-2, -1], [-2, 1],
      [-1, -2], [-1, 2],
      [1, -2], [1, 2],
      [2, -1], [2, 1]
    ];
    offsets.forEach(([dRow, dCol]) => addMove(row + dRow, col + dCol));
    return moves;
  }

  if (piece.type === 'king') {
    for (let dRow = -1; dRow <= 1; dRow += 1) {
      for (let dCol = -1; dCol <= 1; dCol += 1) {
        if (dRow === 0 && dCol === 0) continue;
        addMove(row + dRow, col + dCol);
      }
    }
    return moves;
  }

  const directions: number[][] = [];
  if (piece.type === 'bishop' || piece.type === 'queen') {
    directions.push([-1, -1], [-1, 1], [1, -1], [1, 1]);
  }
  if (piece.type === 'rook' || piece.type === 'queen') {
    directions.push([-1, 0], [1, 0], [0, -1], [0, 1]);
  }

  for (const [dRow, dCol] of directions) {
    let nextRow = row + dRow;
    let nextCol = col + dCol;
    while (onBoard(nextRow, nextCol)) {
      const targetIndex = toIndex(nextRow, nextCol);
      const target = board[targetIndex];
      if (!target) {
        moves.push({ from: index, to: targetIndex });
      } else {
        if (target.color !== piece.color) {
          moves.push({ from: index, to: targetIndex });
        }
        break;
      }
      nextRow += dRow;
      nextCol += dCol;
    }
  }

  return moves;
};

const isInCheck = (board: Board, color: PieceColor): boolean => {
  const kingIndex = board.findIndex((piece) => piece?.type === 'king' && piece.color === color);
  if (kingIndex === -1) return false;

  for (let i = 0; i < board.length; i += 1) {
    const piece = board[i];
    if (!piece || piece.color === color) continue;

    const moves = getPseudoMovesForPiece(board, i);
    if (moves.some((move) => move.to === kingIndex)) {
      return true;
    }
  }

  return false;
};

const getLegalMoves = (board: Board, color: PieceColor): Move[] => {
  const moves: Move[] = [];
  for (let i = 0; i < board.length; i += 1) {
    const piece = board[i];
    if (!piece || piece.color !== color) continue;

    const pseudoMoves = getPseudoMovesForPiece(board, i);
    pseudoMoves.forEach((move) => {
      const nextBoard = applyMove(board, move);
      if (!isInCheck(nextBoard, color)) {
        moves.push(move);
      }
    });
  }
  return moves;
};

const evaluateBoard = (board: Board): number => {
  let score = 0;
  board.forEach((piece, index) => {
    if (!piece) return;

    const base = PIECE_VALUES[piece.type];
    const row = toRow(index);
    const centerDistance = Math.abs(3.5 - row) + Math.abs(3.5 - toCol(index));
    const activityBonus = Math.max(0, 4 - centerDistance) * 3;

    const signed = base + activityBonus;
    score += piece.color === 'black' ? signed : -signed;
  });
  return score;
};

const orderMoves = (board: Board, moves: Move[]): Move[] =>
  [...moves].sort((a, b) => {
    const targetA = board[a.to];
    const targetB = board[b.to];
    const scoreA = targetA ? PIECE_VALUES[targetA.type] : 0;
    const scoreB = targetB ? PIECE_VALUES[targetB.type] : 0;
    return scoreB - scoreA;
  });

const minimax = (board: Board, depth: number, alpha: number, beta: number, maximizing: boolean): number => {
  if (depth === 0) return evaluateBoard(board);

  const color: PieceColor = maximizing ? 'black' : 'white';
  const legalMoves = getLegalMoves(board, color);

  if (legalMoves.length === 0) {
    if (isInCheck(board, color)) {
      return maximizing ? -50000 - depth : 50000 + depth;
    }
    return 0;
  }

  const orderedMoves = orderMoves(board, legalMoves);

  if (maximizing) {
    let value = -Infinity;
    for (const move of orderedMoves) {
      value = Math.max(value, minimax(applyMove(board, move), depth - 1, alpha, beta, false));
      alpha = Math.max(alpha, value);
      if (beta <= alpha) break;
    }
    return value;
  }

  let value = Infinity;
  for (const move of orderedMoves) {
    value = Math.min(value, minimax(applyMove(board, move), depth - 1, alpha, beta, true));
    beta = Math.min(beta, value);
    if (beta <= alpha) break;
  }
  return value;
};

const chooseComputerMove = (board: Board, difficulty: Difficulty): Move | null => {
  const legalMoves = getLegalMoves(board, 'black');
  if (legalMoves.length === 0) return null;

  if (difficulty === 'beginner') {
    const safeMoves = legalMoves.filter((move) => !board[move.to]);
    const pool = safeMoves.length > 0 ? safeMoves : legalMoves;
    return pool[Math.floor(Math.random() * pool.length)] ?? null;
  }

  const depth = SEARCH_DEPTH[difficulty];
  const orderedMoves = orderMoves(board, legalMoves);
  let bestScore = -Infinity;
  let bestMove = orderedMoves[0];

  for (const move of orderedMoves) {
    const nextBoard = applyMove(board, move);
    const score = minimax(nextBoard, depth - 1, -Infinity, Infinity, false);
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
};

const getGameStatus = (board: Board, turn: PieceColor): string => {
  const legalMoves = getLegalMoves(board, turn);
  if (legalMoves.length > 0) {
    return isInCheck(board, turn) ? `${turn} in check` : 'active';
  }
  return isInCheck(board, turn) ? `${turn} checkmate` : 'stalemate';
};

const ChessGame = () => {
  const [board, setBoard] = useState<Board>(createInitialBoard);
  const [turn, setTurn] = useState<PieceColor>('white');
  const [selectedSquare, setSelectedSquare] = useState<number | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('beginner');
  const [message, setMessage] = useState('Your turn as White.');

  const legalMovesForWhite = useMemo(() => getLegalMoves(board, 'white'), [board]);
  const selectedTargets = useMemo(() => {
    if (selectedSquare === null) return new Set<number>();
    return new Set(legalMovesForWhite.filter((move) => move.from === selectedSquare).map((move) => move.to));
  }, [legalMovesForWhite, selectedSquare]);

  const reset = () => {
    setBoard(createInitialBoard());
    setTurn('white');
    setSelectedSquare(null);
    setMessage('Your turn as White.');
  };

  const runComputerTurn = (nextBoard: Board) => {
    const statusBefore = getGameStatus(nextBoard, 'black');
    if (statusBefore === 'black checkmate') {
      setMessage('Checkmate! You win.');
      return;
    }
    if (statusBefore === 'stalemate') {
      setMessage('Stalemate. Draw game.');
      return;
    }

    setTurn('black');
    setMessage(`Computer (${difficulty}) is thinking...`);

    window.setTimeout(() => {
      setBoard((currentBoard) => {
        const move = chooseComputerMove(currentBoard, difficulty);
        if (!move) {
          setTurn('white');
          setMessage('Stalemate. Draw game.');
          return currentBoard;
        }

        const updated = applyMove(currentBoard, move);
        const nextStatus = getGameStatus(updated, 'white');

        if (nextStatus === 'white checkmate') {
          setTurn('white');
          setMessage(`Computer moved ${getSquareName(move.from)}→${getSquareName(move.to)}. Checkmate. Computer wins.`);
          return updated;
        }

        if (nextStatus === 'stalemate') {
          setTurn('white');
          setMessage(`Computer moved ${getSquareName(move.from)}→${getSquareName(move.to)}. Stalemate.`);
          return updated;
        }

        const isCheck = nextStatus === 'white in check';
        setTurn('white');
        setMessage(
          `Computer moved ${getSquareName(move.from)}→${getSquareName(move.to)}.${isCheck ? ' You are in check.' : ' Your turn.'}`
        );
        return updated;
      });
    }, 220);
  };

  const onSquareClick = (index: number) => {
    if (turn !== 'white') return;
    const piece = board[index];

    if (selectedSquare === null) {
      if (piece?.color === 'white') {
        setSelectedSquare(index);
      }
      return;
    }

    if (piece?.color === 'white') {
      setSelectedSquare(index);
      return;
    }

    const chosenMove = legalMovesForWhite.find((move) => move.from === selectedSquare && move.to === index);
    if (!chosenMove) {
      setSelectedSquare(null);
      return;
    }

    const updated = applyMove(board, chosenMove);
    setBoard(updated);
    setSelectedSquare(null);
    runComputerTurn(updated);
  };

  const activeStatus = getGameStatus(board, turn);
  const gameOver = activeStatus.includes('checkmate') || activeStatus === 'stalemate';

  return (
    <>
      <div className="controls chess-controls">
        <div className="switcher" role="group" aria-label="Chess difficulty">
          {DIFFICULTIES.map((level) => (
            <button
              key={level}
              type="button"
              className={difficulty === level ? 'active' : ''}
              onClick={() => {
                setDifficulty(level);
                reset();
              }}
            >
              {level[0].toUpperCase() + level.slice(1)}
            </button>
          ))}
        </div>
        <button type="button" onClick={reset}>New Game</button>
      </div>

      <div className="status" role="status">
        {message}
      </div>

      <div className="chess-board" aria-label="Chess board">
        {board.map((square, index) => {
          const row = toRow(index);
          const col = toCol(index);
          const isLight = (row + col) % 2 === 0;
          const selected = selectedSquare === index;
          const moveTarget = selectedTargets.has(index);

          return (
            <button
              type="button"
              key={index}
              className={`chess-cell ${isLight ? 'chess-light' : 'chess-dark'} ${selected ? 'chess-selected' : ''} ${moveTarget ? 'chess-target' : ''}`}
              onClick={() => onSquareClick(index)}
              disabled={gameOver}
              aria-label={`${getSquareName(index)} ${square ? `${square.color} ${square.type}` : 'empty'}`}
            >
              {square ? PIECE_UNICODE[square.color][square.type] : ''}
            </button>
          );
        })}
      </div>

      <p className="chess-help">Play as White. Select a piece, then select a highlighted destination square.</p>
    </>
  );
};

export default ChessGame;
