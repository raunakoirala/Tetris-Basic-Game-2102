/**
 * Inside this file you will use the classes and functions from rx.js
 * to add visuals to the svg element in index.html, animate them, and make them interactive.
 *
 * Study and complete the tasks in observable exercises first to get ideas.
 *
 * Course Notes showing Asteroids in FRP: https://tgdwyer.github.io/asteroids/
 *
 * You will be marked on your functional programming style
 * as well as the functionality that you implement.
 *
 * Document your code!
 */

import "./style.css";

import { fromEvent, interval, merge } from "rxjs";
import { map, filter, scan } from "rxjs/operators";

/** Constants */

const Viewport = {
  CANVAS_WIDTH: 200,
  CANVAS_HEIGHT: 400,
  PREVIEW_WIDTH: 160,
  PREVIEW_HEIGHT: 80,
} as const;

const Constants = {
  TICK_RATE_MS: 500,
  GRID_WIDTH: 10,
  GRID_HEIGHT: 20,
} as const;

const Block = {
  WIDTH: Viewport.CANVAS_WIDTH / Constants.GRID_WIDTH,
  HEIGHT: Viewport.CANVAS_HEIGHT / Constants.GRID_HEIGHT,
};

/** User input */

type Key = "KeyS" | "KeyA" | "KeyD";

type Event = "keydown" | "keyup" | "keypress";

/** Utility functions */

/** State processing */

type Block = {
  shape: number[][];
  x: number;
  y: number;
};

const createRandomBlock = (): Block => {
  // Define different block shapes
  const blockTypes = [
    // Square block
    [[1, 1], [1, 1]],
    
    // Line block
    [[1, 1, 1, 1]],
    
    // T block
    [[0, 1, 0], [1, 1, 1]],
    
    // L block
    [[1, 0], [1, 0], [1, 1]],
    
    // J block
    [[0, 1], [0, 1], [1, 1]],
    
    // S block
    [[0, 1, 1], [1, 1, 0]],
    
    // Z block
    [[1, 1, 0], [0, 1, 1]],
  ];

  // Randomly select a block shape
  const randomBlockType =
    blockTypes[Math.floor(Math.random() * blockTypes.length)];

  // Randomly select an initial x position within the grid's width
  const randomX = Math.floor(Math.random() * (Constants.GRID_WIDTH - randomBlockType[0].length + 1));

  // Create a Block object with the selected shape and random x position
  return {
    shape: randomBlockType,
    x: randomX,
    y: 0, // Initial y position (top of the game board)
  };
};

type State = Readonly<{
  gameEnd: boolean;
  gameBoard: number[][];
  currentBlock: Block;
  nextBlock: Block;
  nextBlockShape: number[][];
  score: number;
  canRestart: boolean;
  highScore: number;
  level: number;
}>;

const initialState: State = {
  gameEnd: false,
  gameBoard: Array.from({ length: Constants.GRID_HEIGHT }, () =>
    Array(Constants.GRID_WIDTH).fill(0)
  ),
  currentBlock: createRandomBlock(),
  nextBlock: createRandomBlock(),
  nextBlockShape: [],
  score: 0,
  canRestart: false,
  highScore: 0,
  level: 1
};

/**
 * Checks if a move is valid for the current block.
 *
 * @param s Current state
 * @param deltaX Change in x position
 * @param deltaY Change in y position
 * @returns True if the move is valid, false otherwise
 */
const isValidMove = (s: State, deltaX: number, deltaY: number): boolean => {
  const { gameBoard, currentBlock } = s;
  const { shape, x, y } = currentBlock;

  return shape.every((row, rowIndex) =>
    row.every((cell, colIndex) => {
      if (cell === 1) {
        const boardX = x + colIndex + deltaX;
        const boardY = y + rowIndex + deltaY;

        return (
          boardX >= 0 &&
          boardX < Constants.GRID_WIDTH &&
          boardY < Constants.GRID_HEIGHT &&
          (boardY < 0 || gameBoard[boardY][boardX] === 0)
        );
      }
      return true; // Ignore cells with a value of 0
    })
  );
};

/**
 * Stacks the current block onto the game board.
 *
 * @param gameBoard The current game board
 * @param currentBlock The current block to stack
 * @param state The current state
 */
