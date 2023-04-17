import crypto from "crypto";
import Game from "./models/Game";
import User from "./models/User";
import { MongoError } from "mongodb";
import {
  setUpGame,
  getGameStatus,
  GameStatus,
  FinalGameStatuses,
  isMoveValid,
} from "./game";

const maxIdGenerationTries = 3;

export async function fetchAndValidateUser(userId: string) {
  const user = await User.findById(userId).exec();
  if (!user) {
    throw new Error(`No user with ID ${userId} found.`);
  }
  return user;
}

async function fetchAndValidateGame(gameId: string) {
  const game = await Game.findOne({ friendlyId: gameId }).exec();
  if (!game) {
    throw new Error(`No game with id ${gameId} found.`);
  }
  return game;
}

export async function getGameForUser(gameId: string, userId: string) {
  const game = await fetchAndValidateGame(gameId);
  if (game.userOId !== userId && game.userXId !== userId) {
    throw new Error(
      `Did not find a game with ID ${gameId} for user ${userId}.`
    );
  }
  return formatGameForUser(game, userId);
}

export async function createNewUser() {
  return await User.create({});
}

export async function createNewGame(userId: string, boardSize = 3) {
  await fetchAndValidateUser(userId);
  const friendlyId = crypto.randomBytes(4).toString("hex").toUpperCase();
  const game = {
    friendlyId,
    userXId: userId,
    board: setUpGame(boardSize),
  };
  let idAttempts = 0;
  while (idAttempts < maxIdGenerationTries) {
    try {
      return await Game.create(game);
    } catch (e) {
      if (e instanceof MongoError && e.code === 11000) {
        // duplicate key error – try again with new id
        idAttempts++;
        game.friendlyId = crypto.randomBytes(4).toString("hex").toUpperCase();
      } else {
        throw e;
      }
    }
  }
  console.error("Unique ID generation failed.");
  throw new Error("An error occurred. Please try again.");
}

export async function addUserToGame(userId: string, gameId: string) {
  const [game] = await Promise.all([
    fetchAndValidateGame(gameId),
    fetchAndValidateUser(userId),
  ]);
  if (game.userXId === userId) {
    // user has already been added to game. nothing to do
    return game;
  }
  if (game.userOId) {
    if (game.userOId === userId || game.userXId === userId) {
      // user has already been added to game. nothing to do
      return game;
    }
    throw new Error("Game is already full");
  }
  game.userOId = userId;
  await game.save();
  return game;

  // TODO can't expose both user ids via this endpoint!!!
}

export async function makeMove({
  userId,
  gameId,
  row,
  col,
}: {
  userId: string;
  gameId: string;
  row: number;
  col: number;
}) {
  const [game] = await Promise.all([
    fetchAndValidateGame(gameId),
    fetchAndValidateUser(userId),
  ]);
  const userGamePiece = determineUserGamePiece(game, userId);
  const gameStatus = getGameStatus(game.board);
  if (FinalGameStatuses.includes(gameStatus)) {
    throw new Error("Game is over; cannot make a move.");
  } else if (userGamePiece === "x" && gameStatus === GameStatus.O_NEXT) {
    throw new Error("Cannot make a move out of turn; O should go next");
  } else if (userGamePiece === "o" && gameStatus === GameStatus.X_NEXT) {
    throw new Error("Cannot make a move out of turn; X should go next");
  }
  if (!isMoveValid(game.board, row, col)) {
    throw new Error("Invalid move");
  }
  await Game.updateOne(
    { _id: game._id },
    { [`board.${row}.${col}`]: userGamePiece }
  );
  const updated = await fetchAndValidateGame(game.friendlyId);
  return formatGameForUser(updated, userId);
}

function determineUserGamePiece(game, userId) {
  if (game.userXId === userId) {
    return "x";
  } else if (game.userOId === userId) {
    return "o";
  }
  throw new Error("User is not participating in this game");
}

function formatGameForUser(game, userId) {
  let status = getGameStatus(game.board);
  if (!game.userOId) {
    status = GameStatus.PENDING;
  }
  const gameObj = game.toObject();
  if (userId === gameObj.userOId) {
    delete gameObj.userXId;
  } else {
    delete gameObj.userOId;
  }
  return {
    ...gameObj,
    status,
  };
}
