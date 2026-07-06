"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import { immagineSede } from "@/lib/immagini";

const API_BASE_URL = "http://localhost:8080";

interface SedeRisultato {
  idSede: string;
  nomeSede: string;
  citta: string;
  numeroTelefono: string | null;
  ruolo: string | null;
}

function SedeCard({ sede, onClick }: { sede: SedeRisultato; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full text-left bg-white rounded-2xl shadow-sm hover:shadow-md border border-gray-100 overflow-hidden transition-shadow flex flex-col sm:flex-row">
      <div className="relative w-full sm:w-56 h-40 sm:h-auto shrink-0 bg-gradient-to-br from-green-100 to-emerald-200 flex items-center justify-center overflow-hidden">
        <svg className="w-10 h-10 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M3 21h18M5 21V7l8-4v18M13 21V11l6 3v7M9 9v.01M9 12v.01M9 15v.01" />
        </svg>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={immagineSede(sede.ruolo)}
          alt=""
          onError={(e) => { e.currentTarget.style.opacity = "0"; }}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>
      <div className="p-5 flex-1 min-w-0">
        <h3 className="text-base font-bold text-gray-800 mb-1">{sede.nomeSede}</h3>
        <p className="text-sm text-gray-500 flex items-center gap-1.5 mb-1">
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {sede.citta}
        </p>
        {sede.numeroTelefono && (
          <p className="text-sm text-gray-500 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            {sede.numeroTelefono}
          </p>
        )}
      </div>
    </button>
  );
}

function RicercaSediContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const citta = searchParams.get("citta") ?? "";

  const [risultati, setRisultati] = useState<SedeRisultato[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!citta) { setLoading(false); return; }
    const token = localStorage.getItem("access_token");
    setLoading(true); setError("");
    fetch(`${API_BASE_URL}/api/sedi/per-citta?citta=${encodeURIComponent(citta)}`, {
      headers: { Authorization: `Bearer ${token ?? ""}` },
    })
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data: SedeRisultato[]) => setRisultati(data))
      .catch(() => setError("Impossibile caricare le sedi per questa città."))
      .finally(() => setLoading(false));
  }, [citta]);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 bg-gray-50 py-10 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-800">Sedi a {citta}</h1>
              <p className="text-gray-400 text-sm mt-1">
                {risultati.length} {risultati.length === 1 ? "sede trovata" : "sedi trovate"}
              </p>
            </div>
            <button onClick={() => router.push("/")} className="text-sm text-gray-500 hover:text-green-600 transition-colors underline underline-offset-2">
              Nuova ricerca
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <p className="text-red-500 text-sm">{error}</p>
          ) : risultati.length === 0 ? (
            <p className="text-gray-500 text-sm">Nessuna sede trovata per &quot;{citta}&quot;.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {risultati.map((s) => (
                <SedeCard key={s.idSede} sede={s} onClick={() => router.push(`/sede/${s.idSede}`)} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function RicercaSediPage() {
  return (
    <Suspense fallback={null}>
      <RicercaSediContent />
    </Suspense>
  );
}
