"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet } from "./api";
import { Prenotazione, STATO_STYLE } from "./types";
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

function meseAnnoLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("it-IT", { month: "long", year: "numeric" }).toUpperCase();
}

export default function PrenotazioniTab({ idSede, token }: { idSede: string; token: string }) {
  const [prenotazioni, setPrenotazioni] = useState<Prenotazione[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    apiGet<Prenotazione[]>(`/api/sedi/${idSede}/prenotazioni`, token)
      .then(setPrenotazioni)
      .catch(() => setError("Impossibile caricare le prenotazioni."))
      .finally(() => setLoading(false));
  }, [idSede, token]);

  useEffect(() => { load(); }, [load]);
  usePrenotazioniChanged(load);

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

  // le prenotazioni arrivano già ordinate per data crescente dal backend
  const gruppi: { mese: string; righe: Prenotazione[] }[] = [];
  for (const p of prenotazioni) {
    const mese = meseAnnoLabel(p.data);
    const ultimo = gruppi[gruppi.length - 1];
    if (ultimo && ultimo.mese === mese) ultimo.righe.push(p);
    else gruppi.push({ mese, righe: [p] });
  }

  return (
    <div className="space-y-6">
      {gruppi.map((g) => (
        <div key={g.mese}>
          <h3 className="text-sm font-extrabold text-gray-500 uppercase tracking-wide mb-3">{g.mese}</h3>
          <div className="space-y-3">
            {g.righe.map((p) => (
              <div key={p.id} className="bg-white rounded-2xl shadow-sm p-4 flex flex-col sm:flex-row sm:items-center gap-4">
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
                <span className={["text-xs font-semibold px-2.5 py-1 rounded-full shrink-0",
                  STATO_STYLE[p.stato] ?? "bg-gray-100 text-gray-500"].join(" ")}>
                  {p.stato.replace("_", " ")}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
