// client/src/socket.ts
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000', { autoConnect: true });

socket.on('connect', () => console.log('CLIENT: socket connected', socket.id));
socket.on('connect_error', (err) => console.error('CLIENT: socket connect_error', err));

// expose for manual testing in console
if (typeof window !== 'undefined') (window as any).__APP_SOCKET = socket;

export default socket;
