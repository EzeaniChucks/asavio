"use client";

// context/AuthContext.tsx
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { AuthUser, LoginCredentials, RegisterCredentials } from "@/types";

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials, redirectTo?: string) => Promise<void>;
  register: (credentials: RegisterCredentials, redirectTo?: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        setUser(null);
        return;
      }
      const res = await api.get("/auth/me");
      setUser(res.data.data.user);
    } catch {
      setUser(null);
      localStorage.removeItem("token");
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setIsLoading(false));
  }, [refreshUser]);

  const defaultDashboard = (role: string) => {
    if (role === "admin") return "/dashboard/admin";
    if (role === "host") return "/dashboard/host";
    return "/dashboard/user";
  };

  const login = async (credentials: LoginCredentials, redirectTo?: string) => {
    const res = await api.post("/auth/login", credentials);
    const { token, data } = res.data;
    localStorage.setItem("token", token);
    setUser(data.user);
    toast.success(`Welcome back, ${data.user.firstName}!`);
    router.push(redirectTo || defaultDashboard(data.user.role));
  };

  const register = async (credentials: RegisterCredentials, redirectTo?: string) => {
    const res = await api.post("/auth/register", credentials);
    const { token, data } = res.data;
    localStorage.setItem("token", token);
    setUser(data.user);
    toast.success(`Welcome to Asavio, ${data.user.firstName}!`);
    router.push(redirectTo || defaultDashboard(data.user.role));
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    toast.success("Logged out successfully");
    router.push("/");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return ctx;
}
