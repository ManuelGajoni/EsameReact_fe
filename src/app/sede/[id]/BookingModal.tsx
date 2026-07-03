"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiJson } from "./api";
import { useAuth } from "@/context/AuthContext";
import { notifyPrenotazioniChanged } from "@/lib/prenotazioniEvents";

function splitNome(nomeCompleto: string): [string, string] {
  const idx = nomeCompleto.indexOf(" ");
  if (idx === -1) return [nomeCompleto, ""];
  return [nomeCompleto.slice(0, idx), nomeCompleto.slice(idx + 1)];
}

const formatDataIT = (iso: string) =>
  new Date(iso).toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

export default function BookingModal({
  idSede, token, isFounder, campo, data, ora, onClose,
}: {
  idSede: string;
  token: string;
  isFounder: boolean;
  campo: { idCampo: string; nomeCampo: string; prezzoOrario: number };
  data: string;
  ora: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const [nomeAuto, cognomeAuto] = user ? splitNome(user.name) : ["", ""];

  const [nome, setNome] = useState(isFounder ? "" : nomeAuto);
  const [cognome, setCognome] = useState(isFounder ? "" : cognomeAuto);
  const [email, setEmail] = useState(isFounder ? "" : user?.email ?? "");
  const [saving, setSaving] = useState(false);
  const [errorModal, setErrorModal] = useState("");

  const oraFine = `${String((parseInt(ora.slice(0, 2), 10) + 1) % 24).padStart(2, "0")}:00`;
  const inp = "w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:border-green-500 focus:outline-none transition-colors disabled:bg-gray-50 disabled:text-gray-500";

  const handlePrenota = async () => {
    setSaving(true); setErrorModal("");
    try {
      const result = await apiJson<{ stato: string }>(`/api/sedi/${idSede}/prenotazioni`, token, "POST", {
        idCampo: campo.idCampo,
        data,
        oraInizio: ora,
        emailCliente: isFounder ? email.trim() : "",
      });
      notifyPrenotazioniChanged();
      router.push(`/dashboard?booked=${result.stato}`);
    } catch (e) {
      setErrorModal(e instanceof Error ? e.message : "Prenotazione fallita.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">Prenota campo</h3>
        <p className="text-xs text-gray-400 mb-4 capitalize">{formatDataIT(data)}</p>

        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Nome</label>
            <input className={inp} value={nome} onChange={(e) => setNome(e.target.value)} disabled={!isFounder} />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Cognome</label>
            <input className={inp} value={cognome} onChange={(e) => setCognome(e.target.value)} disabled={!isFounder} />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Mail</label>
            <input className={inp} type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={!isFounder} />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Campo</label>
            <input className={inp} value={campo.nomeCampo} disabled />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Orario</label>
            <input className={inp} value={`${ora} – ${oraFine}`} disabled />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Costo</label>
            <input className={inp} value={`€ ${campo.prezzoOrario.toFixed(2)}`} disabled />
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={handlePrenota} disabled={saving || (isFounder && !email.trim())}
              className="flex-1 px-5 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white text-sm font-semibold rounded-xl transition-colors">
              {saving ? "Prenotazione…" : "Prenota"}
            </button>
            <button onClick={onClose} disabled={saving}
              className="px-5 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm font-semibold rounded-xl transition-colors">
              Annulla
            </button>
          </div>
        </div>
      </div>

      {errorModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" onClick={(e) => e.stopPropagation()}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-xs text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-red-50 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-gray-800 mb-1">Errore!</h3>
            <p className="text-sm text-gray-500 mb-5">{errorModal} Riprova!</p>
            <button onClick={() => setErrorModal("")}
              className="w-full px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition-colors">
              Ho capito
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
