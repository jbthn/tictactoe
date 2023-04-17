import { Schema, Types, model } from "mongoose";

interface IGame {
  friendlyId: string;
  userXId: string;
  userOId?: string;
  board: Types.Array<("x" | "o" | "_")[]>;
}

const game = new Schema<IGame>(
  {
    friendlyId: {
      type: String,
      unique: true,
      required: true,
    },
    userXId: {
      type: String,
      required: true,
    },
    userOId: String,
    board: {
      type: [[String]],
      required: true,
    },
  },
  { timestamps: true }
);

const Game = model("Game", game);

export default Game;
