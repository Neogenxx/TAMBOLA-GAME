// server/src/index.js  (ESM)
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

// In-memory stores
const rooms = {}; // rooms[roomCode] = { id, code, hostId, players, ... }
const pendingJoinRequests = {}; // pendingJoinRequests[requesterId] = { roomCode, playerName, timeoutId }

const PENDING_REQUEST_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes
const MAX_NAME_LENGTH = 32;

function isValidName(name) {
  if (!name || typeof name !== 'string') return false;
  const t = name.trim();
  if (t.length === 0 || t.length > MAX_NAME_LENGTH) return false;
  return /^[\w \-]+$/.test(t);
}

function generateTicket() {
  // temporary simple 15 unique numbers ticket
  const s = new Set();
  while (s.size < 15) s.add(Math.floor(Math.random() * 90) + 1);
  return Array.from(s);
}

function broadcastRoom(roomCode) {
  const room = rooms[roomCode];
  if (!room) return;
  io.to(roomCode).emit('room-update', room);
}

function clearPendingRequest(requesterId, reason = null) {
  const pending = pendingJoinRequests[requesterId];
  if (!pending) return;
  if (pending.timeoutId) clearTimeout(pending.timeoutId);
  try {
    const sock = io.sockets.sockets.get(requesterId);
    if (sock && reason) sock.emit('join-denied', reason);
  } catch (e) {}
  delete pendingJoinRequests[requesterId];
}

