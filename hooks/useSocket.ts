"use client";

// hooks/useSocket.ts
import { useEffect, useRef } from "react";
import { Socket } from "socket.io-client";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import { useAuth } from "@/hooks/useAuth";

export function useSocket(): Socket | null {
  const { isAuthenticated } = useAuth();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    const s = connectSocket(token);
    socketRef.current = s;

    return () => {
      // Only disconnect when the entire session ends (e.g. logout)
      // Navigating between pages should keep socket alive
    };
  }, [isAuthenticated]);

  // Disconnect on logout
  useEffect(() => {
    if (!isAuthenticated && socketRef.current) {
      disconnectSocket();
      socketRef.current = null;
    }
  }, [isAuthenticated]);

  return socketRef.current;
}
