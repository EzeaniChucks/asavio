"use client";

// components/providers/Providers.tsx
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/context/AuthContext";
import { useSocket } from "@/hooks/useSocket";

function SocketKeepAlive() {
  useSocket(); // Connects socket when authenticated, disconnects on logout
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SocketKeepAlive />
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#000",
            color: "#fff",
            borderRadius: "8px",
          },
          success: {
            iconTheme: { primary: "#FFD700", secondary: "#000" },
          },
          error: {
            iconTheme: { primary: "#ef4444", secondary: "#fff" },
          },
        }}
      />
    </AuthProvider>
  );
}
