"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { apiGet } from "./api";
import { PrenotazioneUtente, STATO_STYLE } from "./types";
import CancelMiaPrenotazioneModal from "./CancelMiaPrenotazioneModal";
import { usePrenotazioniChanged } from "@/lib/prenotazioniEvents";

function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

const formatData = (iso: string) =>
  new Date(iso).toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "long", year: "numeric" });
const formatOra = (t: string) => t.slice(0, 5);

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function Riga({ p, onCancelClick }: { p: PrenotazioneUtente; onCancelClick?: (p: PrenotazioneUtente) => void }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="sm:w-40 shrink-0">
        <p className="text-sm font-semibold text-gray-800 capitalize">{formatData(p.data)}</p>
        <p className="text-xs text-gray-400">{formatOra(p.oraInizio)} – {formatOra(p.oraFine)}</p>
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-700">{p.nomeCampo}</p>
        <p className="text-xs text-gray-400 capitalize">{p.tipoCampo}</p>
      </div>
      <div className="flex-1">
        <Link href={`/sede/${p.idSede}`} className="text-sm text-gray-700 hover:text-green-600 transition-colors font-medium">
          {p.nomeSede}
        </Link>
        <p className="text-xs text-gray-400">{p.cittaSede}</p>
      </div>
      <span className={["text-xs font-semibold px-2.5 py-1 rounded-full shrink-0",
        STATO_STYLE[p.stato] ?? "bg-gray-100 text-gray-500"].join(" ")}>
        {p.stato.replace("_", " ")}
      </span>
      {onCancelClick && p.stato !== "annullata" && (
        <button onClick={() => onCancelClick(p)} aria-label="Annulla prenotazione"
          className="shrink-0 w-8 h-8 rounded-full hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}
    </div>
  );
}

export default function MiePrenotazioniTab({ token }: { token: string }) {
  const [prenotazioni, setPrenotazioni] = useState<PrenotazioneUtente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [daAnnullare, setDaAnnullare] = useState<PrenotazioneUtente | null>(null);

  const load = useCallback(() => {
    apiGet<PrenotazioneUtente[]>("/api/prenotazioni/mie", token)
      .then(setPrenotazioni)
      .catch(() => setError("Impossibile caricare le tue prenotazioni."))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => { load(); }, [load]);
  usePrenotazioniChanged(load);

  const handleCancelled = (id: string) =>
    setPrenotazioni((prev) => prev.map((p) => (p.id === id ? { ...p, stato: "annullata" } : p)));

  if (loading) return <Spinner />;
  if (error) return <p className="text-red-500">{error}</p>;

  if (prenotazioni.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-10 text-center text-gray-400">
        <svg className="w-10 h-10 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="text-sm font-medium">Nessuna prenotazione</p>
      </div>
    );
  }

  const today = todayIso();
  const future = prenotazioni.filter((p) => p.data >= today).sort((a, b) => (a.data + a.oraInizio).localeCompare(b.data + b.oraInizio));
  const passate = prenotazioni.filter((p) => p.data < today); // già ordinate desc dal backend

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-extrabold text-gray-500 uppercase tracking-wide mb-3">Prossime</h3>
        {future.length === 0 ? (
          <p className="text-sm text-gray-400">Nessuna prenotazione futura</p>
        ) : (
          <div className="space-y-3">
            {future.map((p) => <Riga key={p.id} p={p} onCancelClick={setDaAnnullare} />)}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-extrabold text-gray-500 uppercase tracking-wide mb-3">Passate</h3>
        {passate.length === 0 ? (
          <p className="text-sm text-gray-400">Nessuna prenotazione passata</p>
        ) : (
          <div className="space-y-3">
            {passate.map((p) => <Riga key={p.id} p={p} />)}
          </div>
        )}
      </div>

      {daAnnullare && (
        <CancelMiaPrenotazioneModal
          prenotazione={daAnnullare}
          token={token}
          onClose={() => setDaAnnullare(null)}
          onCancelled={handleCancelled}
        />
      )}
    </div>
  );
}
