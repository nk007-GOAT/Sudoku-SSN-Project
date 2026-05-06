/**
 * Sudoku Engine Logic
 * Ported and enhanced from C implementation
 */

export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export const SIZE = 9;

export interface SudokuState {
  grid: number[][];
  fixed: boolean[][]; // To track which cells were part of the original puzzle
  solution: number[][];
}

// Check if a number is valid in a specific cell
export const isValid = (grid: number[][], row: number, col: number, num: number): boolean => {
  for (let i = 0; i < SIZE; i++) {
    if (grid[row][i] === num) return false;
    if (grid[i][col] === num) return false;
  }

  const startRow = Math.floor(row / 3) * 3;
  const startCol = Math.floor(col / 3) * 3;

  for (let i = startRow; i < startRow + 3; i++) {
    for (let j = startCol; j < startCol + 3; j++) {
      if (grid[i][j] === num) return false;
    }
  }

  return true;
};

// Find empty cell
const findEmpty = (grid: number[][]): [number, number] | null => {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (grid[r][c] === 0) return [r, c];
    }
  }
  return null;
};

// Backtracking Solver
export const solveSudoku = (grid: number[][], randomize: boolean = false): boolean => {
  const empty = findEmpty(grid);
  if (!empty) return true;

  const [row, col] = empty;
  const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  
  if (randomize) {
    for (let i = nums.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [nums[i], nums[j]] = [nums[j], nums[i]];
    }
  }

  for (const num of nums) {
    if (isValid(grid, row, col, num)) {
      grid[row][col] = num;
      if (solveSudoku(grid, randomize)) return true;
      grid[row][col] = 0;
    }
  }

  return false;
};

// Puzzle Generator
export const generatePuzzle = (difficulty: Difficulty): SudokuState => {
  const grid = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
  
  // 1. Generate full solved grid
  solveSudoku(grid, true);
  
  // 2. Clone for solution
  const solution = grid.map(row => [...row]);
  
  // 3. Remove cells based on difficulty
  let removeCount = 0;
  if (difficulty === 'Easy') removeCount = 35;
  else if (difficulty === 'Medium') removeCount = 45;
  else removeCount = 55;

  const puzzleGrid = grid.map(row => [...row]);
  const fixed = Array.from({ length: SIZE }, () => Array(SIZE).fill(false));

  while (removeCount > 0) {
    const r = Math.floor(Math.random() * SIZE);
    const c = Math.floor(Math.random() * SIZE);
    if (puzzleGrid[r][c] !== 0) {
      puzzleGrid[r][c] = 0;
      removeCount--;
    }
  }

  // Mark fixed cells
  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE; j++) {
      if (puzzleGrid[i][j] !== 0) fixed[i][j] = true;
    }
  }

  return { grid: puzzleGrid, fixed, solution };
};

// Get a hint (find one correct empty cell)
export const getHint = (currentGrid: number[][], solution: number[][]): { row: number, col: number, val: number } | null => {
  const emptyCells: [number, number][] = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (currentGrid[r][c] === 0) {
        emptyCells.push([r, c]);
      }
    }
  }

  if (emptyCells.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * emptyCells.length);
  const [row, col] = emptyCells[randomIndex];
  return { row, col, val: solution[row][col] };
};