/* Socket handlers */
io.on('connection', (socket) => {
  console.log('client connected', socket.id);

  socket.on('create-room', (hostNameRaw) => {
    try {
      const hostName = String(hostNameRaw || '').trim();
      if (!isValidName(hostName)) {
        socket.emit('error-message', 'Invalid host name');
        return;
      }
      const roomCode = Math.random().toString(36).substring(2,7).toUpperCase();
      rooms[roomCode] = {
        id: roomCode,
        code: roomCode,
        hostId: socket.id,
        players: [{ id: socket.id, name: hostName, ticket: generateTicket(), markedNumbers: [] }],
        currentNumber: null,
        calledNumbers: [],
        gameStarted: false,
        gameEnded: false,
        winners: {}
      };
      socket.join(roomCode);
      // notify creator and broadcast
      socket.emit('room-created', rooms[roomCode]);
      broadcastRoom(roomCode);
      console.log('room created', roomCode, 'by', socket.id);
    } catch (err) {
      console.error('create-room error', err);
      socket.emit('error-message', 'Server error creating room');
    }
  });

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
      if (room.players.some(p => p.name.toLowerCase() === playerName.toLowerCase())) {
        socket.emit('error-message', 'A player with this name already exists');
        return;
      }

      // register pending request with timeout
      if (pendingJoinRequests[socket.id]) clearPendingRequest(socket.id);
      const timeoutId = setTimeout(() => clearPendingRequest(socket.id, 'Join request expired'), PENDING_REQUEST_TIMEOUT_MS);
      pendingJoinRequests[socket.id] = { roomCode, playerName, timeoutId };

      // notify only the host
      io.to(room.hostId).emit('join-request', { requesterId: socket.id, playerName, roomCode });

      // notify requester that request is pending
      socket.emit('request-pending', { roomCode, playerName, expiresInMs: PENDING_REQUEST_TIMEOUT_MS });
      console.log('pending join', socket.id, '->', roomCode, playerName);
    } catch (err) {
      console.error('request-join error', err);
      socket.emit('error-message', 'Server error requesting join');
    }
  });

  socket.on('approve-join', ({ requesterId, approved }) => {
    try {
      const pending = pendingJoinRequests[requesterId];
      if (!pending) {
        socket.emit('error-message', 'No pending request found');
        return;
      }
      const { roomCode, playerName } = pending;
      const room = rooms[roomCode];
      const requesterSocket = io.sockets.sockets.get(requesterId);

      // only host can approve
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
        // double-check name not taken (race)
        if (room.players.some(p => p.name.toLowerCase() === playerName.toLowerCase())) {
          requesterSocket.emit('join-denied', 'Name already in use');
          clearPendingRequest(requesterId);
          return;
        }
        const player = { id: requesterId, name: playerName, ticket: generateTicket(), markedNumbers: [] };
        room.players.push(player);
        requesterSocket.join(roomCode);
        requesterSocket.emit('join-approved', room);
        broadcastRoom(roomCode);
        console.log('approved', requesterId, '->', roomCode);
      } else {
        requesterSocket.emit('join-denied', 'Host rejected your request');
        console.log('rejected', requesterId, '->', roomCode);
      }

      clearPendingRequest(requesterId);
    } catch (err) {
      console.error('approve-join error', err);
      socket.emit('error-message', 'Server error approving join');
    }
  });

  socket.on('start-game', (roomCodeRaw) => {
    try {
      const roomCode = String(roomCodeRaw || '').toUpperCase();
      const room = rooms[roomCode];
      if (room && room.hostId === socket.id) {
        room.gameStarted = true;
        broadcastRoom(roomCode);
      } else socket.emit('error-message', 'Only host can start game');
    } catch (err) {
      console.error('start-game error', err);
      socket.emit('error-message', 'Server error starting game');
    }
  });

  socket.on('call-number', (roomCodeRaw) => {
    try {
      const roomCode = String(roomCodeRaw || '').toUpperCase();
      const room = rooms[roomCode];
      if (room && room.hostId === socket.id) {
        if (!room.gameStarted) { socket.emit('error-message','Game not started'); return; }
        if (room.gameEnded) { socket.emit('error-message', 'Game already ended'); return; }
        if (!room.calledNumbers) room.calledNumbers = [];
        if (room.calledNumbers.length >= 90) { socket.emit('error-message', 'All numbers exhausted'); return; }
        let num;
        do { num = Math.floor(Math.random() * 90) + 1; } while (room.calledNumbers.includes(num));
        room.currentNumber = num;
        room.calledNumbers.push(num);
        broadcastRoom(roomCode);
      } else socket.emit('error-message', 'Only host can call numbers');
    } catch (err) {
      console.error('call-number error', err);
      socket.emit('error-message', 'Server error calling number');
    }
  });

  socket.on('mark-number', (roomCodeRaw, number) => {
    try {
      const roomCode = String(roomCodeRaw || '').trim().toUpperCase();
      const room = rooms[roomCode];
      if (!room) return;
      const player = room.players.find(p => p.id === socket.id);
      if (!player) return;
      if (!Number.isInteger(number)) return;
      // normalize ticket shape: if ticket is 3x9 grid or simple array
      const ticketNumbers = Array.isArray(player.ticket[0])
        ? player.ticket.flat().filter(n => n !== 0)
        : player.ticket;

      // must be on player's ticket
      if (!ticketNumbers.includes(number)) {
        socket.emit('error-message', 'Number not on your ticket');
        return;
      }
      // number must have been called
      if (!room.calledNumbers.includes(number)) {
        socket.emit('error-message', 'Number has not been called yet');
        return;
      }

      if (!player.marked) player.marked = [];
      if (player.marked.includes(number)) return;
      player.marked.push(number);
      broadcastRoom(roomCode);
    } catch (err) {
      console.error('mark-number handler error', err);
    }
  });

  socket.on('leave-room', (roomCodeRaw) => {
    try {
      const roomCode = String(roomCodeRaw || '').toUpperCase();
      const room = rooms[roomCode];
      if (!room) return;
      room.players = room.players.filter(p => p.id !== socket.id);
      socket.leave(roomCode);
      clearPendingRequest(socket.id);

      if (room.players.length === 0) {
        // notify and clear pending requests for this room
        for (const reqId of Object.keys(pendingJoinRequests)) {
          if (pendingJoinRequests[reqId].roomCode === roomCode) {
            const reqSock = io.sockets.sockets.get(reqId);
            if (reqSock) reqSock.emit('join-denied', 'Room closed');
            clearPendingRequest(reqId);
          }
        }
        delete rooms[roomCode];
      } else {
        if (room.hostId === socket.id) {
          room.hostId = room.players[0].id;
          io.to(room.hostId).emit('host-permission');
        }
        broadcastRoom(roomCode);
      }
    } catch (err) {
      console.error('leave-room error', err);
      socket.emit('error-message', 'Server error leaving room');
    }
  });

  socket.on('disconnect', () => {
    try {
      // 1) If this socket had an outstanding join request as the requester, clear it.
      clearPendingRequest(socket.id);

      // 2) If this socket was a host for any room(s), cancel pending requests for those room(s).
      //    This avoids leaving pending requests dangling after the host disappears.
      const hostRooms = Object.keys(rooms).filter(rc => rooms[rc].hostId === socket.id);
      if (hostRooms.length > 0) {
        for (const reqId in pendingJoinRequests) {
          const pending = pendingJoinRequests[reqId];
          if (pending && pending.roomCode && hostRooms.includes(pending.roomCode)) {
            clearPendingRequest(reqId, 'Host disconnected, request cancelled');
          }
        }
      }

      // 3) Remove this socket from any room player lists (original logic)
      for (const rc in rooms) {
        const room = rooms[rc];
        const oldLen = room.players.length;
        room.players = room.players.filter(p => p.id !== socket.id);
        if (room.players.length !== oldLen) {
          socket.leave(rc);
          // if host left, reassign or delete the room
          if (room.hostId === socket.id) {
            if (room.players.length === 0) {
              delete rooms[rc];
            } else {
              room.hostId = room.players[0].id;
              io.to(room.hostId).emit('host-permission');
            }
          }
          broadcastRoom(rc);
        }
      }
    } catch (err) {
      console.error('disconnect handler error', err);
    }
  });

});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log('Server listening on', PORT));
