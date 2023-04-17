import { GameStatus, getGameStatus, isMoveValid, setUpGame } from "./game";

describe("game", () => {
  describe("move validation", () => {
    test("x at (0,0)", () => {
      const board = setUpGame();
      expect(isMoveValid(board, 0, 0)).toBe(true);
    });
  });

  describe("check game status", () => {
    test("new game", () => {
      const board = setUpGame();
      expect(getGameStatus(board)).toEqual(GameStatus.X_NEXT);
    });
    test("one move", () => {
      const board = setUpGame();
      board[2][1] = "x";
      expect(getGameStatus(board)).toEqual(GameStatus.O_NEXT);
    });
    const players: ("x" | "o")[] = ["x", "o"];
    for (const player of players) {
      for (const i of [0, 1, 2]) {
        test(`${player} wins in row ${i}`, () => {
          const board = setUpGame();
          board[i][0] = player;
          board[i][1] = player;
          board[i][2] = player;
          expect(getGameStatus(board)).toEqual(
            player === "x" ? GameStatus.X_WINS : GameStatus.O_WINS
          );
        });
        test(`${player} wins in col ${i}`, () => {
          const board = setUpGame();
          board[0][i] = player;
          board[1][i] = player;
          board[2][i] = player;
          expect(getGameStatus(board)).toEqual(
            player === "x" ? GameStatus.X_WINS : GameStatus.O_WINS
          );
        });
      }

      test(`${player} wins in L-to-R diagonal`, () => {
        const board = setUpGame();
        board[0][0] = player;
        board[1][1] = player;
        board[2][2] = player;
        expect(getGameStatus(board)).toEqual(
          player === "x" ? GameStatus.X_WINS : GameStatus.O_WINS
        );
      });
      test(`${player} wins in R-to-L diagonal`, () => {
        const board = setUpGame();
        board[0][2] = player;
        board[1][1] = player;
        board[2][0] = player;
        expect(getGameStatus(board)).toEqual(
          player === "x" ? GameStatus.X_WINS : GameStatus.O_WINS
        );
      });
    }
  });
});
