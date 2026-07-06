"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, Fragment } from "react";
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
  register: (nome: string, cognome: string, email: string, password: string) => Promise<void>;
  loginWithProvider: (provider: "google" | "github") => void;
  logout: () => void;
  refreshVenues: () => Promise<void>;
  completeOAuthLogin: (accessToken: string, refreshToken: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const API_BASE_URL = "http://localhost:8080";

// percorsi che non devono mai far comparire la modale di sessione scaduta
// (il login con credenziali sbagliate risponde anch'esso 401, ma non è una sessione scaduta)
function isAuthEndpoint(url: string): boolean {
  return url.includes("/api/auth/");
}

async function extractErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json();
    return data.message ?? fallback;
  } catch {
    return fallback;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [venues, setVenues] = useState<UserVenue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [renewing, setRenewing] = useState(false);
  const [renewError, setRenewError] = useState("");
  // Incrementato dopo un rinnovo riuscito della sessione: forza lo smontaggio/rimontaggio
  // della pagina corrente così i suoi dati (rimasti in errore per via del 401) vengono
  // ricaricati con il nuovo token, invece di restare bloccati finché non si ricarica a mano.
  const [sessionEpoch, setSessionEpoch] = useState(0);
  const router = useRouter();

  const handleTokens = useCallback(async (access: string, refresh: string) => {
    console.log("[DEBUG handleTokens] start", { access: access.slice(0, 20) + "…", refresh });
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
      console.log("[DEBUG handleTokens] meRes", meRes.status, "venuesRes", venuesRes.status);

      if (meRes.ok) {
        const me = await meRes.json();
        console.log("[DEBUG handleTokens] setting user from /me", me);
        setUser({
          id: me.id,
          name: me.name || me.email.split("@")[0],
          email: me.email,
        });
      } else {
        // fallback: legge email dal JWT
        const payload = JSON.parse(atob(access.split(".")[1]));
        console.log("[DEBUG handleTokens] /me not ok, falling back to JWT payload", payload);
        setUser({ id: "unknown", name: payload.sub.split("@")[0], email: payload.sub });
      }

      if (venuesRes.ok) {
        setVenues(await venuesRes.json());
      }
    } catch (e) {
      console.error("[DEBUG handleTokens] EXCEPTION", e);
      try {
        const payload = JSON.parse(atob(access.split(".")[1]));
        setUser({ id: "unknown", name: payload.sub.split("@")[0], email: payload.sub });
      } catch (e2) { console.error("[DEBUG handleTokens] fallback JWT decode ALSO failed", e2); }
    }
    console.log("[DEBUG handleTokens] end");
  }, []);

  // Ad ogni avvio dell'app (mount) si richiede sempre un nuovo login: eventuali
  // token rimasti da una sessione precedente vengono scartati invece di essere
  // usati per un accesso automatico alla dashboard.
  // Eccezione: /auth/callback è un mount "fresco" (redirect dal backend dopo il login
  // OAuth2) che sta per scrivere i token appena emessi — cancellarli qui li perderebbe
  // subito dopo un login riuscito.
  useEffect(() => {
    console.log("[DEBUG AuthProvider mount-effect] pathname:", window.location.pathname);
    if (!window.location.pathname.startsWith("/auth/callback")) {
      console.log("[DEBUG AuthProvider mount-effect] clearing tokens");
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
    } else {
      console.log("[DEBUG AuthProvider mount-effect] SKIPPING clear (on /auth/callback)");
    }
    setIsLoading(false);
  }, []);

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

  const register = async (nome: string, cognome: string, email: string, password: string) => {
    const name = `${nome.trim()} ${cognome.trim()}`.trim();
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });

    if (!response.ok) {
      throw new Error(await extractErrorMessage(response, "Registrazione non riuscita"));
    }

    const data = await response.json();
    await handleTokens(data.accessToken, data.refreshToken);
    router.push("/dashboard");
  };

  const loginWithProvider = (provider: "google" | "github") => {
    window.location.href = `${API_BASE_URL}/oauth2/authorization/${provider}`;
  };

  const completeOAuthLogin = async (accessToken: string, refreshToken: string) => {
    console.log("[DEBUG completeOAuthLogin] called");
    await handleTokens(accessToken, refreshToken);
    console.log("[DEBUG completeOAuthLogin] handleTokens resolved, pushing /dashboard");
    router.push("/dashboard");
  };

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

  const refreshVenues = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/sedi/mie`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setVenues(await res.json());
    } catch (e) {
      console.error("Errore nel ricaricamento delle sedi", e);
    }
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
      setSessionEpoch((e) => e + 1);
    } catch {
      setRenewError("Rinnovo non riuscito. Effettua di nuovo l'accesso.");
    } finally {
      setRenewing(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, venues, isLoading, login, register, loginWithProvider, logout, refreshVenues, completeOAuthLogin }}
    >
      <Fragment key={sessionEpoch}>{children}</Fragment>

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
