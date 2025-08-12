// client/src/hooks/useGameState.ts
import { useState, useCallback, useEffect } from 'react';
import socket from '../socket';
import { GameRoom, Player, GameState } from '../types/game';

type JoinRequest = { requesterId: string; playerName: string; roomCode: string };

export function useGameState() {
  const [gameState, setGameState] = useState<GameState>({
    currentRoom: null,
    currentPlayer: null,
    isHost: false
  });

  const [pendingJoinRequests, setPendingJoinRequests] = useState<JoinRequest[]>([]);
  const [lastError, setLastError] = useState<string | null>(null);

  // Host creates room
  const createRoom = useCallback((hostName: string) => {
    setLastError(null);
    socket.emit('create-room', hostName);
  }, []);

  // Player requests to join (goes to host for approval)
  const joinRoom = useCallback((roomCode: string, playerName: string) => {
    setLastError(null);
    socket.emit('request-join', roomCode.toUpperCase(), playerName);
  }, []);

  // Host actions
  const startGame = useCallback(() => {
    if (!gameState.currentRoom) return;
    socket.emit('start-game', gameState.currentRoom.code);
  }, [gameState.currentRoom]);

  const callNumber = useCallback(() => {
    if (!gameState.currentRoom) return;
    socket.emit('call-number', gameState.currentRoom.code);
  }, [gameState.currentRoom]);

  const markNumber = useCallback((number: number) => {
    if (!gameState.currentRoom) return;
    socket.emit('mark-number', gameState.currentRoom.code, number);
  }, [gameState.currentRoom]);

  const leaveRoom = useCallback(() => {
    if (!gameState.currentRoom) return;
    socket.emit('leave-room', gameState.currentRoom.code);
    setGameState({ currentRoom: null, currentPlayer: null, isHost: false });
    setPendingJoinRequests([]);
  }, [gameState.currentRoom]);

  // Host approves or rejects a join request
  const approveJoin = useCallback((requesterId: string, approved: boolean) => {
    socket.emit('approve-join', { requesterId, approved });
    setPendingJoinRequests(prev => prev.filter(r => r.requesterId !== requesterId));
  }, []);

  useEffect(() => {
    // ----- Handlers -----
    const handleRoomUpdate = (room: GameRoom) => {
      const me = room.players?.find(p => p.id === socket.id) || null;
      setGameState({
        currentRoom: room,
        currentPlayer: me,
        isHost: room.hostId === socket.id
      });
    };

    const handleRoomCreated = (room: GameRoom) => {
      const me = room.players?.find(p => p.id === socket.id) || null;
      setGameState({
        currentRoom: room,
        currentPlayer: me,
        isHost: room.hostId === socket.id
      });
    };

    const handleJoinApproved = (room: GameRoom) => {
      const me = room.players?.find(p => p.id === socket.id) || null;
      setGameState({
        currentRoom: room,
        currentPlayer: me,
        isHost: room.hostId === socket.id
      });
    };

    const handleJoinDenied = (msg: string) => {
      setLastError(msg || 'Join request denied by host');
    };

    const handleJoinRequest = (payload: JoinRequest) => {
      setPendingJoinRequests(prev => {
        if (prev.some(r => r.requesterId === payload.requesterId)) return prev;
        return [...prev, payload];
      });
    };

    const handleRoomPlayers = (players: Player[]) => {
      setGameState(prev => {
        const code = prev.currentRoom?.code ?? '';
        const id = prev.currentRoom?.id ?? '';
        const room: GameRoom = {
          id,
          code,
          hostId: players[0]?.id ?? '',
          players,
          currentNumber: prev.currentRoom?.currentNumber ?? null,
          calledNumbers: prev.currentRoom?.calledNumbers ?? [],
          gameStarted: prev.currentRoom?.gameStarted ?? false,
          gameEnded: prev.currentRoom?.gameEnded ?? false,
          winners: prev.currentRoom?.winners ?? {}
        };
        const me = players.find(p => p.id === socket.id) || null;
        return {
          currentRoom: room,
          currentPlayer: me,
          isHost: room.hostId === socket.id
        };
      });
    };

    const handleHostPerm = () => {
      setGameState(gs => ({ ...gs, isHost: true }));
    };

    const handleError = (msg: string) => {
      setLastError(msg || 'Server error');
    };

    // ----- Register listeners -----
    socket.on('room-update', handleRoomUpdate);
    socket.on('room-created', handleRoomCreated);
    socket.on('join-approved', handleJoinApproved);
    socket.on('join-denied', handleJoinDenied);
    socket.on('join-request', handleJoinRequest); // host only
    socket.on('request-pending', (payload) => {
      // optional UI feedback for requester
      console.log('join request pending', payload);
    });
    socket.on('room-players', handleRoomPlayers);
    socket.on('host-permission', handleHostPerm);
    socket.on('error-message', handleError);

    // cleanup
    return () => {
      socket.off('room-update', handleRoomUpdate);
      socket.off('room-created', handleRoomCreated);
      socket.off('join-approved', handleJoinApproved);
      socket.off('join-denied', handleJoinDenied);
      socket.off('join-request', handleJoinRequest);
      socket.off('request-pending');
      socket.off('room-players', handleRoomPlayers);
      socket.off('host-permission', handleHostPerm);
      socket.off('error-message', handleError);
    };
  }, []);

  return {
    gameState,
    createRoom,
    joinRoom,
    startGame,
    callNumber,
    markNumber,
    leaveRoom,
    pendingJoinRequests,
    approveJoin,
    lastError
  };
}
