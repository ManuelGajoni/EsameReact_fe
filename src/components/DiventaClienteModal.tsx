"use client";

import { useState } from "react";

export default function DiventaClienteModal({
  nomeSede, onConfirm, onClose,
}: {
  nomeSede: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleConfirm = async () => {
    setLoading(true); setError("");
    try {
      await onConfirm();
    } catch {
      setError("Non è stato possibile completare l'operazione. Riprova.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center" onClick={(e) => e.stopPropagation()}>
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-50 flex items-center justify-center">
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h3 className="text-sm font-bold text-gray-800 mb-1">Diventa cliente</h3>
        <p className="text-sm text-gray-500 mb-5">
          Non sei ancora cliente di <span className="font-semibold text-gray-700">{nomeSede}</span>.
          Vuoi diventarlo per poter prenotare i suoi campi?
        </p>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 text-left">{error}</div>
        )}
        <div className="flex gap-3">
          <button onClick={handleConfirm} disabled={loading}
            className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm font-semibold rounded-xl transition-colors">
            {loading ? "Attendere…" : "Sì, diventa cliente"}
          </button>
          <button onClick={onClose} disabled={loading}
            className="flex-1 px-4 py-2.5 border border-gray-200 hover:bg-gray-50 disabled:opacity-50 text-gray-600 text-sm font-semibold rounded-xl transition-colors">
            Annulla
          </button>
        </div>
      </div>
    </div>
  );
}
