"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useRouter } from "next/navigation";

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface UserVenue {
  id_sede: string;
  nome_sede: string;
  citta: string;
  ruolo: "founder" | "cliente";
}

interface AuthContextType {
  user: User | null;
  venues: UserVenue[];
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  // loginWithProvider: (provider: "google" | "github") => Promise<void>;
  logout: () => void;
  // completeOAuthLogin: (accessToken: string, refreshToken: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const API_BASE_URL = "http://localhost:8080";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [venues, setVenues] = useState<UserVenue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const handleTokens = useCallback(async (access: string, refresh: string) => {
    localStorage.setItem("access_token", access);
    localStorage.setItem("refresh_token", refresh);

    try {
      const [meRes, venuesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${access}` },
        }),
        fetch(`${API_BASE_URL}/api/sedi/mie`, {
          headers: { Authorization: `Bearer ${access}` },
        }),
      ]);

      if (meRes.ok) {
        const me = await meRes.json();
        setUser({
          id: me.id,
          name: me.name || me.email.split("@")[0],
          email: me.email,
        });
      } else {
        // fallback: legge email dal JWT
        const payload = JSON.parse(atob(access.split(".")[1]));
        setUser({ id: "unknown", name: payload.sub.split("@")[0], email: payload.sub });
      }

      if (venuesRes.ok) {
        setVenues(await venuesRes.json());
      }
    } catch (e) {
      console.error("Errore nel caricamento dati utente", e);
      try {
        const payload = JSON.parse(atob(access.split(".")[1]));
        setUser({ id: "unknown", name: payload.sub.split("@")[0], email: payload.sub });
      } catch {}
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const refresh = localStorage.getItem("refresh_token");
    if (token && refresh) {
      handleTokens(token, refresh).finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [handleTokens]);

  const login = async (email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error("Email o password non validi");
    }

    const data = await response.json();
    await handleTokens(data.accessToken, data.refreshToken);
    router.push("/dashboard");
  };

  // OAuth2 – commentato fino a configurazione Google/GitHub
  // const loginWithProvider = async (provider: "google" | "github") => {
  //   window.location.href = `${API_BASE_URL}/oauth2/authorization/${provider}`;
  // };

  // const completeOAuthLogin = (accessToken: string, refreshToken: string) => {
  //   handleTokens(accessToken, refreshToken);
  // };

  const logout = async () => {
    const refreshToken = localStorage.getItem("refresh_token");
    if (refreshToken) {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      }).catch(console.error);
    }

    setUser(null);
    setVenues([]);
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{ user, venues, isLoading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
