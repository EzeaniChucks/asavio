// lib/socket.ts
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

function getServerUrl(): string {
  // NEXT_PUBLIC_SOCKET_URL takes priority.
  // Falls back to NEXT_PUBLIC_API_URL with the /api path stripped,
  // so you only need one env var in production.
  if (process.env.NEXT_PUBLIC_SOCKET_URL) return process.env.NEXT_PUBLIC_SOCKET_URL;
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, "");
  }
  return "http://localhost:5000";
}

export function getSocket(token?: string): Socket {
  if (!socket) {
    socket = io(getServerUrl(), {
      autoConnect: false,
      auth: { token },
    });
  }
  return socket;
}

export function connectSocket(token: string): Socket {
  const s = getSocket(token);
  // Always update auth token in case it changed (re-login)
  s.auth = { token };
  if (!s.connected) s.connect();
  return s;
}

export function disconnectSocket(): void {
  if (socket?.connected) {
    socket.disconnect();
  }
  socket = null;
}
