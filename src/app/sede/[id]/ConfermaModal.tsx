"use client";

import { useState } from "react";
import { apiJson } from "./api";
import { Prenotazione } from "./types";
import { notifyPrenotazioniChanged } from "@/lib/prenotazioniEvents";

const formatData = (iso: string) =>
  new Date(iso).toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const formatOra = (t: string) => t.slice(0, 5);

export default function ConfermaModal({
  prenotazione, idSede, token, onClose, onResolved,
}: {
  prenotazione: Prenotazione;
  idSede: string;
  token: string;
  onClose: () => void;
  onResolved: (id: string) => void;
}) {
  const [loading, setLoading] = useState<"confermare" | "annullare" | null>(null);
  const [error, setError] = useState("");

  const risolvi = async (azione: "confermare" | "annullare") => {
    setLoading(azione); setError("");
    try {
      await apiJson(`/api/sedi/${idSede}/prenotazioni/${prenotazione.id}/${azione}`, token, "PATCH");
      notifyPrenotazioniChanged();
      onResolved(prenotazione.id);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Operazione fallita.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Prenotazione in attesa</h3>

        <div className="divide-y divide-gray-100 mb-5">
          {[
            ["Data", formatData(prenotazione.data)],
            ["Orario", `${formatOra(prenotazione.oraInizio)} – ${formatOra(prenotazione.oraFine)}`],
            ["Campo", `${prenotazione.nomeCampo} (${prenotazione.tipoCampo})`],
            ["Cliente", prenotazione.nomeUtente],
            ["Email", prenotazione.emailUtente],
          ].map(([label, value]) => (
            <div key={label} className="py-2.5 flex items-center justify-between gap-3">
              <span className="text-xs text-gray-400">{label}</span>
              <span className="text-sm font-medium text-gray-800 text-right capitalize">{value}</span>
            </div>
          ))}
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>}

        <div className="flex gap-3">
          <button onClick={() => risolvi("confermare")} disabled={loading !== null}
            className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm font-semibold rounded-xl transition-colors">
            {loading === "confermare" ? "Conferma…" : "Conferma"}
          </button>
          <button onClick={() => risolvi("annullare")} disabled={loading !== null}
            className="flex-1 px-4 py-2.5 border border-red-200 hover:bg-red-50 disabled:opacity-50 text-red-500 text-sm font-semibold rounded-xl transition-colors">
            {loading === "annullare" ? "Annulla…" : "Annulla"}
          </button>
        </div>
      </div>
    </div>
  );
}
