"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet } from "./api";
import { Prenotazione } from "./types";
import ConfermaModal from "./ConfermaModal";
import { usePrenotazioniChanged } from "@/lib/prenotazioniEvents";

function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

const formatData = (iso: string) =>
  new Date(iso).toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "long" });
const formatOra = (t: string) => t.slice(0, 5);

export default function ConfermaPrenotazioniTab({ idSede, token }: { idSede: string; token: string }) {
  const [prenotazioni, setPrenotazioni] = useState<Prenotazione[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selezionata, setSelezionata] = useState<Prenotazione | null>(null);

  const load = useCallback(() => {
    apiGet<Prenotazione[]>(`/api/sedi/${idSede}/prenotazioni/in-attesa`, token)
      .then(setPrenotazioni)
      .catch(() => setError("Impossibile caricare le prenotazioni in attesa."))
      .finally(() => setLoading(false));
  }, [idSede, token]);

  useEffect(() => { load(); }, [load]);
  usePrenotazioniChanged(load);

  const handleResolved = (id: string) => setPrenotazioni((prev) => prev.filter((p) => p.id !== id));

  if (loading) return <Spinner />;
  if (error) return <p className="text-red-500">{error}</p>;

  if (prenotazioni.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-10 text-center text-gray-400">
        <svg className="w-10 h-10 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm font-medium">Nessuna prenotazione in attesa</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {prenotazioni.map((p) => (
          <button key={p.id} onClick={() => setSelezionata(p)}
            className="w-full text-left bg-white rounded-2xl shadow-sm p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-md transition-shadow">
            <div className="sm:w-40 shrink-0">
              <p className="text-sm font-semibold text-gray-800 capitalize">{formatData(p.data)}</p>
              <p className="text-xs text-gray-400">{formatOra(p.oraInizio)} – {formatOra(p.oraFine)}</p>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700">{p.nomeCampo}</p>
              <p className="text-xs text-gray-400 capitalize">{p.tipoCampo}</p>
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-700">{p.nomeUtente}</p>
              <p className="text-xs text-gray-400">{p.emailUtente}</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 bg-amber-100 text-amber-700">
              in attesa
            </span>
          </button>
        ))}
      </div>

      {selezionata && (
        <ConfermaModal
          prenotazione={selezionata}
          idSede={idSede}
          token={token}
          onClose={() => setSelezionata(null)}
          onResolved={handleResolved}
        />
      )}
    </>
  );
}
