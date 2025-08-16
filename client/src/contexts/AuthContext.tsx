import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { AuthUser } from "@/types";
import { apiRequest } from "@/lib/queryClient";

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem("auth_token");
    const savedUser = localStorage.getItem("auth_user");
    
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    const response = await apiRequest("POST", "/api/auth/login", { email, password });
    const data = await response.json();
    
    setUser(data.user);
    setToken(data.token);
    localStorage.setItem("auth_token", data.token);
    localStorage.setItem("auth_user", JSON.stringify(data.user));
  };

  const logout = async (): Promise<void> => {
    if (token) {
      try {
        await apiRequest("POST", "/api/auth/logout");
      } catch (error) {
        console.error("Logout error:", error);
      }
    }
    
    setUser(null);
    setToken(null);
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
