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

  const createRoom = useCallback((hostName: string) => {
    setLastError(null);
    console.log('HOOK: createRoom', hostName);
    socket.emit('create-room', hostName);
  }, []);

  const joinRoom = useCallback((roomCode: string, playerName: string) => {
    setLastError(null);
    console.log('HOOK: request-join', roomCode, playerName, socket.id);
    socket.emit('request-join', roomCode.toUpperCase(), playerName);
  }, []);

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

  const approveJoin = useCallback((requesterId: string, approved: boolean) => {
    console.log('HOOK: approveJoin', requesterId, approved);
    socket.emit('approve-join', { requesterId, approved });
    setPendingJoinRequests(prev => prev.filter(p => p.requesterId !== requesterId));
  }, []);

  useEffect(() => {
    const handleRoomUpdate = (room: GameRoom) => {
      console.log('CLIENT: room-update', room);
      const me = room.players?.find(p => p.id === socket.id) || null;
      setGameState({ currentRoom: room, currentPlayer: me, isHost: room.hostId === socket.id });
    };

    const handleRoomCreated = (room: GameRoom) => {
      console.log('CLIENT: room-created', room);
      const me = room.players?.find(p => p.id === socket.id) || null;
      setGameState({ currentRoom: room, currentPlayer: me, isHost: room.hostId === socket.id });
    };

    const handleJoinApproved = (room: GameRoom) => {
      console.log('CLIENT: join-approved', room);
      const me = room.players?.find(p => p.id === socket.id) || null;
      setGameState({ currentRoom: room, currentPlayer: me, isHost: room.hostId === socket.id });
    };

    const handleJoinDenied = (msg: string) => {
      console.log('CLIENT: join-denied', msg);
      setLastError(msg || 'Join denied');
    };

    const handleJoinRequest = (payload: JoinRequest) => {
      console.log('CLIENT: join-request', payload);
      setPendingJoinRequests(prev => prev.some(p => p.requesterId === payload.requesterId) ? prev : [...prev, payload]);
    };

    const handleRequestPending = (payload: any) => {
      console.log('CLIENT: request-pending', payload);
    };

    const handleHostPerm = () => {
      console.log('CLIENT: host-permission');
      setGameState(gs => ({ ...gs, isHost: true }));
    };

    const handleError = (msg: string) => {
      console.log('CLIENT: error-message', msg);
      setLastError(msg || 'Server error');
    };

    socket.on('room-update', handleRoomUpdate);
    socket.on('room-created', handleRoomCreated);
    socket.on('join-approved', handleJoinApproved);
    socket.on('join-denied', handleJoinDenied);
    socket.on('join-request', handleJoinRequest);
    socket.on('request-pending', handleRequestPending);
    socket.on('host-permission', handleHostPerm);
    socket.on('error-message', handleError);

    return () => {
      socket.off('room-update', handleRoomUpdate);
      socket.off('room-created', handleRoomCreated);
      socket.off('join-approved', handleJoinApproved);
      socket.off('join-denied', handleJoinDenied);
      socket.off('join-request', handleJoinRequest);
      socket.off('request-pending', handleRequestPending);
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
