"use client";

import { useState } from "react";

const API_BASE_URL = "http://localhost:8080";

interface SedeCreata {
  idSede: string;
  nomeSede: string;
  citta: string;
}

export default function CreaSedeModal({
  token, onClose, onCreated,
}: {
  token: string;
  onClose: () => void;
  onCreated: (sede: SedeCreata) => void;
}) {
  const [nomeSede, setNomeSede] = useState("");
  const [citta, setCitta] = useState("");
  const [numeroTelefono, setNumeroTelefono] = useState("");
  const [descrizione, setDescrizione] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const inp = "w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:border-green-500 focus:outline-none transition-colors";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeSede.trim() || !citta.trim()) {
      setError("Nome sede e città sono obbligatori.");
      return;
    }
    setSaving(true); setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/sedi`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          nomeSede: nomeSede.trim(),
          citta: citta.trim(),
          numeroTelefono: numeroTelefono.trim() || null,
          descrizione: descrizione.trim() || null,
        }),
      });
      if (!res.ok) throw new Error();
      onCreated(await res.json());
    } catch {
      setError("Creazione della sede fallita. Riprova.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Crea nuova sede</h3>

        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Nome sede *</label>
            <input className={inp} value={nomeSede} onChange={(e) => setNomeSede(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Città *</label>
            <input className={inp} value={citta} onChange={(e) => setCitta(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Numero di telefono</label>
            <input className={inp} value={numeroTelefono} onChange={(e) => setNumeroTelefono(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Descrizione</label>
            <textarea className={`${inp} resize-none`} rows={3} value={descrizione} onChange={(e) => setDescrizione(e.target.value)} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving}
              className="flex-1 px-5 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm font-semibold rounded-xl transition-colors">
              {saving ? "Creazione…" : "Crea sede"}
            </button>
            <button type="button" onClick={onClose} disabled={saving}
              className="px-5 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm font-semibold rounded-xl transition-colors">
              Annulla
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
