// server/src/index.js  (ESM)
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
});

// In-memory rooms store and pending requests
const rooms = {}; // rooms[roomCode] = { id, code, hostId, players, ... }
const pendingJoinRequests = {}; // pendingJoinRequests[requesterId] = { roomCode, playerName, timeoutId }

// Configuration
const PENDING_REQUEST_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes
const MAX_NAME_LENGTH = 32;

function isValidName(name) {
  if (!name || typeof name !== 'string') return false;
  const trimmed = name.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_NAME_LENGTH) return false;
  // Basic allowlist: letters, numbers, spaces, -, _
  return /^[\w \-]+$/.test(trimmed);
}

function generateTicket() {
  // simple 15 unique numbers ticket (replace with your tambola layout)
  const nums = new Set();
  while (nums.size < 15) nums.add(Math.floor(Math.random() * 90) + 1);
  return Array.from(nums);
}

function broadcastRoom(roomCode) {
  const room = rooms[roomCode];
  if (!room) return;
  console.log('broadcastRoom ->', roomCode, {
    players: room.players.map(p => ({ id: p.id, name: p.name })),
    currentNumber: room.currentNumber,
    calledNumbersCount: room.calledNumbers.length,
    gameStarted: room.gameStarted
  });
  io.to(roomCode).emit('room-update', room);
}

