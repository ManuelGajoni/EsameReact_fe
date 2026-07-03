"use client";

import { useState } from "react";
import { apiJson } from "./api";
import { PrenotazioneUtente } from "./types";
import { notifyPrenotazioniChanged } from "@/lib/prenotazioniEvents";

const formatData = (iso: string) =>
  new Date(iso).toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const formatOra = (t: string) => t.slice(0, 5);

export default function CancelMiaPrenotazioneModal({
  prenotazione, token, onClose, onCancelled,
}: {
  prenotazione: PrenotazioneUtente;
  token: string;
  onClose: () => void;
  onCancelled: (id: string) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleAnnulla = async () => {
    setSaving(true); setError("");
    try {
      await apiJson(`/api/prenotazioni/${prenotazione.id}/annullare`, token, "PATCH");
      notifyPrenotazioniChanged();
      onCancelled(prenotazione.id);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Annullamento fallito.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center" onClick={(e) => e.stopPropagation()}>
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-red-50 flex items-center justify-center">
          <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>
        <h3 className="text-sm font-bold text-gray-800 mb-1">Annullare la prenotazione?</h3>
        <p className="text-sm text-gray-500 mb-4">
          {prenotazione.nomeSede} · {formatData(prenotazione.data)}, {formatOra(prenotazione.oraInizio)} – {formatOra(prenotazione.oraFine)}
        </p>

        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>}

        <div className="flex gap-3">
          <button onClick={handleAnnulla} disabled={saving}
            className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors">
            {saving ? "Annullamento…" : "Sì, annulla"}
          </button>
          <button onClick={onClose} disabled={saving}
            className="flex-1 px-4 py-2.5 border border-gray-200 hover:bg-gray-50 disabled:opacity-50 text-gray-600 text-sm font-semibold rounded-xl transition-colors">
            No, torna indietro
          </button>
        </div>
      </div>
    </div>
  );
}
