#!/usr/bin/env node

const readline = require('readline');

readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);

// clear terminal
process.stdout.write('\x1Bc');

let state = {
  width: 33,
  height: 14,
  wall: '|',
  lives: 3,
  paddle: {
    symbol: '^',
    width: 6,
    speed: 2,
  },
  ball: {
    symbol: 'o',
    speed: 1,
    direction: {
      x: 1,
      y: -1,
    },
  },
  isRunning: false,
  isPaused: false,
  hardMode: false,
  activeMessage: 'Press [space] to launch',
  blocks: {
    symbol: '[==]',
    xOffset: 1,
    yOffset: 1,
    remaining: 40,
    map: [
      [1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1],
    ],
  },
};

const halfBlockCount = state.blocks.remaining / 2;
const halfWidth = Math.floor(state.width / 2);

state.paddle.x = halfWidth - (state.paddle.width / 2);
state.paddle.y = state.height;
state.ball.x = halfWidth + 1;
state.ball.y = state.height - 1;

const initialState = JSON.parse(JSON.stringify(state));

// display

function cursorTo(x, y) {
  return readline.cursorTo(process.stdout, x, y);
}

function stdOutWrite(output) {
  return process.stdout.write(output);
}

function drawBlocks({ blocks }) {
  const { map } = blocks;

  for (let row = 0; row < map.length; row++) {
    for (let col = 0; col < map[row].length; col++) {
      if (map[row][col] !== 0) {
        cursorTo(blocks.xOffset + (col * blocks.symbol.length), blocks.yOffset + row);
        stdOutWrite(blocks.symbol);
      }
    }
  }
}

function drawMessage(message) {
  const { length } = message;

  cursorTo(
    Math.floor(state.width / 2) - Math.floor(length / 2),
    Math.floor(state.height / 2),
  );

  stdOutWrite(message);
  readline.cursorTo(process.stdout, state.width + 1, 0);
}

function drawBall({ ball }) {
  cursorTo(ball.x, ball.y);
  stdOutWrite(ball.symbol);
}

function drawBackground({ width, height, wall }) {
  for (let i = 0; i < height; i++) {
    cursorTo(0, i);
    stdOutWrite(wall);
    cursorTo(width, i);
    stdOutWrite(wall);
  }

  cursorTo(state.width + 2, 2);
  stdOutWrite(`Lives: ${state.lives}`);

  const offset = 9;

  cursorTo(state.width + 2, offset);
  stdOutWrite('r - restart');
  cursorTo(state.width + 2, offset + 1);
  stdOutWrite('q - quit');
  cursorTo(state.width + 2, offset + 2);
  stdOutWrite('p - pause');
}

function drawPaddle({ paddle }) {
  cursorTo(paddle.x, paddle.y);
  stdOutWrite(paddle.symbol.repeat(paddle.width));
}

function drawLives({ width, lives }) {
  cursorTo(width + 9, 2);
  stdOutWrite(String(lives));
}

function clearRegion(x1, y1, x2, y2, symbol = ' ') {
  const rows = y2 - y1;
  const cols = x2 - x1;

  for (let i = 0; i < rows; i++) {
    cursorTo(x1, y1 + i);
    stdOutWrite(symbol.repeat(cols));
  }
}

function clearMessageArea({ width }) {
  const halfHeight = Math.floor(state.height / 2);

  clearRegion(1, halfHeight, width, halfHeight + 1);
}

function clearScreen() {
  cursorTo(0, 0);
  readline.clearScreenDown(process.stdout);
}

// game logic

