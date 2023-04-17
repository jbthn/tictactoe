# Tic Tac Toe

Backend to support a game of tic tac toe between 2 players. Data is stored in MongoDB.

# API Documentation

## Basic usage

1. [Create a user](#create-a-user). There is no authentication per se; the user ID generated on the server is what allows a user to play the game.
2. [Create a game](#create-a-game) for that user. Optionally, specify a board size (defaults to 3). The user who creates the game will be player 'X'.
3. For the second user: [create a user](#create-a-user). Then, that user can pass in their user ID to join the game created in step 2. The second user will be player 'O'.
4. To check if the first user ('X') can make their first move: Call the [get game API](#get-game), passing in the user ID. If the [status](#game-status) is X_NEXT, the user can make their first move. If the status is PENDING, a second user has not joined yet.
5. To make a move: Call the [make move API](#make-a-move). The server will validate that the requesting user can play in the game and that it's their turn next.
6. Continue calling the [get game API](#get-game) to check the [game status](#game-status), and then the make move API when it's time. This will show whose turn it is, or if the game is over (a win or a draw).

## Create a user

Creates a user and generates a unique ID for that user. This ID will be used to let that user create games, join games, and make moves in a game. The ID is all that is required to make API calls on behalf of a user, so it should be kept secret.

`POST /user`

**Request payload**: none

**Sample request**:

```
POST /user
```

**Sample response**:

```
{
  "_id":"643cda54b59cb45fa717b277",
  "createdAt":"2023-04-17T05:34:12.860Z",
  "updatedAt":"2023-04-17T05:34:12.860Z",
  "__v":0
}
```

## Create a game

Creates a game and sets up the passed user ID to be the 'X' user. The board size is configurable and defaults to 3 (standard tic tac toe).

`POST /game`

**Request payload**:
| Name | Type | Required | Explanation |
| --- | --- | --- | --- |
| `userId` | String | Yes | ID from the user who wishes to create a game |
| `boardSize` | Number | No (default 3) | Number of squares in each row and column |

**Sample request**:

```
POST /game
{
  "userId":"643c6e9c78acee5beadb0645",
  "boardSize":2
}
```

**Sample response**:

```
{
  "friendlyId":"00EA125F",
  "userXId":"643c6e9c78acee5beadb0645",
  "board":[["_","_"],["_","_"]],
  "_id":"643cda02b59cb45fa717b275",
  "createdAt":"2023-04-17T05:32:50.842Z",
  "updatedAt":"2023-04-17T05:32:50.842Z",
  "__v":0
}

```

## Join a game

Requests that the passed user ID be added to the game as player O. If the game is full (user X and user O already defined), this request will fail. If the passed user ID is already associated with the game (as either X or O) this is a no-op.

`POST /game/{id}/join`

**Request payload**:
| Name | Type | Required | Explanation |
| --- | --- | --- | --- |
| `userId` | String | Yes | ID from the user who wishes to join the game |

**Sample request**:

```
POST /game/00EA125F/join
{
  "userId":"643c6e9d78acee5beadb0647"
}
```

**Sample response**:

```
{
  "_id":"643cda02b59cb45fa717b275",
  "friendlyId":"00EA125F",
  "userXId":"643c6e9c78acee5beadb0645",
  "board":[["_","_"],["_","_"]],
  "createdAt":"2023-04-17T05:32:50.842Z",
  "updatedAt":"2023-04-17T16:55:49.024Z",
  "__v":0,
  "userOId":"643c6e9d78acee5beadb0647"
}
```

## Get game

Get the current details of the game. The response includes a representation of the [game board](#board). The response also includes the [game status](#game-status).

`GET /game/{id}?userId={userId}`

**Query parameters**:
| Name | Type | Required | Explanation |
| --- | --- | --- | --- |
| `userId` | String | Yes | ID from the user who wishes to check the game status |

**Sample request**:

```
GET /game/00EA125F?userId=643c6e9d78acee5beadb0647
```

**Sample response**:

```
{
  "_id":"643cda02b59cb45fa717b275",
  "friendlyId":"00EA125F",
  "board":[["_","_"],["_","_"]],
  "createdAt":"2023-04-17T05:32:50.842Z",
  "updatedAt":"2023-04-17T16:55:49.024Z",
  "__v":0,
  "userOId":"643c6e9d78acee5beadb0647",
  "status":"X_NEXT"
}
```

## Make a move

Place an X or O on the board on behalf of the user with the specified ID. The `row` and `col` indices passed in must be between 0 and the board size, and they must point to an empty square on the board. See [here](#board) for more details about the board.

`POST /game/{id}/move`

**Request payload**:
| Name | Type | Required | Explanation |
| --- | --- | --- | --- |
| `userId` | String | Yes | ID from the user who wishes to join the game |
| `row` | Number | Yes | Index of the row to place the square (starting with 0) |
| `col` | Number | Yes | Index of the column to place the square (starting with 0) |

**Sample request**:

```
POST /game/00EA125F/move
{
  "userId":"643c6e9c78acee5beadb0645",
  "row": 0,
  "col": 1
}
```

**Sample response**:

```
{
  "_id":"643cda02b59cb45fa717b275",
  "friendlyId":"00EA125F",
  "userXId":"643c6e9c78acee5beadb0645",
  "board":[["_","x"],["_","_"]],
  "createdAt":"2023-04-17T05:32:50.842Z",
  "updatedAt":"2023-04-17T17:08:53.543Z",
  "__v":0,
  "userOId":"643c6e9d78acee5beadb0647",
  "status":"O_NEXT"
}
```

# API Data

## Game status

The game status is part of the game object returned by the get game and make move APIs. It has the following values:

| Name    | Explanation                                                 |
| ------- | ----------------------------------------------------------- |
| X_WINS  | The game is over, and player X won                          |
| O_WINS  | The game is over, and player O won                          |
| DRAW    | The game is over, and neither player won                    |
| X_NEXT  | The game is still in progress, and it's X's turn next       |
| O_NEXT  | The game is still in progress, and it's O's turn next       |
| PENDING | The game has not started yet (waiting for player O to join) |

## Board

The game board is represented as a 2-D array. Empty squares are represented with "\_", and squares where either the X or O player has made a move are represented with "x" and "o" respectively. Here is an example representation of a 3x3 board with all empty squares:

```
[
  ["_", "_", "_"],
  ["_", "_", "_"],
  ["_", "_", "_"]
]
```

To place an X in the upper left corner, the value for row would be 0 and the value for col would also be 0. The board would then look like:

```
[
  ["x", "_", "_"],
  ["_", "_", "_"],
  ["_", "_", "_"]
]
```

To place an O in the bottom left corner, the value for row would be 2 and the value for col would also be 0. The board would then look like:

```
[
  ["x", "_", "_"],
  ["_", "_", "_"],
  ["o", "_", "_"]
]
```

# Development Tips

This project uses yarn's [Plug'n'Play installs](https://yarnpkg.com/features/pnp). There may be some additional configuration steps necessary for your IDE to understand how to resolve imports. See https://yarnpkg.com/getting-started/editor-sdks for instructions.
