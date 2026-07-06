"use client";

import { useCallback, useEffect, useState } from "react";
import { immagineCampo } from "@/lib/immagini";

const API_BASE_URL = "http://localhost:8080";
const PRIMA_PAGINA = 3;
const PAGINE_SUCCESSIVE = 5;

interface CampoLite { idCampo: string; nome: string; tipo: string; }

interface Commento {
  id: string;
  autore: string;
  testo: string;
  valutazione: number;
  votiSu: number;
  votiGiu: number;
  mioVoto: "su" | "giu" | null;
  createdAt: string;
}

function Stars({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(n)}
          className={onChange ? "cursor-pointer" : "cursor-default"}
          aria-label={`${n} stelle`}
        >
          <svg
            className={`w-4 h-4 ${n <= value ? "text-amber-400" : "text-gray-200"}`}
            fill="currentColor" viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.958a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.368 2.447a1 1 0 00-.363 1.118l1.287 3.957c.3.922-.755 1.688-1.54 1.118l-3.368-2.447a1 1 0 00-1.175 0l-3.368 2.447c-.784.57-1.838-.196-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.983 9.385c-.783-.57-.38-1.81.588-1.81h4.163a1 1 0 00.95-.69l1.285-3.958z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

function CommentoCard({ commento, onVota }: { commento: Commento; onVota: (voto: "su" | "giu") => void }) {
  const data = new Date(commento.createdAt).toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" });
  return (
    <div className="border border-gray-100 rounded-xl p-4 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-gray-700">{commento.autore}</span>
        <span className="text-xs text-gray-400">{data}</span>
      </div>
      <Stars value={commento.valutazione} />
      <p className="text-sm text-gray-600">{commento.testo}</p>
      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={() => onVota("su")}
          className={["flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg transition-colors",
            commento.mioVoto === "su" ? "bg-green-100 text-green-700" : "text-gray-400 hover:bg-gray-50"].join(" ")}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-8.19a2 2 0 01-2-2v-6.5a2 2 0 01.211-.894l3.5-7A2 2 0 0110.737 3H12a1 1 0 011 1v6z" />
          </svg>
          {commento.votiSu}
        </button>
        <button
          onClick={() => onVota("giu")}
          className={["flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg transition-colors",
            commento.mioVoto === "giu" ? "bg-red-100 text-red-600" : "text-gray-400 hover:bg-gray-50"].join(" ")}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.737 3h8.19a2 2 0 012 2v6.5a2 2 0 01-.211.894l-3.5 7A2 2 0 0113.263 21H12a1 1 0 01-1-1v-6z" />
          </svg>
          {commento.votiGiu}
        </button>
      </div>
    </div>
  );
}

function CampoFeed({ campo, token, isCliente }: { campo: CampoLite; token: string; isCliente: boolean }) {
  const [commenti, setCommenti] = useState<Commento[]>([]);
  const [totale, setTotale] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const [testo, setTesto] = useState("");
  const [valutazione, setValutazione] = useState(5);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const carica = useCallback((offset: number, limit: number, append: boolean) => {
    const setBusy = append ? setLoadingMore : setLoading;
    setBusy(true); setError("");
    fetch(`${API_BASE_URL}/api/campi/${campo.idCampo}/commenti?offset=${offset}&limit=${limit}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data: { commenti: Commento[]; totale: number }) => {
        setCommenti((prev) => append ? [...prev, ...data.commenti] : data.commenti);
        setTotale(data.totale);
      })
      .catch(() => setError("Impossibile caricare i commenti."))
      .finally(() => setBusy(false));
  }, [campo.idCampo, token]);

  useEffect(() => { carica(0, PRIMA_PAGINA, false); }, [carica]);

  const handleVota = (idCommento: string, voto: "su" | "giu") => {
    fetch(`${API_BASE_URL}/api/campi/${campo.idCampo}/commenti/${idCommento}/voto`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ voto }),
    })
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((aggiornato: Commento) => {
        setCommenti((prev) => prev.map((c) => c.id === idCommento ? aggiornato : c));
      })
      .catch(() => setError("Voto non riuscito. Riprova."));
  };

  const handleInvia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testo.trim()) { setSaveError("Scrivi un commento prima di inviare."); return; }
    setSaving(true); setSaveError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/campi/${campo.idCampo}/commenti`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ testo: testo.trim(), valutazione }),
      });
      if (!res.ok) throw new Error();
      setTesto(""); setValutazione(5);
      carica(0, Math.max(commenti.length, PRIMA_PAGINA), false);
    } catch {
      setSaveError("Invio del commento fallito. Riprova.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="relative h-48 bg-gradient-to-br from-green-100 to-emerald-200 flex items-center justify-center">
        <svg className="w-12 h-12 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M4 4h16v16H4V4zm4 16V4m8 16V4M4 12h16" />
        </svg>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={immagineCampo(campo.nome)}
          alt={campo.nome}
          onError={(e) => { e.currentTarget.style.opacity = "0"; }}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <span className="absolute bottom-3 left-4 text-white font-bold text-lg drop-shadow">{campo.nome}</span>
      </div>

      <div className="p-6 space-y-4">
        {isCliente && (
          <form onSubmit={handleInvia} className="border border-gray-100 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">La tua valutazione</span>
              <Stars value={valutazione} onChange={setValutazione} />
            </div>
            <textarea
              value={testo}
              onChange={(e) => setTesto(e.target.value)}
              placeholder="Lascia un commento su questo campo…"
              rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm resize-none focus:border-green-500 focus:outline-none transition-colors"
            />
            {saveError && <p className="text-xs text-red-600">{saveError}</p>}
            <button type="submit" disabled={saving}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm font-semibold rounded-xl transition-colors">
              {saving ? "Invio…" : "Pubblica commento"}
            </button>
          </form>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-7 h-7 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : commenti.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">Ancora nessun commento per questo campo.</p>
        ) : (
          <div className="space-y-3">
            {commenti.map((c) => (
              <CommentoCard key={c.id} commento={c} onVota={(voto) => handleVota(c.id, voto)} />
            ))}
          </div>
        )}

        {!loading && commenti.length < totale && (
          <div className="flex justify-center pt-2">
            <button
              onClick={() => carica(commenti.length, PAGINE_SUCCESSIVE, true)}
              disabled={loadingMore}
              className="px-4 py-2 border border-gray-200 hover:bg-gray-50 disabled:opacity-50 text-gray-600 text-sm font-semibold rounded-xl transition-colors"
            >
              {loadingMore ? "Caricamento…" : "Carica altri commenti"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SocialTab({
  campi, token, isCliente,
}: {
  campi: CampoLite[];
  token: string;
  isCliente: boolean;
}) {
  const [selected, setSelected] = useState(campi[0]?.idCampo ?? "");

  if (campi.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm px-6 py-10 text-center text-sm text-gray-400">
        Nessun campo configurato per questa sede.
      </div>
    );
  }

  const campo = campi.find((c) => c.idCampo === selected) ?? campi[0];

  return (
    <div className="space-y-4">
      {campi.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {campi.map((c) => (
            <button
              key={c.idCampo}
              onClick={() => setSelected(c.idCampo)}
              className={[
                "px-4 py-2 text-sm font-semibold rounded-xl transition-colors",
                c.idCampo === campo.idCampo ? "bg-green-600 text-white shadow-sm" : "bg-white text-gray-500 hover:text-gray-800 border border-gray-100",
              ].join(" ")}
            >
              {c.nome}
            </button>
          ))}
        </div>
      )}
      <CampoFeed key={campo.idCampo} campo={campo} token={token} isCliente={isCliente} />
    </div>
  );
}
