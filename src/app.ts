import Koa from "koa";
import Router from "@koa/router";
import koaBody from "koa-body";
import mongoose from "mongoose";
import {
  addUserToGame,
  createNewGame,
  createNewUser,
  getGameForUser,
  makeMove as makeMoveDb,
} from "./db";

const dbUrl = process.env.DB_URL || "mongodb://localhost:27017/tictactoe";
const port = process.env.PORT || 3000;

async function main() {
  await mongoose.connect(dbUrl);

  const app = new Koa();
  const router = new Router();
  router
    .post("/user", createUser)
    .post("/game", createGame)
    .get("/game/:id", getGame)
    .post("/game/:id/join", joinGame)
    .post("/game/:id/move", makeMove);

  app.use(koaBody()).use(router.routes()).use(router.allowedMethods());
  app.listen(port);
}

main();

async function createUser(ctx: Koa.DefaultContext) {
  const user = await createNewUser();
  ctx.body = user;
}

async function createGame(ctx: Koa.DefaultContext) {
  const { userId, boardSize } = ctx.request.body;
  const game = await createNewGame(userId, boardSize);
  ctx.body = game;
}

async function getGame(ctx: Koa.DefaultContext) {
  const { userId } = ctx.query;
  const gameId = ctx.params.id;
  const game = await getGameForUser(gameId, userId);
  ctx.body = game;
}

async function joinGame(ctx: Koa.DefaultContext) {
  const { userId } = ctx.request.body;
  const gameId = ctx.params.id;
  const game = await addUserToGame(userId, gameId);
  ctx.body = game;
}

async function makeMove(ctx: Koa.DefaultContext) {
  const { row, col, userId } = ctx.request.body;
  const gameId = ctx.params.id;
  const game = await makeMoveDb({ userId, gameId, row, col });
  ctx.body = game;
}
