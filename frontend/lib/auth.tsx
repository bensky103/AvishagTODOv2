"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

interface AuthContextValue {
  token: string | null;
  login: (pin: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function getAuthCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|; )auth_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    setToken(getAuthCookie());
    setChecked(true);
  }, []);

  const login = useCallback(async (pin: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
        credentials: "include",
      });
      if (!res.ok) return false;
      // Backend sets Set-Cookie header; read it after response
      const cookie = getAuthCookie();
      if (cookie) {
        setToken(cookie);
        return true;
      }
      // If cookie didn't come through the proxy, set it manually from the response
      const data = await res.json();
      if (data.token) {
        document.cookie = `auth_token=${data.token}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;
        setToken(data.token);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    document.cookie = "auth_token=; max-age=0; path=/";
    setToken(null);
    router.push("/login");
  }, [router]);

  if (!checked) return null;

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
