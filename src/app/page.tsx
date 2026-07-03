"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import SearchBar, { type DisponibilitaResult } from "@/components/SearchBar";
import HeroSection from "@/components/HeroSection";
import Footer from "@/components/Footer";

// ── sezione risultati ──────────────────────────────────────────────────────────

function RisultatiSection({
  results,
  onReset,
}: {
  results: DisponibilitaResult[];
  onReset: () => void;
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

        <div className="flex flex-col gap-4">
          {results.map((r) => (
            <div key={r.idCampo} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                {/* Info sede */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base font-bold text-gray-800 truncate">{r.nomeSede}</span>
                    <span className="text-xs text-gray-400 shrink-0">{r.citta}</span>
                  </div>
                  <span className="inline-block bg-green-100 text-green-700 text-xs font-semibold px-3 py-0.5 rounded-full">
                    {r.nomeCampo}
                  </span>
                </div>

                {/* Slot disponibili */}
                <div className="flex flex-wrap gap-2 sm:justify-end">
                  {r.slotDisponibili.map((slot) => (
                    <span
                      key={slot}
                      className="bg-green-50 border border-green-200 text-green-700 text-sm font-semibold px-3 py-1 rounded-lg"
                    >
                      {slot}
                    </span>
                  ))}
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

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <SearchBar onResults={handleResults} />
      {hasSearched ? (
        <RisultatiSection results={searchResults} onReset={() => setHasSearched(false)} />
      ) : (
        <HeroSection />
      )}
      <Footer />
    </div>
  );
}