const stackBlock = (gameBoard: number[][], currentBlock: Block, state: State) => {
  const { shape, x, y } = currentBlock;
  const newState = { ...state };

  shape.forEach((row, rowIdx) => {
    row.forEach((cell, colIdx) => {
      if (cell === 1) {
        const boardX = x + colIdx;
        const boardY = y + rowIdx;

        // Update the game board to mark the cell as occupied
        if (boardY >= 0) {
          gameBoard[boardY][boardX] = 1;
        }
      }
    });
  });

  // Increment the score
  newState.score += 1;

  return newState;
};

/**
 * Checks if the game is over (top row is filled with blocks).
 *
 * @param gameBoard The current game board
 * @returns True if the game is over, false otherwise
 */
const isGameOver = (gameBoard: number[][]): boolean => {
  return gameBoard[0].some((cell) => cell === 1);
};

/**
 * Updates the state by proceeding with one time step.
 *
 * @param s Current state
 * @returns Updated state
 */
const tick = (s: State) => {
  if (s.gameEnd) {
    return s; // Game has already ended, no need to proceed
  }

  // Move the current block down by one cell
  const updatedBlock: Block = { ...s.currentBlock };
  updatedBlock.y++;

  // Check for collisions (with other blocks or the bottom of the game board)
  if (!isValidMove(s, 0, 1)) {
    // If collision detected, stack the current block onto the game board
    stackBlock(s.gameBoard, s.currentBlock, s);

    // Check for the end game condition (top row filled)
    const gameEnd = isGameOver(s.gameBoard);

    const newBlock = createRandomBlock();
    const newNextBlock = createRandomBlock(); // Generate a new next block

    // Update the state accordingly
    return {
      ...s,
      currentBlock: newBlock,
      nextBlock: newNextBlock, // Update the nextBlock property
      nextBlockShape: newNextBlock.shape, // Update the nextBlockShape
      gameEnd,
    };
  }

  return {
    ...s,
    currentBlock: updatedBlock,
  };
};

/**
 * Displays an SVG element on the canvas. Brings to foreground.
 * @param elem SVG element to display
 * @param svg The parent SVG element
 */
const show = (elem: SVGGraphicsElement, svg: SVGGraphicsElement) => {
  if (!elem.parentNode) {
    // Check if the element is not already part of the SVG
    elem.setAttribute("visibility", "visible");
    svg.appendChild(elem);
  }
};

/**
 * Hides an SVG element on the canvas.
 * @param elem SVG element to hide
 */
const hide = (elem: SVGGraphicsElement) =>
  elem.setAttribute("visibility", "hidden");

/**
 * Creates an SVG element with the given properties.
 *
 * See https://developer.mozilla.org/en-US/docs/Web/SVG/Element for valid
 * element names and properties.
 *
 * @param namespace Namespace of the SVG element
 * @param name SVGElement name
 * @param props Properties to set on the SVG element
 * @returns SVG element
 */
const createSvgElement = (
  namespace: string | null,
  name: string,
  props: Record<string, string> = {}
) => {
  const elem = document.createElementNS(namespace, name) as SVGElement;
  Object.entries(props).forEach(([k, v]) => elem.setAttribute(k, v));
  return elem;
};

/**
 * Renders the current game board to the canvas.
 *
 * @param s Current state
 */
const renderGameBoard = (s: State, svg: SVGGraphicsElement) => {
  // Clear the game board canvas
  Array.from({ length: Constants.GRID_HEIGHT }, (_, y) => {
    Array.from({ length: Constants.GRID_WIDTH }, (_, x) => {
      // Check if the cell is occupied and render it accordingly
      if (s.gameBoard[y][x] === 1) {
        // Render an occupied cell at (x, y)
        const cell = createSvgElement(svg.namespaceURI, "rect", {
          height: `${Block.HEIGHT}`,
          width: `${Block.WIDTH}`,
          x: `${x * Block.WIDTH}`,
          y: `${y * Block.HEIGHT}`,
          style: "fill: green",
        });
        svg.appendChild(cell);
      }
    });
  });
};

/**
 * Renders the current block to the canvas.
 *
 * @param s Current state
 */
const renderCurrentBlock = (s: State, svg: SVGGraphicsElement) => {
  const { currentBlock } = s;

  currentBlock.shape.forEach((row, y) => {
    row.forEach((cell, x) => {
      // Check if the cell is occupied and render it accordingly
      if (cell === 1) {
        // Render an occupied cell at (x + currentBlock.x, y + currentBlock.y)
        const cellElem = createSvgElement(svg.namespaceURI, "rect", {
          height: `${Block.HEIGHT}`,
          width: `${Block.WIDTH}`,
          x: `${(x + currentBlock.x) * Block.WIDTH}`,
          y: `${(y + currentBlock.y) * Block.HEIGHT}`,
          style: "fill: green",
        });
        svg.appendChild(cellElem);
      }
    });
  });
};

