import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import {
  addUserToGame,
  fetchAndValidateUser,
  createNewGame,
  createNewUser,
  makeMove,
  getGameForUser,
} from "./db";
import { EMPTY_SQUARE, GameStatus } from "./game";

describe("db", () => {
  let mongoServer;
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = await mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  describe("user", () => {
    test("create and fetch user", async () => {
      const user = await createNewUser();
      const userFromDb = await fetchAndValidateUser(user._id.toString());
      expect(userFromDb._id).toEqual(user._id);
    });
  });

  describe("game", () => {
    let user1Id;
    let user2Id;
    beforeAll(async () => {
      [user1Id, user2Id] = (
        await Promise.all([createNewUser(), createNewUser()])
      ).map((user) => user._id.toString());
    });

    test("create game", async () => {
      const game = await createNewGame(user1Id);
      expect(game).toHaveProperty("friendlyId");
      expect(game.userXId).toEqual(user1Id);
      expect(game.board).toMatchObject([
        [EMPTY_SQUARE, EMPTY_SQUARE, EMPTY_SQUARE],
        [EMPTY_SQUARE, EMPTY_SQUARE, EMPTY_SQUARE],
        [EMPTY_SQUARE, EMPTY_SQUARE, EMPTY_SQUARE],
      ]);
    });

    test("get game", async () => {
      const game = await createNewGame(user1Id);
      const retrieved = await getGameForUser(game.friendlyId, user1Id);
      expect(retrieved.status).toEqual(GameStatus.PENDING);
    });

    test("get game by user 1", async () => {
      const game = await createNewGame(user1Id);
      await addUserToGame(user2Id, game.friendlyId);
      const retrieved = await getGameForUser(game.friendlyId, user1Id);
      expect(retrieved.status).toEqual(GameStatus.X_NEXT);
      expect(retrieved.userOId).toBeUndefined();
    });

    test("get game by user 2", async () => {
      const game = await createNewGame(user1Id);
      await addUserToGame(user2Id, game.friendlyId);
      const retrieved = await getGameForUser(game.friendlyId, user2Id);
      expect(retrieved.status).toEqual(GameStatus.X_NEXT);
      expect(retrieved.userXId).toBeUndefined();
    });

    test("unauthorized get game", async () => {
      const game = await createNewGame(user1Id);
      await expect(() =>
        getGameForUser(game.friendlyId, user2Id)
      ).rejects.toThrow("Did not find a game with ID"); // partial match
    });

    describe("join game", () => {
      test("happy path", async () => {
        const game = await createNewGame(user1Id);
        expect(game.userOId).toBeUndefined();
        const updatedGame = await addUserToGame(user2Id, game.friendlyId);
        expect(updatedGame.userOId).toEqual(user2Id);
      });

      test("user 1 rejoins", async () => {
        const game = await createNewGame(user1Id);
        const updatedGame = await addUserToGame(user1Id, game.friendlyId);
        expect(updatedGame.userXId).toEqual(user1Id);
        expect(updatedGame.userOId).toBeUndefined();
      });

      test("game already full", async () => {
        const game = await createNewGame(user1Id);
        await addUserToGame(user2Id, game.friendlyId);
        const user3 = await createNewUser();
        await expect(() =>
          addUserToGame(user3._id.toString(), game.friendlyId)
        ).rejects.toThrowErrorMatchingInlineSnapshot(`"Game is already full"`);
      });
    });

    describe("make move", () => {
      let game;
      let makeMoveHelper;
      beforeEach(async () => {
        game = await createNewGame(user1Id);
        game = await addUserToGame(user2Id, game.friendlyId);
        makeMoveHelper = (user, row, col) =>
          makeMove({
            userId: user,
            gameId: game.friendlyId,
            row,
            col,
          });
      });

      test("make first move", async () => {
        const updatedGame = await makeMoveHelper(user1Id, 0, 0);
        expect(updatedGame.board).toMatchObject([
          ["x", EMPTY_SQUARE, EMPTY_SQUARE],
          [EMPTY_SQUARE, EMPTY_SQUARE, EMPTY_SQUARE],
          [EMPTY_SQUARE, EMPTY_SQUARE, EMPTY_SQUARE],
        ]);
      });

      describe("error cases", () => {
        test("y go out of turn", async () => {
          await expect(() =>
            makeMoveHelper(user2Id, 0, 0)
          ).rejects.toThrowErrorMatchingInlineSnapshot(
            `"Cannot make a move out of turn; X should go next"`
          );
        });

        test("x go out of turn", async () => {
          await makeMoveHelper(user1Id, 1, 1);
          await expect(() =>
            makeMoveHelper(user1Id, 0, 0)
          ).rejects.toThrowErrorMatchingInlineSnapshot(
            `"Cannot make a move out of turn; O should go next"`
          );
        });

        test("spot already taken", async () => {
          await makeMoveHelper(user1Id, 1, 1);
          await expect(() =>
            makeMoveHelper(user2Id, 1, 1)
          ).rejects.toThrowErrorMatchingInlineSnapshot(`"Invalid move"`);
        });

        test("wrong user", async () => {
          const user = await createNewUser();
          await expect(() =>
            makeMoveHelper(user, 1, 1)
          ).rejects.toThrowErrorMatchingInlineSnapshot(
            `"User is not participating in this game"`
          );
        });
      });

      test("x wins", async () => {
        await makeMoveHelper(user1Id, 0, 0);
        await makeMoveHelper(user2Id, 0, 1);
        await makeMoveHelper(user1Id, 2, 2);
        await makeMoveHelper(user2Id, 1, 0);
        const updated = await makeMoveHelper(user1Id, 1, 1);
        expect(updated.status).toEqual(GameStatus.X_WINS);
      });

      test("o wins", async () => {
        await makeMoveHelper(user1Id, 0, 0);
        await makeMoveHelper(user2Id, 0, 1);
        await makeMoveHelper(user1Id, 2, 2);
        await makeMoveHelper(user2Id, 1, 1);
        await makeMoveHelper(user1Id, 1, 2);
        const updated = await makeMoveHelper(user2Id, 2, 1);
        expect(updated.status).toEqual(GameStatus.O_WINS);
      });

      test("draw", async () => {
        await makeMoveHelper(user1Id, 0, 0);
        await makeMoveHelper(user2Id, 0, 1);
        await makeMoveHelper(user1Id, 2, 2);
        await makeMoveHelper(user2Id, 1, 1);
        await makeMoveHelper(user1Id, 2, 1);
        await makeMoveHelper(user2Id, 2, 0);
        await makeMoveHelper(user1Id, 1, 0);
        await makeMoveHelper(user2Id, 1, 2);
        const updated = await makeMoveHelper(user1Id, 0, 2);
        expect(updated.status).toEqual(GameStatus.DRAW);
      });
    });
  });
});