function clearPendingRequest(requesterId, reason = null) {
  const pending = pendingJoinRequests[requesterId];
  if (!pending) return;
  if (pending.timeoutId) clearTimeout(pending.timeoutId);
  // Optionally notify requester that their request expired/was cleared
  try {
    const sock = io.sockets.sockets.get(requesterId);
    if (sock && reason) sock.emit('join-denied', reason);
  } catch (e) { /* ignore */ }
  delete pendingJoinRequests[requesterId];
}

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Create a new room
  socket.on('create-room', (hostNameRaw) => {
    try {
      const hostName = String(hostNameRaw || '').trim();
      if (!isValidName(hostName)) {
        socket.emit('error-message', 'Invalid host name');
        return;
      }

      const roomCode = Math.random().toString(36).substring(2, 7).toUpperCase();
      rooms[roomCode] = {
        id: roomCode,
        code: roomCode,
        hostId: socket.id,
        players: [{ id: socket.id, name: hostName, ticket: generateTicket(), markedNumbers: [] }],
        currentNumber: null,
        calledNumbers: [],
        gameStarted: false,
        gameEnded: false,
        winners: { firstRow: null, secondRow: null, thirdRow: null, fullHouse: null }
      };

      socket.join(roomCode);
      socket.emit('room-created', rooms[roomCode]);
      broadcastRoom(roomCode);
      console.log(`Room ${roomCode} created by ${socket.id} (${hostName})`);
    } catch (err) {
      console.error('create-room error', err);
      socket.emit('error-message', 'Server error creating room');
    }
  });

  // Player requests to join (host approval required)
  socket.on('request-join', (roomCodeRaw, playerNameRaw) => {
    try {
      const roomCode = String(roomCodeRaw || '').toUpperCase();
      const playerName = String(playerNameRaw || '').trim();

      if (!isValidName(playerName)) {
        socket.emit('error-message', 'Invalid player name');
        return;
      }

      const room = rooms[roomCode];
      if (!room) {
        socket.emit('error-message', 'Room not found');
        return;
      }
      if (room.gameStarted) {
        socket.emit('error-message', 'Game already started');
        return;
      }

      // If name already in use, reject early
      if (room.players.some(p => p.name.toLowerCase() === playerName.toLowerCase())) {
        socket.emit('error-message', 'A player with this name already exists');
        return;
      }

      // register pending request with timeout
      if (pendingJoinRequests[socket.id]) {
        // duplicate request from same socket - reset timeout
        clearPendingRequest(socket.id);
      }
      const timeoutId = setTimeout(() => {
        // expire pending request
        clearPendingRequest(socket.id, 'Join request expired');
      }, PENDING_REQUEST_TIMEOUT_MS);

      pendingJoinRequests[socket.id] = { roomCode, playerName, timeoutId };

      // notify the host only
      io.to(room.hostId).emit('join-request', {
        requesterId: socket.id,
        playerName,
        roomCode
      });

      // notify the requester that their request is pending
      socket.emit('request-pending', { roomCode, playerName, expiresInMs: PENDING_REQUEST_TIMEOUT_MS });
      console.log(`Pending join request ${socket.id} -> room ${roomCode} as ${playerName}`);
    } catch (err) {
      console.error('request-join error', err);
      socket.emit('error-message', 'Server error requesting join');
    }
  });

  // Host approves/rejects join requests
  socket.on('approve-join', ({ requesterId, approved }) => {
    try {
      const pending = pendingJoinRequests[requesterId];
      if (!pending) {
        socket.emit('error-message', 'No pending request found for that id');
        return;
      }
      const { roomCode, playerName } = pending;
      const room = rooms[roomCode];
      const requesterSocket = io.sockets.sockets.get(requesterId);

      // Only host can approve
      if (!room || room.hostId !== socket.id) {
        socket.emit('error-message', 'Only host can approve requests');
        clearPendingRequest(requesterId);
        return;
      }

      if (!requesterSocket) {
        socket.emit('error-message', 'Requester not connected');
        clearPendingRequest(requesterId);
        return;
      }

      if (approved) {
        // confirm name still available
        const nameExists = room.players.some(p => p.name.toLowerCase() === playerName.toLowerCase());
        if (nameExists) {
          requesterSocket.emit('join-denied', 'Name already in use');
          clearPendingRequest(requesterId);
          return;
        }
        const player = { id: requesterId, name: playerName, ticket: generateTicket(), markedNumbers: [] };
        room.players.push(player);
        requesterSocket.join(roomCode);
        requesterSocket.emit('join-approved', room);
        broadcastRoom(roomCode);
        console.log(`Host ${socket.id} approved ${requesterId} (${playerName}) into ${roomCode}`);
      } else {
        requesterSocket.emit('join-denied', 'Host rejected your request');
        console.log(`Host ${socket.id} rejected ${requesterId} (${playerName}) into ${roomCode}`);
      }

      clearPendingRequest(requesterId);
    } catch (err) {
      console.error('approve-join error', err);
      socket.emit('error-message', 'Server error approving join');
    }
  });

  // Host starts the game
  socket.on('start-game', (roomCodeRaw) => {
    try {
      const roomCode = String(roomCodeRaw || '').toUpperCase();
      const room = rooms[roomCode];
      if (room && room.hostId === socket.id) {
        room.gameStarted = true;
        broadcastRoom(roomCode);
      } else {
        socket.emit('error-message', 'Only host can start the game');
      }
    } catch (err) {
      console.error('start-game error', err);
      socket.emit('error-message', 'Server error starting game');
    }
  });

  // Host calls a number
  socket.on('call-number', (roomCodeRaw) => {
    try {
      const roomCode = String(roomCodeRaw || '').toUpperCase();
      const room = rooms[roomCode];
      if (room && room.hostId === socket.id) {
        if (room.calledNumbers.length >= 90) {
          socket.emit('error-message', 'All numbers exhausted');
          return;
        }
        let num;
        do { num = Math.floor(Math.random() * 90) + 1; }
        while (room.calledNumbers.includes(num));
        room.currentNumber = num;
        room.calledNumbers.push(num);
        broadcastRoom(roomCode);
      } else {
        socket.emit('error-message', 'Only host can call numbers');
      }
    } catch (err) {
      console.error('call-number error', err);
      socket.emit('error-message', 'Server error calling number');
    }
  });

  // Player marks number on their ticket
  socket.on('mark-number', (roomCodeRaw, number) => {
    try {
      const roomCode = String(roomCodeRaw || '').toUpperCase();
      const room = rooms[roomCode];
      if (!room) return;
      const player = room.players.find(p => p.id === socket.id);
      if (!player) return;
      if (player.ticket.includes(number)) {
        if (!player.markedNumbers.includes(number)) player.markedNumbers.push(number);
        // TODO: compute completed rows and winners here
        broadcastRoom(roomCode);
      } else {
        socket.emit('error-message', 'Number not on your ticket');
      }
    } catch (err) {
      console.error('mark-number error', err);
      socket.emit('error-message', 'Server error marking number');
    }
  });

  // Player leaves the room
  socket.on('leave-room', (roomCodeRaw) => {
    try {
      const roomCode = String(roomCodeRaw || '').toUpperCase();
      const room = rooms[roomCode];
      if (!room) return;
      room.players = room.players.filter(p => p.id !== socket.id);
      socket.leave(roomCode);

      // clean pending requests for this socket if any
      clearPendingRequest(socket.id);

      if (room.players.length === 0) {
        // clear pending requests belonging to this room
        for (const reqId of Object.keys(pendingJoinRequests)) {
          if (pendingJoinRequests[reqId].roomCode === roomCode) {
            const reqSock = io.sockets.sockets.get(reqId);
            if (reqSock) reqSock.emit('join-denied', 'Room closed');
            clearPendingRequest(reqId);
          }
        }
        delete rooms[roomCode];
        console.log(`Room ${roomCode} deleted because empty`);
      } else {
        if (room.hostId === socket.id) {
          room.hostId = room.players[0].id; // assign new host
          // optionally notify new host explicitly
          io.to(room.hostId).emit('host-permission');
        }
        broadcastRoom(roomCode);
      }
    } catch (err) {
      console.error('leave-room error', err);
      socket.emit('error-message', 'Server error leaving room');
    }
  });

  // Socket disconnected: remove them from rooms and clear pending requests
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);

    // remove any pending join request from this socket
    clearPendingRequest(socket.id);

    for (const rc of Object.keys(rooms)) {
      const room = rooms[rc];
      const idx = room.players.findIndex(p => p.id === socket.id);
      if (idx !== -1) {
        room.players.splice(idx, 1);

        // If room is empty, remove it and clear pending requests for that room
        if (room.players.length === 0) {
          for (const reqId of Object.keys(pendingJoinRequests)) {
            if (pendingJoinRequests[reqId].roomCode === rc) {
              const reqSock = io.sockets.sockets.get(reqId);
              if (reqSock) reqSock.emit('join-denied', 'Room closed');
              clearPendingRequest(reqId);
            }
          }
          delete rooms[rc];
          console.log(`Room ${rc} deleted after disconnect (empty)`);
        } else {
          // choose new host if needed
          if (room.hostId === socket.id) {
            room.hostId = room.players[0].id;
            io.to(room.hostId).emit('host-permission');
            console.log(`Host ${socket.id} left, new host is ${room.hostId} for room ${rc}`);
          }
          broadcastRoom(rc);
        }
      }
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
