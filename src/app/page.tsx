"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import SearchBar, { type DisponibilitaResult } from "@/components/SearchBar";
import HeroSection from "@/components/HeroSection";
import Footer from "@/components/Footer";
import DiventaClienteModal from "@/components/DiventaClienteModal";
import BookingModal from "@/app/sede/[id]/BookingModal";

const API_BASE_URL = "http://localhost:8080";

interface BookingState {
  idSede: string;
  token: string;
  isFounder: boolean;
  campo: { idCampo: string; nomeCampo: string; prezzoOrario: number };
  data: string;
  ora: string;
}

interface JoinPromptState {
  idSede: string;
  nomeSede: string;
  result: DisponibilitaResult;
  ora: string;
}

// ── sezione risultati ──────────────────────────────────────────────────────────

function RisultatiSection({
  results,
  onReset,
  onSlotClick,
  pendingSlot,
  actionError,
}: {
  results: DisponibilitaResult[];
  onReset: () => void;
  onSlotClick: (r: DisponibilitaResult, ora: string) => void;
  pendingSlot: string | null;
  actionError: string;
}) {
  return (
    <main className="flex-1 bg-gray-50 py-10 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">
            {results.length > 0
              ? `${results.length} campo${results.length > 1 ? "i" : ""} disponibil${results.length > 1 ? "i" : "e"}`
              : "Nessuna disponibilità trovata"}
          </h2>
          <button
            onClick={onReset}
            className="text-sm text-gray-500 hover:text-green-600 transition-colors underline underline-offset-2"
          >
            Nuova ricerca
          </button>
        </div>

        {results.length === 0 && (
          <p className="text-gray-500 text-sm">
            Prova a cambiare i criteri di ricerca o seleziona un&apos;altra data.
          </p>
        )}

        {actionError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{actionError}</div>
        )}

        <div className="flex flex-col gap-4">
          {results.map((r) => (
            <div key={r.idCampo} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex flex-col gap-3">
                {/* Info sede */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base font-bold text-gray-800 truncate">{r.nomeSede}</span>
                    <span className="text-xs text-gray-400 shrink-0">{r.citta}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="inline-block bg-green-100 text-green-700 text-xs font-semibold px-3 py-0.5 rounded-full">
                      {r.nomeCampo}
                    </span>
                    <span className="text-xs text-gray-400">€ {r.prezzoOrario.toFixed(2)}/h</span>
                  </div>
                </div>

                {/* Slot disponibili */}
                <div className="flex flex-wrap gap-2">
                  {r.slotDisponibili.map((slot) => {
                    const key = `${r.idCampo}-${slot}`;
                    return (
                      <button
                        key={slot}
                        onClick={() => onSlotClick(r, slot)}
                        disabled={pendingSlot === key}
                        className="bg-green-50 border border-green-200 text-green-700 text-sm font-semibold px-3 py-1 rounded-lg hover:bg-green-100 disabled:opacity-50 transition-colors"
                      >
                        {pendingSlot === key ? "…" : slot}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

// ── pagina home ────────────────────────────────────────────────────────────────

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [searchResults, setSearchResults] = useState<DisponibilitaResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const [pendingSlot, setPendingSlot] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const [joinPrompt, setJoinPrompt] = useState<JoinPromptState | null>(null);
  const [booking, setBooking] = useState<BookingState | null>(null);

  useEffect(() => {
    if (!isLoading && !user) router.push("/login");
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleResults = (results: DisponibilitaResult[]) => {
    setSearchResults(results);
    setHasSearched(true);
  };

  const handleSlotClick = async (r: DisponibilitaResult, ora: string) => {
    const token = localStorage.getItem("access_token");
    if (!token) { router.push("/login"); return; }

    setActionError("");
    setPendingSlot(`${r.idCampo}-${ora}`);
    try {
      const res = await fetch(`${API_BASE_URL}/api/sedi/${r.idSede}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const sede: { ruolo: string | null } = await res.json();

      if (!sede.ruolo) {
        setJoinPrompt({ idSede: r.idSede, nomeSede: r.nomeSede, result: r, ora });
      } else {
        setBooking({
          idSede: r.idSede,
          token,
          isFounder: sede.ruolo === "founder",
          campo: { idCampo: r.idCampo, nomeCampo: r.nomeCampo, prezzoOrario: r.prezzoOrario },
          data: r.data,
          ora,
        });
      }
    } catch {
      setActionError("Impossibile verificare la sede. Riprova.");
    } finally {
      setPendingSlot(null);
    }
  };

  const handleJoinConfirmed = async () => {
    if (!joinPrompt) return;
    const token = localStorage.getItem("access_token");
    if (!token) { router.push("/login"); return; }

    const res = await fetch(`${API_BASE_URL}/api/sedi/${joinPrompt.idSede}/diventa-cliente`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error();

    const { result, ora } = joinPrompt;
    setJoinPrompt(null);
    setBooking({
      idSede: result.idSede,
      token,
      isFounder: false,
      campo: { idCampo: result.idCampo, nomeCampo: result.nomeCampo, prezzoOrario: result.prezzoOrario },
      data: result.data,
      ora,
    });
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <SearchBar onResults={handleResults} />
      {hasSearched ? (
        <RisultatiSection
          results={searchResults}
          onReset={() => setHasSearched(false)}
          onSlotClick={handleSlotClick}
          pendingSlot={pendingSlot}
          actionError={actionError}
        />
      ) : (
        <HeroSection />
      )}
      <Footer />

      {joinPrompt && (
        <DiventaClienteModal
          nomeSede={joinPrompt.nomeSede}
          onConfirm={handleJoinConfirmed}
          onClose={() => setJoinPrompt(null)}
        />
      )}

      {booking && (
        <BookingModal
          idSede={booking.idSede}
          token={booking.token}
          isFounder={booking.isFounder}
          campo={booking.campo}
          data={booking.data}
          ora={booking.ora}
          onClose={() => setBooking(null)}
        />
      )}
    </div>
  );
}
