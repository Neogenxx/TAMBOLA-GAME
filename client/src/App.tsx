import React, { useState, useEffect, useRef } from 'react';
import { HomePage } from './components/HomePage';
import { GameLobby } from './components/GameLobby';
import { GamePlay } from './components/GamePlay';
import { useGameState } from './hooks/useGameState';
import { VoiceAnnouncer } from './utils/voiceAnnouncer';
import { GameStatus } from './types/game';

function App() {
  const { gameState, createRoom, joinRoom, startGame, callNumber, markNumber, leaveRoom } = useGameState();
  const [gameStatus, setGameStatus] = useState<GameStatus>('lobby');
  const [error, setError] = useState<string>('');
  const voiceAnnouncer = useRef<VoiceAnnouncer | null>(null);

  useEffect(() => {
    // Initialize voice announcer
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      voiceAnnouncer.current = new VoiceAnnouncer();
    }

    return () => {
      if (voiceAnnouncer.current) {
        voiceAnnouncer.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    if (gameState.currentRoom) {
      setGameStatus(gameState.currentRoom.gameStarted ? 'playing' : 'lobby');
    } else {
      setGameStatus('lobby');
    }
  }, [gameState.currentRoom]);

  const handleCreateRoom = (hostName: string) => {
    createRoom(hostName);
  };

  const handleJoinRoom = (roomCode: string, playerName: string) => {
    try {
      setError('');
      joinRoom(roomCode, playerName);
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  };

  const handleStartGame = () => {
    startGame();
  };

  const handleCallNumber = () => {
    return callNumber();
  };

  const handleMarkNumber = (number: number) => {
    markNumber(number);
  };

  const handleLeaveRoom = () => {
    if (voiceAnnouncer.current) {
      voiceAnnouncer.current.stop();
    }
    leaveRoom();
    setGameStatus('lobby');
  };

  // No room - show home page
  if (!gameState.currentRoom) {
    return (
      <HomePage
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        error={error}
      />
    );
  }

  // Room exists but game not started - show lobby
  if (gameStatus === 'lobby') {
    return (
      <GameLobby
        room={gameState.currentRoom}
        currentPlayer={gameState.currentPlayer!}
        isHost={gameState.isHost}
        onStartGame={handleStartGame}
        onLeaveRoom={handleLeaveRoom}
      />
    );
  }

  // Game is playing - show gameplay
  return (
    <GamePlay
      room={gameState.currentRoom}
      currentPlayer={gameState.currentPlayer!}
      isHost={gameState.isHost}
      onCallNumber={handleCallNumber}
      onMarkNumber={handleMarkNumber}
      onLeaveRoom={handleLeaveRoom}
      voiceAnnouncer={voiceAnnouncer.current!}
    />
  );
}

export default App;
