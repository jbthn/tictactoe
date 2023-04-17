# syntax=docker/dockerfile:1

FROM node:18-alpine
ENV NODE_ENV=production
ENV PORT=8080
ENV DB_URL=mongodb://host.docker.internal:27017/tictactoe

WORKDIR /app

COPY ["package.json", ".pnp.cjs", ".yarnrc.yml", "yarn.lock", "tsconfig.json", "./"]
COPY [".yarn/", "./.yarn"]
COPY ["src/", "./src"]

CMD yarn start