process.stdin.on('keypress', (str, key) => {
  const { name } = key;
  const { ball, paddle } = state;

  switch (name) {
    case 'q':
      clearScreen();
      process.exit();
      break;
    case 'r':
      clearRegion(ball.x, ball.y, ball.x + 1, ball.y + 1);

      state = JSON.parse(JSON.stringify(initialState));

      drawBlocks(state);
      drawLives(state);
      break;
    case 'p':
      if (state.isRunning) {
        state.isPaused = !state.isPaused;

        if (!state.isPaused) {
          clearMessageArea(state);

          return;
        }

        state.activeMessage = 'Paused';
      }
      break;
    case 'h':
    case 'left':
      if (!state.isPaused && paddle.x > 1) {
        paddle.x -= paddle.speed;
      }
      break;
    case 'l':
    case 'right':
      if (!state.isPaused && paddle.x + paddle.width < state.width) {
        paddle.x += paddle.speed;
      }
      break;
    case 'space':
      if (!state.isRunning && state.lives > 0 && state.blocks.remaining > 0) {
        if (state.lives === initialState.lives) {
          clearMessageArea(state);
        }

        state.isRunning = true;
      }
      break;
  }
});

drawBackground(state);
drawBlocks(state);
drawPaddle(state);
drawBall(state);

setInterval(() => {
  if (state.activeMessage !== undefined) {
    drawMessage(state.activeMessage);
    state.activeMessage = undefined;
  }

  if (state.isPaused) {
    return;
  }

  const { blocks, ball, paddle } = state;

  const ballPrevX = ball.x;
  const ballPrevY = ball.y;

  if (state.isRunning) {
    // ceiling bounce
    if (ball.y <= 0) {
      ball.direction.y = 1;
    } else if (ball.y >= state.height - 1) {
      // paddle miss
      if (ball.x < paddle.x - 1 || ball.x > paddle.x + paddle.width) {
        state.isRunning = false;
        state.lives -= 1;

        drawLives(state);

        // game over
        if (state.lives < 1) {
          state.activeMessage = 'Game Over!';
        }
      } else {
        // paddle bounce
        ball.direction.y = -1;
      }
    }

    // wall bounce
    if (ball.x <= 1 || ball.x >= state.width - 1) {
      ball.direction.x *= -1;
    }

    let hasCollision;

    // block collisions
    do {
      hasCollision = false;

      const rowIndexes = [
        ball.y - blocks.yOffset,
        (ball.y + (ball.speed * ball.direction.y)) - blocks.yOffset,
      ];

      for (let i = 0; i < rowIndexes.length; i++) {
        const ballNextX = ball.x + (ball.speed * ball.direction.x);
        const row = blocks.map[rowIndexes[i]];
        const colIndex = Math.floor((ballNextX - blocks.xOffset) / blocks.symbol.length);

        if (row !== undefined && row[colIndex] === 1) {
          ball.direction[i === 0 ? 'x' : 'y'] *= -1;

          row[colIndex] = 0;
          blocks.remaining--;

          // clear collided block
          const { length } = blocks.symbol;
          const x = blocks.xOffset + (colIndex * length);
          const y = blocks.yOffset + rowIndexes[i];

          clearRegion(x, y, x + length, y + 1);

          hasCollision = true;
        }
      }
    } while (hasCollision);

    ball.y += ball.speed * ball.direction.y;
    ball.x += ball.speed * ball.direction.x;
  } else {
    ball.y = paddle.y - 1;
    ball.x = paddle.x + Math.floor(paddle.width / 2) + (1 * ball.direction.x);
  }

  if (!state.hardMode && blocks.remaining <= halfBlockCount) {
    paddle.width /= 2;
    state.hardMode = true;
  }

  if (blocks.remaining <= 0) {
    state.isRunning = false;
    state.activeMessage = 'WINNER!';

    ball.x = ballPrevX;
    ball.y = ballPrevY;
  } else {
    // clear paddle line
    clearRegion(0, state.height, state.width + 1, state.height + 1);
    drawPaddle(state);

    // clear previous ball position
    clearRegion(ballPrevX, ballPrevY, ballPrevX + 1, ballPrevY + 1);
    drawBall(state);
  }

  readline.cursorTo(process.stdout, state.width + 1, 0);
}, 128);
