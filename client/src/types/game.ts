export interface Player {
  id: string;
  name: string;
  ticket: TambolaTicket;
  markedNumbers: Set<number>;
  completedRows: boolean[];
  hasFirstRow: boolean;
  hasSecondRow: boolean;
  hasThirdRow: boolean;
  hasFullHouse: boolean;
  score: number;
}

export interface TambolaTicket {
  id: string;
  grid: (number | null)[][];
}

export interface GameRoom {
  id: string;
  code: string;
  hostId: string;
  players: Player[];
  currentNumber: number | null;
  calledNumbers: number[];
  gameStarted: boolean;
  gameEnded: boolean;
  winners: {
    firstRow?: Player;
    secondRow?: Player;
    thirdRow?: Player;
    fullHouse?: Player;
  };
}

export interface GameState {
  currentRoom: GameRoom | null;
  currentPlayer: Player | null;
  isHost: boolean;
}

export type GameStatus = 'lobby' | 'playing' | 'ended';