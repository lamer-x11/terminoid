# Terminoid

A tiny, Breakout-like game for the terminal.

## Features and limitations

This is a toy made for fun. The game loop is handled by `setInterval` and is left on a slow refresh rate to compensate for the default input handling so be prepared to peck at those arrow keys :)

Even though 'Terminoid' is a play on the name Arkanoid, the game shares no features with it other than bouncing the ball and clearing blocks. There are no power-ups and only one level. The game ends when all blocks are cleared or there are no lives left.

## Usage

```bash
$ ./terminoid.js
```
or

```bash
$ docker build -t terminoid .
$ docker run -ti -v $(pwd):/workdir terminoid
```
## Keyboard controls

- movement: `Arrow keys`
- restart: `r`
- quit: `q`
- pause: `p`
- launch:  `space`

## Example

![Example](https://github.com/lamer-x11/examples/raw/master/terminoid.gif)
