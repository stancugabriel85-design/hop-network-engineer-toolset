import { io, Socket } from 'socket.io-client';

interface SshOutputEvent { sessionId: string; data: string; }
interface SshStatusEvent { sessionId: string; status: 'connecting' | 'connected' | 'disconnected' | 'error'; message: string; }
interface PingUpdateEvent { host: string; rtt: number | null; status: 'up' | 'down' | 'error'; timestamp: number; }
interface BandwidthUpdateEvent { ifIndex: number; inMbps: number; outMbps: number; timestamp: number; }
interface SnmpUpdateEvent { oid: string; type?: string; value: number | string | null; error?: string; timestamp: number; }

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io('http://localhost:3001', {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });
  }
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
