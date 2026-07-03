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

// percorsi che non devono mai far comparire la modale di sessione scaduta
// (il login con credenziali sbagliate risponde anch'esso 401, ma non è una sessione scaduta)
function isAuthEndpoint(url: string): boolean {
  return url.includes("/api/auth/");
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [venues, setVenues] = useState<UserVenue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [renewing, setRenewing] = useState(false);
  const [renewError, setRenewError] = useState("");
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

  // Intercetta ogni fetch dell'app: se il backend risponde 401 (token mancante/scaduto/non
  // valido, vedi SecurityConfig) e c'è un refresh token salvato, propone di rinnovare la
  // sessione invece di far fallire silenziosamente la richiesta in corso.
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      const url = typeof args[0] === "string" ? args[0] : args[0] instanceof URL ? args[0].toString() : args[0].url;
      if (response.status === 401 && !isAuthEndpoint(url) && localStorage.getItem("refresh_token")) {
        setSessionExpired(true);
      }
      return response;
    };
    return () => { window.fetch = originalFetch; };
  }, []);

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
    setSessionExpired(false);
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    router.push("/login");
  };

  const renewSession = async () => {
    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) { await logout(); return; }

    setRenewing(true); setRenewError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      await handleTokens(data.accessToken, data.refreshToken);
      setSessionExpired(false);
    } catch {
      setRenewError("Rinnovo non riuscito. Effettua di nuovo l'accesso.");
    } finally {
      setRenewing(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, venues, isLoading, login, logout }}
    >
      {children}

      {sessionExpired && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center">
            <h3 className="text-base font-bold text-gray-800 mb-2">Sessione scaduta</h3>
            <p className="text-sm text-gray-500 mb-5">
              La tua sessione è scaduta. Vuoi rinnovarla per continuare da dove eri rimasto?
            </p>
            {renewError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{renewError}</div>
            )}
            <div className="flex gap-3">
              <button onClick={renewSession} disabled={renewing}
                className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm font-semibold rounded-xl transition-colors">
                {renewing ? "Rinnovo…" : "Rinnova sessione"}
              </button>
              <button onClick={logout} disabled={renewing}
                className="flex-1 px-4 py-2.5 border border-gray-200 hover:bg-gray-50 disabled:opacity-50 text-gray-600 text-sm font-semibold rounded-xl transition-colors">
                Esci
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