/**
 * Renders the next shape to the canvas.
 *
 * @param nextShape The shape to be rendered
 * @param previewSvg The SVG graphics element for the preview
 */
const renderNextShape = (nextShape: number[][], previewSvg: SVGGraphicsElement) => {
  // Clear the preview canvas
  previewSvg.innerHTML = "";

  // Calculate the factor to make the blocks smaller
  const scaleFactor = 0.5; // Adjust this value to make the blocks smaller or larger

  // Calculate the width and height of each block in the preview
  const previewBlockWidth = (Viewport.PREVIEW_WIDTH / nextShape[0].length) * scaleFactor;
  const previewBlockHeight = (Viewport.PREVIEW_HEIGHT / nextShape.length) * scaleFactor;

  // Calculate the centering offset for both x and y
  const xOffset = (Viewport.PREVIEW_WIDTH - (nextShape[0].length * previewBlockWidth)) / 2;
  const yOffset = (Viewport.PREVIEW_HEIGHT - (nextShape.length * previewBlockHeight)) / 2;

  nextShape.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      if (cell === 1) {
        // Calculate the position with the centering offset
        const x = colIndex * previewBlockWidth + xOffset;
        const y = rowIndex * previewBlockHeight + yOffset;

        // Render an occupied cell in the preview canvas
        const cellElem = createSvgElement(previewSvg.namespaceURI, "rect", {
          height: `${previewBlockHeight}`,
          width: `${previewBlockWidth}`,
          x: `${x}`,
          y: `${y}`,
          style: "fill: green",
        });
        previewSvg.appendChild(cellElem);
      }
    });
  });
};

/**
 * Renders the entire game to the canvas.
 *
 * In MVC terms, this updates the View using the Model.
 *
 * @param s Current state
 */
const render = (s: State, svg: SVGGraphicsElement, gameover: SVGGraphicsElement, previewSvg: SVGGraphicsElement) => {
  // Clear the canvas
  svg.innerHTML = "";

  renderGameBoard(s, svg);
  renderCurrentBlock(s, svg);

  // Update the score label
  const scoreTextElement = document.querySelector("#scoreText") as HTMLElement;
  scoreTextElement.textContent = `${s.score}`;

  // Render the next shape in the preview canvas
  renderNextShape(s.nextBlockShape, previewSvg);

  // Update the high score label
  const highScoreTextElement = document.querySelector("#highScoreText") as HTMLElement;
  highScoreTextElement.textContent = `${s.highScore}`;

  // Update the HTML to display the current level
  const levelTextElement = document.querySelector("#levelText") as HTMLElement;
  levelTextElement.textContent = `${s.level}`;

  // Update the visibility of the "gameOver" element
  const gameOverElement = document.querySelector("#gameOver") as SVGGraphicsElement;
  if (s.gameEnd) {
    show(gameover, svg); // Show the game over message
    gameOverElement.setAttribute("visibility", "visible"); // Set visibility to "visible"
  } else {
    hide(gameover); // Hide the game over message
    gameOverElement.setAttribute("visibility", "hidden"); // Set visibility to "hidden"
  }
};

/**
 * This is the function called on page load. Your main game loop
 * should be called here.
 */
