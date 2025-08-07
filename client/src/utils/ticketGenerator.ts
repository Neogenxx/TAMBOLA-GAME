import { TambolaTicket } from '../types/game';

export function generateTambolaTicket(): TambolaTicket {
  // Initialize 9x3 grid with nulls
  const grid: (number | null)[][] = Array(3).fill(null).map(() => Array(9).fill(null));
  
  // Column ranges for Tambola
  const columnRanges = [
    [1, 9],    // Column 0: 1-9
    [10, 19],  // Column 1: 10-19
    [20, 29],  // Column 2: 20-29
    [30, 39],  // Column 3: 30-39
    [40, 49],  // Column 4: 40-49
    [50, 59],  // Column 5: 50-59
    [60, 69],  // Column 6: 60-69
    [70, 79],  // Column 7: 70-79
    [80, 90]   // Column 8: 80-90
  ];

  // For each row, select 5 columns randomly
  for (let row = 0; row < 3; row++) {
    const selectedColumns = getRandomColumns(9, 5);
    
    for (const col of selectedColumns) {
      const [min, max] = columnRanges[col];
      let number;
      do {
        number = Math.floor(Math.random() * (max - min + 1)) + min;
      } while (isNumberAlreadyUsed(grid, number));
      
      grid[row][col] = number;
    }
  }

  // Sort numbers in each column
  for (let col = 0; col < 9; col++) {
    const columnNumbers: number[] = [];
    for (let row = 0; row < 3; row++) {
      if (grid[row][col] !== null) {
        columnNumbers.push(grid[row][col] as number);
      }
    }
    columnNumbers.sort((a, b) => a - b);
    
    let numberIndex = 0;
    for (let row = 0; row < 3; row++) {
      if (grid[row][col] !== null) {
        grid[row][col] = columnNumbers[numberIndex++];
      }
    }
  }

  return {
    id: Math.random().toString(36).substr(2, 9),
    grid
  };
}

function getRandomColumns(total: number, count: number): number[] {
  const columns: number[] = [];
  while (columns.length < count) {
    const col = Math.floor(Math.random() * total);
    if (!columns.includes(col)) {
      columns.push(col);
    }
  }
  return columns.sort((a, b) => a - b);
}

function isNumberAlreadyUsed(grid: (number | null)[][], number: number): boolean {
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 9; col++) {
      if (grid[row][col] === number) {
        return true;
      }
    }
  }
  return false;
}

export function checkRowCompletion(ticket: TambolaTicket, markedNumbers: Set<number>): boolean[] {
  const completedRows: boolean[] = [];
  
  for (let row = 0; row < 3; row++) {
    let rowComplete = true;
    for (let col = 0; col < 9; col++) {
      const number = ticket.grid[row][col];
      if (number !== null && !markedNumbers.has(number)) {
        rowComplete = false;
        break;
      }
    }
    completedRows.push(rowComplete);
  }
  
  return completedRows;
}

export function checkFullHouse(ticket: TambolaTicket, markedNumbers: Set<number>): boolean {
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 9; col++) {
      const number = ticket.grid[row][col];
      if (number !== null && !markedNumbers.has(number)) {
        return false;
      }
    }
  }
  return true;
}