"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

type Mode = "login" | "register";

export default function LoginPage()
{
  const [mode, setMode] = useState<Mode>("login");

  const [nome, setNome] = useState("");
  const [cognome, setCognome] = useState("");
  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]               = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user, isLoading, login, register, loginWithProvider } = useAuth();
  const router = useRouter();

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (!isLoading && user) router.push("/dashboard");
  }, [user, isLoading, router]);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(nome, cognome, email, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore di accesso");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProvider = (provider: "google" | "github") => {
    setError("");
    loginWithProvider(provider);
  };

  if (isLoading) return null;

  const inp = "w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-green-500 focus:outline-none transition-colors";

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-green-600 tracking-tight">Fields</h1>
          <p className="text-gray-400 mt-1 text-sm">prenota la prossima partita</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8">
          {mode === "login" ? (
            <>
              <h2 className="text-2xl font-bold text-gray-800 mb-1">Bentornato!</h2>
              <p className="text-gray-400 text-sm mb-6">Accedi al tuo account per continuare</p>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-gray-800 mb-1">Crea il tuo account</h2>
              <p className="text-gray-400 text-sm mb-6">Registrati per iniziare a prenotare</p>
            </>
          )}

          {/* Error banner */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {mode === "register" && (
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Nome"
                    required
                    className={inp}
                  />
                </div>
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={cognome}
                    onChange={(e) => setCognome(e.target.value)}
                    placeholder="Cognome"
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-green-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
                className={inp}
              />
            </div>

            {/* Password */}
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                minLength={mode === "register" ? 8 : undefined}
                className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl text-sm focus:border-green-500 focus:outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {mode === "register" && (
              <p className="text-xs text-gray-400 -mt-2">La password deve avere almeno 8 caratteri.</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
            >
              {mode === "login"
                ? (isSubmitting ? "Accesso in corso…" : "Accedi")
                : (isSubmitting ? "Registrazione in corso…" : "Crea account")}
            </button>
          </form>

          {/* OAuth2 */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 whitespace-nowrap">oppure continua con</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
          <div className="space-y-3">
            <button onClick={() => handleProvider("google")} className="w-full flex items-center justify-center gap-3 border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium py-3 rounded-xl transition-colors text-sm">
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47c-.28 1.5-1.13 2.77-2.4 3.62v3h3.88c2.27-2.09 3.57-5.17 3.57-8.81z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.92l-3.88-3c-1.08.72-2.46 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.09C3.25 21.3 7.31 24 12 24z" />
                <path fill="#FBBC05" d="M5.27 14.27a7.2 7.2 0 010-4.54V6.64H1.27a12 12 0 000 10.72l4-3.09z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.27 6.64l4 3.09c.95-2.85 3.6-4.98 6.73-4.98z" />
              </svg>
              Continua con Google
            </button>
          </div>

          {/* Toggle login/registrazione */}
          <p className="text-center text-sm text-gray-400 mt-6">
            {mode === "login" ? (
              <>Non hai un account?{" "}
                <button type="button" onClick={() => switchMode("register")} className="text-green-600 font-semibold hover:text-green-700 transition-colors">
                  Registrati
                </button>
              </>
            ) : (
              <>Hai già un account?{" "}
                <button type="button" onClick={() => switchMode("login")} className="text-green-600 font-semibold hover:text-green-700 transition-colors">
                  Accedi
                </button>
              </>
            )}
          </p>

          {/* Dev credentials hint */}
          {mode === "login" && (
            <div className="mt-5 p-3 bg-amber-50 border border-amber-100 rounded-xl">
              <p className="text-xs font-semibold text-amber-700 mb-0.5">Credenziali demo</p>
              <p className="text-xs text-amber-600">admin@example.com · 1</p>
              <p className="text-xs text-amber-600">mario.rossi@example.com · 1</p>
              <p className="text-xs text-amber-600">giulia.bianchi@example.com · 1</p>
              <p className="text-xs text-amber-600">Utente_Prova1@gmail.com · 11111111</p>
              
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