export function main() {
  // Canvas elements
  const svg = document.querySelector("#svgCanvas") as SVGGraphicsElement &
    HTMLElement;
  const preview = document.querySelector("#svgPreview") as SVGGraphicsElement &
    HTMLElement;
  const gameover = document.querySelector("#gameOver") as SVGGraphicsElement &
    HTMLElement; // Define the gameover element here
  const container = document.querySelector("#main") as HTMLElement;

  svg.setAttribute("height", `${Viewport.CANVAS_HEIGHT}`);
  svg.setAttribute("width", `${Viewport.CANVAS_WIDTH}`);
  preview.setAttribute("height", `${Viewport.PREVIEW_HEIGHT}`);
  preview.setAttribute("width", `${Viewport.PREVIEW_WIDTH}`);

  // Text fields
  const levelText = document.querySelector("#levelText") as HTMLElement;
  const scoreText = document.querySelector("#scoreText") as HTMLElement;
  const highScoreText = document.querySelector("#highScoreText") as HTMLElement;

  // Initialize the game state with the next block shape
  const initialStateWithNextShape: State = {
    ...initialState,
    nextBlockShape: initialState.nextBlock.shape,
  };

  renderNextShape(initialState.nextBlock.shape, preview);

  // User input
  const key$ = fromEvent<KeyboardEvent>(document, "keydown").pipe(
    filter(
      (event) =>
        event.code === "KeyA" ||
        event.code === "KeyD" ||
        event.code === "KeyS" ||
        event.code === "KeyR"
    )
  );

  // Observables
  const restartGame = (): State => {
    return {
      ...initialStateWithNextShape,
      gameBoard: Array.from({ length: Constants.GRID_HEIGHT }, () =>
        Array(Constants.GRID_WIDTH).fill(0)
      ),
    };
  };
  
  const tick$ = interval(Constants.TICK_RATE_MS);

  const source$ = merge(key$, tick$).pipe(
    scan((state: State, event: KeyboardEvent | number) => {
      if (event instanceof KeyboardEvent) {
        // Handle the keyboard events (left, right, down)
        if (event.code === "KeyA") {
          // Move the block left if it's a left key press
          if (isValidMove(state, -1, 0)) {
            state.currentBlock.x -= 1;
          }
        } else if (event.code === "KeyD") {
          // Move the block right if it's a right key press
          if (isValidMove(state, 1, 0)) {
            state.currentBlock.x += 1;
          }
        } else if (event.code === "KeyS") {
          // Move the block down if it's a down key press
          if (isValidMove(state, 0, 1)) {
            state.currentBlock.y += 1;
          }
        } else if (event.code === "KeyR") {
          // Restart the game when the "R" key is pressed
          if (state.canRestart) {
            const updatedHighScore = state.score > state.highScore ? state.score : state.highScore;
            // Only allow restart if canRestart is true
            if (state.gameEnd) {
              return {
                ...restartGame(),
                canRestart: false, // Disable restart until the game ends
                highScore: updatedHighScore, // Update the high score
              };
          }
          }
        }
      } else {
        // Handle the tick event (block falling)
        if (state.gameEnd) {
          return state; // Game has already ended, no need to proceed
        }
  
        // Move the current block down by one cell
        const updatedBlock: Block = { ...state.currentBlock };
        updatedBlock.y++;
  
        // Check for collisions (with other blocks or the bottom of the game board)
        if (!isValidMove(state, 0, 1)) {
          // If collision detected, stack the current block onto the game board
          stackBlock(state.gameBoard, state.currentBlock, state);
  
          // Check for the end game condition (top row filled)
          const gameEnd = isGameOver(state.gameBoard);
  

          if (!gameEnd) {
            state = { ...state, score: state.score + 1}; // Increment the score by 1 for landing a block
          }
  
          // Check and clear full rows
          state.gameBoard.slice().reverse().forEach((row, y) => {
            if (row.every((cell) => cell === 1)) {
              // Clear the full row
              state.gameBoard.splice(Constants.GRID_HEIGHT - 1 - y, 1);
              state.gameBoard.unshift(Array(Constants.GRID_WIDTH).fill(0));
              
              
              // Add 10 points to the score
              state = { ...state, score: state.score + 10};

              // Add a level
              state = { ...state, level: state.level + 1 }; 
            }
          });
  
          // Set the game over flag if needed
          if (gameEnd) {
            
            const updatedHighScore = state.score > state.highScore ? state.score : state.highScore;
  
            return {
              ...state,
              gameEnd,
              canRestart: true, // Allow restarting the game
              highScore: updatedHighScore, // Update the high score if it's beaten
            };
          }
  
          // Generate a new block and update the state
          const newBlock = state.nextBlock;
          const newNextBlock = createRandomBlock(); // Generate a new next block
  
          return {
            ...state,
            currentBlock: newBlock,
            nextBlock: newNextBlock, // Update the nextBlock property
            nextBlockShape: newNextBlock.shape // Update the nextBlockShape
          };
        }
  
        return {
          ...state,
          currentBlock: updatedBlock,
        };
      }
  
      return state;
    }, initialStateWithNextShape)
  );

  // Subscribe to the source$ observable and update the game state
  source$.subscribe({
    next: (state) => {
      render(state, svg, gameover, preview);
    },
  });
}



// The following simply runs your main function on   window load. Make sure to leave it in place.
if (typeof window !== "undefined") {
  window.onload = () => {
    main();
  };
}