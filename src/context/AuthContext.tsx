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
  loginWithProvider: (provider: "google" | "github") => Promise<void>;
  logout: () => void;
  completeOAuthLogin: (accessToken: string, refreshToken: string) => void;
}

const MOCK_VENUES: UserVenue[] = [
  { id_sede: "1", nome_sede: "Centro Sportivo Olimpia", citta: "Torino",  ruolo: "founder"  },
  { id_sede: "2", nome_sede: "Polisportiva Milano Nord", citta: "Milano",  ruolo: "cliente"  },
];

const AuthContext = createContext<AuthContextType | null>(null);

// Assicurati che l'URL coincida con la porta in cui gira Spring Boot (di default 8080)
const API_BASE_URL = "http://localhost:8080";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Funzione helper per processare i JWT e ricavare i dati base
  const handleTokens = useCallback((access: string, refresh: string) => {
    localStorage.setItem("access_token", access);
    localStorage.setItem("refresh_token", refresh);
    
    try {
      // Decodifica il payload del JWT per ricavare la mail dell'utente
      const payload = JSON.parse(atob(access.split('.')[1]));
      setUser({
        id: "id-dal-token", // Il BE al momento non invia ID
        name: payload.sub.split('@')[0], // Usiamo parte della mail come nome provvisorio
        email: payload.sub,
      });
    } catch (e) {
      console.error("Errore nella lettura del token", e);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const refresh = localStorage.getItem("refresh_token");
    if (token && refresh) {
      handleTokens(token, refresh);
    }
    setIsLoading(false);
  }, [handleTokens]);

  // Login Classico tramite credenziali
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
    handleTokens(data.accessToken, data.refreshToken);
    router.push("/dashboard");
  };

  // Login OAuth2
  const loginWithProvider = async (provider: "google" | "github") => {
    // Spring Security intercetterà questa rotta per iniziare il flusso OAuth2
    window.location.href = `${API_BASE_URL}/oauth2/authorization/${provider}`;
  };

  // Completamento OAuth2 (verrà chiamato dalla pagina di callback)
  const completeOAuthLogin = (accessToken: string, refreshToken: string) => {
    handleTokens(accessToken, refreshToken);
  };

  // Logout
  const logout = async () => {
    const refreshToken = localStorage.getItem("refresh_token");
    if (refreshToken) {
      // Diciamo al backend di revocare il token
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      }).catch(console.error);
    }

    setUser(null);
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{ user, venues: MOCK_VENUES, isLoading, login, loginWithProvider, logout, completeOAuthLogin }}
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