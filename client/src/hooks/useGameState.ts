import { useState, useCallback } from 'react';
import { GameRoom, Player, GameState } from '../types/game';
import { generateTambolaTicket, checkRowCompletion, checkFullHouse } from '../utils/ticketGenerator';

export function useGameState() {
  const [gameState, setGameState] = useState<GameState>({
    currentRoom: null,
    currentPlayer: null,
    isHost: false
  });

  const createRoom = useCallback((hostName: string) => {
    const roomCode = Math.random().toString(36).substr(2, 6).toUpperCase();
    const hostId = Math.random().toString(36).substr(2, 9);
    
    const hostPlayer: Player = {
      id: hostId,
      name: hostName,
      ticket: generateTambolaTicket(),
      markedNumbers: new Set(),
      completedRows: [false, false, false],
      hasFirstRow: false,
      hasSecondRow: false,
      hasThirdRow: false,
      hasFullHouse: false,
      score: 0
    };

    const room: GameRoom = {
      id: Math.random().toString(36).substr(2, 9),
      code: roomCode,
      hostId,
      players: [hostPlayer],
      currentNumber: null,
      calledNumbers: [],
      gameStarted: false,
      gameEnded: false,
      winners: {}
    };

    setGameState({
      currentRoom: room,
      currentPlayer: hostPlayer,
      isHost: true
    });

    return room;
  }, []);

  const joinRoom = useCallback((roomCode: string, playerName: string) => {
    // Simulate joining - in real implementation, this would connect via Socket.io
    const playerId = Math.random().toString(36).substr(2, 9);
    
    const player: Player = {
      id: playerId,
      name: playerName,
      ticket: generateTambolaTicket(),
      markedNumbers: new Set(),
      completedRows: [false, false, false],
      hasFirstRow: false,
      hasSecondRow: false,
      hasThirdRow: false,
      hasFullHouse: false,
      score: 0
    };

    // For demo purposes, create a mock room
    const room: GameRoom = {
      id: Math.random().toString(36).substr(2, 9),
      code: roomCode,
      hostId: 'mock-host',
      players: [player],
      currentNumber: null,
      calledNumbers: [],
      gameStarted: false,
      gameEnded: false,
      winners: {}
    };

    setGameState({
      currentRoom: room,
      currentPlayer: player,
      isHost: false
    });

    return room;
  }, []);

  const startGame = useCallback(() => {
    if (!gameState.currentRoom) return;

    setGameState(prev => ({
      ...prev,
      currentRoom: prev.currentRoom ? {
        ...prev.currentRoom,
        gameStarted: true
      } : null
    }));
  }, [gameState.currentRoom]);

  const callNumber = useCallback(() => {
    if (!gameState.currentRoom || !gameState.isHost) return null;

    const availableNumbers = Array.from({length: 90}, (_, i) => i + 1)
      .filter(num => !gameState.currentRoom!.calledNumbers.includes(num));

    if (availableNumbers.length === 0) return null;

    const randomIndex = Math.floor(Math.random() * availableNumbers.length);
    const calledNumber = availableNumbers[randomIndex];

    setGameState(prev => ({
      ...prev,
      currentRoom: prev.currentRoom ? {
        ...prev.currentRoom,
        currentNumber: calledNumber,
        calledNumbers: [...prev.currentRoom.calledNumbers, calledNumber]
      } : null
    }));

    return calledNumber;
  }, [gameState.currentRoom, gameState.isHost]);

  const markNumber = useCallback((number: number) => {
    if (!gameState.currentRoom || !gameState.currentPlayer) return;

    const updatedMarkedNumbers = new Set(gameState.currentPlayer.markedNumbers);
    if (gameState.currentRoom.calledNumbers.includes(number)) {
      updatedMarkedNumbers.add(number);
    }

    const completedRows = checkRowCompletion(gameState.currentPlayer.ticket, updatedMarkedNumbers);
    const isFullHouse = checkFullHouse(gameState.currentPlayer.ticket, updatedMarkedNumbers);

    const updatedPlayer: Player = {
      ...gameState.currentPlayer,
      markedNumbers: updatedMarkedNumbers,
      completedRows,
      hasFirstRow: completedRows[0],
      hasSecondRow: completedRows[1],
      hasThirdRow: completedRows[2],
      hasFullHouse: isFullHouse
    };

    setGameState(prev => ({
      ...prev,
      currentPlayer: updatedPlayer,
      currentRoom: prev.currentRoom ? {
        ...prev.currentRoom,
        players: prev.currentRoom.players.map(p => 
          p.id === updatedPlayer.id ? updatedPlayer : p
        )
      } : null
    }));
  }, [gameState.currentRoom, gameState.currentPlayer]);

  const leaveRoom = useCallback(() => {
    setGameState({
      currentRoom: null,
      currentPlayer: null,
      isHost: false
    });
  }, []);

  return {
    gameState,
    createRoom,
    joinRoom,
    startGame,
    callNumber,
    markNumber,
    leaveRoom
  };
}