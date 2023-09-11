# Tetris-Basic-Game-2102

# Classic Tetris Game with Functional Reactive Programming (FRP)

This project is a Classic Tetris game implemented using Functional Reactive Programming (FRP) techniques. The programs are written in TypeScript and use RxJS Observable streams to handle asynchronous and event-driven programming.

## Tools Used

- **TypeScript**: The code is written in TypeScript, a statically typed superset of JavaScript.
- **RxJS**: RxJS is used for handling asynchronous and event-driven programming. It makes use of observables and operators to manage game events and state changes.
- **SVG (Scalable Vector Graphics)**: SVG elements are used to render the game's visuals on an HTML canvas.

## Skills Demonstrated

- **Functional Programming**: The code demonstrates functional programming principles by using functions and operators provided by RxJS to manipulate and transform data streams (observables).
- **State Management**: It effectively manages the game state, including the game board, current and next blocks, score, and game over conditions. The state is updated reactively based on user input and timer events.
- **Event Handling**: User input events (keyboard events) are handled using RxJS's `fromEvent` function, allowing for reactive event handling.
- **Animation**: The code simulates animation by regularly updating the game state at a fixed tick rate using RxJS's `interval` operator.
- **DOM Manipulation**: It interacts with the Document Object Model (DOM) by creating, modifying, and updating SVG elements to render the game graphics.
- **Randomization**: The code generates random block shapes for the game, demonstrating randomization techniques.
- **Collision Detection**: It checks for collisions between game elements (e.g., blocks) and handles them accordingly.
- **Game Logic**: The code implements game logic, including scoring, level progression, and game over conditions.
- **Restart Functionality**: It allows the player to restart the game by pressing the "R" key when the game is over.
- **High Score Tracking**: The code keeps track of the player's high score.
- **Error Handling**: It handles errors in user input gracefully, filtering only relevant keyboard events.
- **Observable Composition**: It composes multiple observables (user input and timer events) using RxJS's `merge` operator to create a single stream of events.
- **Documentation**: The code includes comments and documentation to explain its functionality and purpose.

## Usage


1. Extract zip
2. Navigate into the folder
3. Execute npm install
4. Execute npm run dev
5. Open http://localhost:5173 in a browser


