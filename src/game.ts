export type Board = ("x" | "o" | "_")[][];
export const EMPTY_SQUARE = "_";

export enum GameStatus {
  X_WINS = "X_WINS",
  O_WINS = "O_WINS",
  DRAW = "DRAW",
  X_NEXT = "X_NEXT",
  O_NEXT = "O_NEXT",
  PENDING = "PENDING",
}

export const FinalGameStatuses = [
  GameStatus.X_WINS,
  GameStatus.O_WINS,
  GameStatus.DRAW,
];

export function setUpGame(boardSize = 3): Board {
  const board = new Array(boardSize)
    .fill(0)
    .map(() => new Array(boardSize).fill(EMPTY_SQUARE));
  return board;
}

export function isMoveValid(board: Board, row: number, col: number) {
  const boardSize = board.length;
  if (row < 0 || row >= boardSize || col < 0 || col >= boardSize) {
    return false;
  }
  if (board[row][col] !== EMPTY_SQUARE) {
    return false;
  }
  return true;
}

export function getGameStatus(board: Board): GameStatus {
  const boardSize = board.length;
  let totalMovesX = 0;
  let totalMovesY = 0;
  const rows = new Array(boardSize).fill(0);
  const cols = new Array(boardSize).fill(0);
  let diagLtoR = 0;
  let diagRtoL = 0;

  for (const [row, rowVal] of board.entries()) {
    for (const [col, square] of rowVal.entries()) {
      if (square === EMPTY_SQUARE) {
        continue;
      }
      square === "x" ? totalMovesX++ : totalMovesY++;
      const toAdd = square === "x" ? 1 : -1;
      rows[row] += toAdd;
      if (Math.abs(rows[row]) === boardSize) {
        return rows[row] > 0 ? GameStatus.X_WINS : GameStatus.O_WINS;
      }
      cols[col] += toAdd;
      if (Math.abs(cols[col]) === boardSize) {
        return cols[col] > 0 ? GameStatus.X_WINS : GameStatus.O_WINS;
      }
      if (row === col) {
        diagLtoR += toAdd;
        if (Math.abs(diagLtoR) === boardSize) {
          return diagLtoR > 0 ? GameStatus.X_WINS : GameStatus.O_WINS;
        }
      }
      if (row + col === boardSize - 1) {
        diagRtoL += toAdd;
        if (Math.abs(diagRtoL) === boardSize) {
          return diagRtoL > 0 ? GameStatus.X_WINS : GameStatus.O_WINS;
        }
      }
    }
  }
  if (totalMovesX + totalMovesY === boardSize * boardSize) {
    return GameStatus.DRAW;
  } else if (totalMovesX > totalMovesY) {
    return GameStatus.O_NEXT;
  } else {
    return GameStatus.X_NEXT;
  }
}
