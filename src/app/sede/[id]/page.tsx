"use client";

import { Fragment, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PrenotazioniTab from "./PrenotazioniTab";
import ConfermaPrenotazioniTab from "./ConfermaPrenotazioniTab";
import CalendarioTab from "./CalendarioTab";
import SocialTab from "./SocialTab";
import DiventaClienteModal from "@/components/DiventaClienteModal";
import { immagineSede } from "@/lib/immagini";

const API_BASE_URL = "http://localhost:8080";

// 0=domenica … 6=sabato (come PostgreSQL)
const GIORNI = ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"];
const ORDINE_GIORNI = [1, 2, 3, 4, 5, 6, 0];
const TIPOLOGIE_CAMPO = ["Calcio a 5", "Calcio a 7", "Calcio a 11", "Padel", "Tennis"];

interface OrarioDto { giorno: number; oraApertura: string; oraChiusura: string; }
interface CampoInfo { idCampo: string; nome: string; tipo: string; prezzoOrario: number; commento: string | null; }
interface SedeInfo {
  idSede: string; nomeSede: string; citta: string;
  numeroTelefono: string | null; descrizione: string | null;
  ruolo: string | null; orari: OrarioDto[]; campi: CampoInfo[];
}
interface OrarioForm { giorno: number; aperto: boolean; oraApertura: string; oraChiusura: string; }

function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={["px-5 py-2.5 text-sm font-semibold rounded-xl transition-colors",
      active ? "bg-green-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"].join(" ")}>
      {label}
    </button>
  );
}

// ── Card dettagli sede ────────────────────────────────────────────────────────

function SedeInfoCard({ sede, token, onSaved }: { sede: SedeInfo; token: string; onSaved: (s: SedeInfo) => void }) {
  const isFounder = sede.ruolo === "founder";
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ nomeSede: sede.nomeSede ?? "", citta: sede.citta ?? "", numeroTelefono: sede.numeroTelefono ?? "", descrizione: sede.descrizione ?? "" });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const inp = "w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:border-green-500 focus:outline-none transition-colors";

  const handleSave = async () => {
    setSaving(true); setErr("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/sedi/${sede.idSede}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      onSaved(await res.json());
      setEditing(false);
    } catch { setErr("Salvataggio fallito. Riprova."); }
    finally { setSaving(false); }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm px-6 py-5">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Dettagli sede</h2>
        {isFounder && !editing && (
          <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 text-sm font-medium text-green-600 hover:text-green-700 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-2a2 2 0 01.586-1.414z" />
            </svg>
            Modifica
          </button>
        )}
      </div>
      {err && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{err}</div>}
      {editing ? (
        <div className="space-y-4">
          {(["nomeSede", "citta", "numeroTelefono"] as const).map((f) => (
            <div key={f}>
              <label className="block text-xs text-gray-400 mb-1">{f === "nomeSede" ? "Nome sede" : f === "citta" ? "Città" : "Numero di telefono"}</label>
              <input className={inp} value={form[f]} onChange={(e) => setForm((p) => ({ ...p, [f]: e.target.value }))} />
            </div>
          ))}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Descrizione</label>
            <textarea className={`${inp} resize-none`} rows={3} value={form.descrizione} onChange={(e) => setForm((p) => ({ ...p, descrizione: e.target.value }))} />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={handleSave} disabled={saving} className="px-5 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm font-semibold rounded-xl transition-colors">
              {saving ? "Salvataggio…" : "Salva"}
            </button>
            <button onClick={() => { setEditing(false); setErr(""); }} disabled={saving} className="px-5 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm font-semibold rounded-xl transition-colors">
              Annulla
            </button>
          </div>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {[["Nome sede", sede.nomeSede], ["Città", sede.citta], ["Numero di telefono", sede.numeroTelefono], ["Descrizione", sede.descrizione]].map(([label, value]) => (
            <div key={label} className="py-3.5 flex flex-col sm:flex-row sm:items-start gap-1">
              <span className="text-sm text-gray-400 sm:w-48 shrink-0">{label}</span>
              <span className="text-sm font-medium text-gray-800">{value ?? "—"}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Card orari di apertura ────────────────────────────────────────────────────

function OrariCard({ sede, token, onSaved }: { sede: SedeInfo; token: string; onSaved: (orari: OrarioDto[]) => void }) {
  const isFounder = sede.ruolo === "founder";
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const orariMap = Object.fromEntries(sede.orari.map((o) => [o.giorno, o]));

  const buildForm = (): OrarioForm[] =>
    ORDINE_GIORNI.map((g) => ({
      giorno: g,
      aperto: !!orariMap[g],
      oraApertura: orariMap[g]?.oraApertura.slice(0, 5) ?? "09:00",
      oraChiusura: orariMap[g]?.oraChiusura.slice(0, 5) ?? "22:00",
    }));

  const [form, setForm] = useState<OrarioForm[]>(buildForm);

  const toggle = (giorno: number) =>
    setForm((prev) => prev.map((r) => r.giorno === giorno ? { ...r, aperto: !r.aperto } : r));

  const setTime = (giorno: number, field: "oraApertura" | "oraChiusura", val: string) =>
    setForm((prev) => prev.map((r) => r.giorno === giorno ? { ...r, [field]: val } : r));

  const handleSave = async () => {
    setSaving(true); setErr("");
    const payload = form.filter((r) => r.aperto).map(({ giorno, oraApertura, oraChiusura }) => ({ giorno, oraApertura, oraChiusura }));
    try {
      const res = await fetch(`${API_BASE_URL}/api/sedi/${sede.idSede}/orari`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      onSaved(await res.json());
      setEditing(false);
    } catch { setErr("Salvataggio fallito. Riprova."); }
    finally { setSaving(false); }
  };

  const handleCancel = () => { setForm(buildForm()); setErr(""); setEditing(false); };

  const inp = "px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:border-green-500 focus:outline-none transition-colors w-28";

  return (
    <div className="bg-white rounded-2xl shadow-sm px-6 py-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Orari di apertura</h2>
        {isFounder && !editing && (
          <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 text-sm font-medium text-green-600 hover:text-green-700 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-2a2 2 0 01.586-1.414z" />
            </svg>
            Modifica
          </button>
        )}
      </div>
      {err && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{err}</div>}

      {editing ? (
        <div className="space-y-2">
          {form.map((r) => (
            <div key={r.giorno} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
              {/* Nome giorno */}
              <span className="text-sm font-medium text-gray-700 w-24 shrink-0">{GIORNI[r.giorno]}</span>

              {/* Toggle aperto/chiuso */}
              <button
                onClick={() => toggle(r.giorno)}
                className={["px-3 py-1 rounded-full text-xs font-semibold transition-colors shrink-0",
                  r.aperto ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200"].join(" ")}
              >
                {r.aperto ? "Aperto" : "Chiuso"}
              </button>

              {/* Orari — visibili solo se aperto */}
              {r.aperto && (
                <div className="flex items-center gap-2">
                  <input type="time" value={r.oraApertura} onChange={(e) => setTime(r.giorno, "oraApertura", e.target.value)} className={inp} />
                  <span className="text-gray-400 text-sm">–</span>
                  <input type="time" value={r.oraChiusura} onChange={(e) => setTime(r.giorno, "oraChiusura", e.target.value)} className={inp} />
                </div>
              )}
            </div>
          ))}
          <div className="flex gap-3 pt-3">
            <button onClick={handleSave} disabled={saving} className="px-5 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm font-semibold rounded-xl transition-colors">
              {saving ? "Salvataggio…" : "Salva"}
            </button>
            <button onClick={handleCancel} disabled={saving} className="px-5 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm font-semibold rounded-xl transition-colors">
              Annulla
            </button>
          </div>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {ORDINE_GIORNI.map((g) => {
            const o = orariMap[g];
            return (
              <div key={g} className="py-3 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 w-28">{GIORNI[g]}</span>
                {o ? (
                  <span className="text-sm text-gray-800">{o.oraApertura.slice(0, 5)} – {o.oraChiusura.slice(0, 5)}</span>
                ) : (
                  <span className="text-sm text-red-400 font-medium">Chiuso</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Modale creazione campo ────────────────────────────────────────────────────

function CreaCampoModal({
  idSede, token, onClose, onCreated,
}: {
  idSede: string;
  token: string;
  onClose: () => void;
  onCreated: (campi: CampoInfo[]) => void;
}) {
  const [tipologia, setTipologia] = useState(TIPOLOGIE_CAMPO[0]);
  const [prezzoOrario, setPrezzoOrario] = useState("20.00");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const inp = "w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:border-green-500 focus:outline-none transition-colors";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const prezzo = parseFloat(prezzoOrario);
    if (isNaN(prezzo) || prezzo <= 0) {
      setError("Inserisci un costo orario valido.");
      return;
    }
    setSaving(true); setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/sedi/${idSede}/campi`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ nome: tipologia, prezzoOrario: prezzo }),
      });
      if (!res.ok) throw new Error();
      onCreated(await res.json());
    } catch {
      setError("Creazione del campo fallita. Riprova.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Nuovo campo</h3>

        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Tipologia</label>
            <select className={inp} value={tipologia} onChange={(e) => setTipologia(e.target.value)}>
              {TIPOLOGIE_CAMPO.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Costo orario (€)</label>
            <input type="number" min="0" step="0.5" className={inp} value={prezzoOrario} onChange={(e) => setPrezzoOrario(e.target.value)} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving}
              className="flex-1 px-5 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm font-semibold rounded-xl transition-colors">
              {saving ? "Creazione…" : "Aggiungi campo"}
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

// ── Modale conferma eliminazione campo ────────────────────────────────────────

function EliminaCampoModal({
  idSede, campo, token, onClose, onDeleted,
}: {
  idSede: string;
  campo: CampoInfo;
  token: string;
  onClose: () => void;
  onDeleted: (campi: CampoInfo[]) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleConfirm = async () => {
    setBusy(true); setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/sedi/${idSede}/campi/${campo.idCampo}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      onDeleted(await res.json());
    } catch {
      setError("Eliminazione del campo fallita. Riprova.");
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center" onClick={(e) => e.stopPropagation()}>
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-red-50 flex items-center justify-center">
          <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3m-9 0h12" />
          </svg>
        </div>
        <h3 className="text-sm font-bold text-gray-800 mb-1">Eliminare il campo?</h3>
        <p className="text-sm text-gray-500 mb-5">
          Stai per eliminare <span className="font-semibold text-gray-700">{campo.nome}</span>.
          Non sarà più prenotabile, ma le prenotazioni già esistenti resteranno intatte.
        </p>
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 text-left">{error}</div>}
        <div className="flex gap-3">
          <button onClick={handleConfirm} disabled={busy}
            className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white text-sm font-semibold rounded-xl transition-colors">
            {busy ? "Eliminazione…" : "Sì, elimina"}
          </button>
          <button onClick={onClose} disabled={busy}
            className="flex-1 px-4 py-2.5 border border-gray-200 hover:bg-gray-50 disabled:opacity-50 text-gray-600 text-sm font-semibold rounded-xl transition-colors">
            Annulla
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Card campi e tariffario ───────────────────────────────────────────────────

interface CampoForm { prezzo: string; commento: string; }

function CampiCard({ sede, token, onSaved }: { sede: SedeInfo; token: string; onSaved: (campi: CampoInfo[]) => void }) {
  const isFounder = sede.ruolo === "founder";
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [creatingCampo, setCreatingCampo] = useState(false);
  const [deleting, setDeleting] = useState<CampoInfo | null>(null);

  const buildForm = () => Object.fromEntries(
    sede.campi.map((c) => [c.idCampo, { prezzo: c.prezzoOrario.toFixed(2), commento: c.commento ?? "" }])
  );
  const [form, setForm] = useState<Record<string, CampoForm>>(buildForm);

  const setPrezzo = (idCampo: string, val: string) =>
    setForm((prev) => ({ ...prev, [idCampo]: { ...prev[idCampo], prezzo: val } }));

  const setCommento = (idCampo: string, val: string) =>
    setForm((prev) => ({ ...prev, [idCampo]: { ...prev[idCampo], commento: val } }));

  const handleSave = async () => {
    setSaving(true); setErr("");
    try {
      let campiAggiornati = sede.campi;
      for (const c of sede.campi) {
        const f = form[c.idCampo];
        const prezzo = parseFloat(f.prezzo);
        if (isNaN(prezzo) || prezzo <= 0) throw new Error();
        if (prezzo === c.prezzoOrario && f.commento === (c.commento ?? "")) continue;
        const res = await fetch(`${API_BASE_URL}/api/sedi/${sede.idSede}/campi/${c.idCampo}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ prezzoOrario: prezzo, commento: f.commento }),
        });
        if (!res.ok) throw new Error();
        campiAggiornati = await res.json();
      }
      onSaved(campiAggiornati);
      setEditing(false);
    } catch { setErr("Salvataggio fallito. Controlla che i prezzi siano validi e riprova."); }
    finally { setSaving(false); }
  };

  const handleCancel = () => { setForm(buildForm()); setErr(""); setEditing(false); };

  return (
    <div className="bg-white rounded-2xl shadow-sm px-6 py-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Campi e tariffario</h2>
        <div className="flex items-center gap-3">
          {isFounder && (
            <button onClick={() => setCreatingCampo(true)} aria-label="Aggiungi campo"
              className="w-7 h-7 flex items-center justify-center rounded-full bg-green-50 hover:bg-green-100 text-green-600 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          )}
          {isFounder && !editing && sede.campi.length > 0 && (
            <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 text-sm font-medium text-green-600 hover:text-green-700 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-2a2 2 0 01.586-1.414z" />
              </svg>
              Modifica
            </button>
          )}
        </div>
      </div>
      {err && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{err}</div>}

      {sede.campi.length === 0 ? (
        <p className="text-sm text-gray-400">Nessun campo configurato per questa sede.</p>
      ) : (
        <div className="divide-y divide-gray-100">
          {sede.campi.map((c) => (
            <div key={c.idCampo} className="py-3 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-medium text-gray-700 truncate">{c.nome}</span>
                  <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full capitalize shrink-0">{c.tipo}</span>
                </div>
                {editing ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-gray-400">€</span>
                      <input
                        type="number" min="0" step="0.5"
                        value={form[c.idCampo]?.prezzo ?? ""}
                        onChange={(e) => setPrezzo(c.idCampo, e.target.value)}
                        className="w-20 px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-right focus:border-green-500 focus:outline-none transition-colors"
                      />
                      <span className="text-sm text-gray-400">/h</span>
                    </div>
                    <button onClick={() => setDeleting(c)} aria-label="Elimina campo"
                      className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3m-9 0h12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <span className="text-sm font-medium text-gray-800 shrink-0">€ {c.prezzoOrario.toFixed(2)}/h</span>
                )}
              </div>

              {editing ? (
                <input
                  value={form[c.idCampo]?.commento ?? ""}
                  onChange={(e) => setCommento(c.idCampo, e.target.value)}
                  placeholder="Nota privata (visibile solo a te)"
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:border-green-500 focus:outline-none transition-colors"
                />
              ) : (
                isFounder && c.commento && (
                  <p className="text-xs text-gray-400 italic">{c.commento}</p>
                )
              )}
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="flex gap-3 pt-4">
          <button onClick={handleSave} disabled={saving} className="px-5 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm font-semibold rounded-xl transition-colors">
            {saving ? "Salvataggio…" : "Salva"}
          </button>
          <button onClick={handleCancel} disabled={saving} className="px-5 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm font-semibold rounded-xl transition-colors">
            Annulla
          </button>
        </div>
      )}

      {creatingCampo && (
        <CreaCampoModal
          idSede={sede.idSede}
          token={token}
          onClose={() => setCreatingCampo(false)}
          onCreated={(campi) => { onSaved(campi); setCreatingCampo(false); }}
        />
      )}

      {deleting && (
        <EliminaCampoModal
          idSede={sede.idSede}
          campo={deleting}
          token={token}
          onClose={() => setDeleting(null)}
          onDeleted={(campi) => { onSaved(campi); setDeleting(null); }}
        />
      )}
    </div>
  );
}

// ── Pagina principale ─────────────────────────────────────────────────────────

export default function SedePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [sede, setSede] = useState<SedeInfo | null>(null);
  const [loadingSede, setLoadingSede] = useState(true);
  const [error, setError] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [tab, setTab] = useState<"prenotazioni" | "conferma" | "calendario" | "social" | "info">("calendario");
  const [joiningCliente, setJoiningCliente] = useState(false);
  // Incrementato dopo un cambio che invalida i dati già caricati dalle tab (nuovi orari,
  // nuovo ruolo): forza lo smontaggio/rimontaggio del contenuto così ogni tab rifà il
  // fetch invece di restare con dati/cache stale finché non si ricarica la pagina a mano.
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const t = localStorage.getItem("access_token");
    if (!t) { router.push("/login"); return; }
    setToken(t);

    fetch(`${API_BASE_URL}/api/sedi/${id}`, { headers: { Authorization: `Bearer ${t}` } })
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data: SedeInfo) => {
        setSede(data);
        // i founder vedono le prenotazioni di default, i clienti il calendario
        setTab(data.ruolo === "founder" ? "prenotazioni" : "calendario");
      })
      .catch(() => setError("Impossibile caricare i dati della sede."))
      .finally(() => setLoadingSede(false));
  }, [id, router]);

  const isFounder = sede?.ruolo === "founder";

  const handleOrariSaved = (nuoviOrari: OrarioDto[]) => {
    setSede((prev) => prev ? { ...prev, orari: nuoviOrari } : prev);
    setReloadKey((k) => k + 1);
  };

  const handleCampiSaved = (nuoviCampi: CampoInfo[]) =>
    setSede((prev) => prev ? { ...prev, campi: nuoviCampi } : prev);

  const handleDiventaCliente = async () => {
    if (!token || !sede) return;
    const res = await fetch(`${API_BASE_URL}/api/sedi/${sede.idSede}/diventa-cliente`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error();
    const { ruolo }: { ruolo: string } = await res.json();
    setSede((prev) => prev ? { ...prev, ruolo } : prev);
    setJoiningCliente(false);
    setReloadKey((k) => k + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <button onClick={() => router.push("/dashboard")}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
            aria-label="Torna indietro">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-green-600 font-extrabold text-xl tracking-tight">Fields</span>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8">

        {/* Header */}
        {loadingSede ? (
          <div className="h-40 bg-gray-200 animate-pulse rounded-2xl mb-8" />
        ) : error ? (
          <p className="text-red-500 mb-6">{error}</p>
        ) : (
          <div className="relative h-40 rounded-2xl overflow-hidden mb-8 bg-gradient-to-br from-green-400 to-emerald-600">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={immagineSede(sede?.ruolo)}
              alt=""
              onError={(e) => { e.currentTarget.style.opacity = "0"; }}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

            <div className="absolute inset-0 p-5 flex items-end justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-white drop-shadow">{sede?.nomeSede}</h1>
                <p className="text-white/80 text-sm mt-1 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {sede?.citta}
                </p>
              </div>

              {sede?.ruolo === "founder" ? (
                <span className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full bg-amber-100 text-amber-700">
                  ⭐ Proprietario
                </span>
              ) : sede?.ruolo === "cliente" ? (
                <span className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full bg-green-100 text-green-700">
                  Cliente
                </span>
              ) : (
                <button onClick={() => setJoiningCliente(true)}
                  className="shrink-0 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition-colors">
                  Diventa Cliente
                </button>
              )}
            </div>
          </div>
        )}

        {/* Tab switcher — "Prenotazioni"/"Conferma Prenotazioni" solo per founder */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {isFounder && (
            <>
              <TabButton label="Prenotazioni" active={tab === "prenotazioni"} onClick={() => setTab("prenotazioni")} />
              <TabButton label="Conferma Prenotazioni" active={tab === "conferma"} onClick={() => setTab("conferma")} />
            </>
          )}
          <TabButton label="Calendario" active={tab === "calendario"} onClick={() => setTab("calendario")} />
          <TabButton label="Social" active={tab === "social"} onClick={() => setTab("social")} />
          <TabButton label="Informazioni" active={tab === "info"} onClick={() => setTab("info")} />
        </div>

        {/*
          Tutte le tab a cui l'utente ha accesso vengono montate insieme al primo
          caricamento e restano montate (nascoste con "hidden") quando si cambia tab:
          così i dati vengono richiesti una sola volta e cambiare tab è istantaneo,
          senza spinner ripetuti.
        */}
        {!loadingSede && sede && token && (
          <Fragment key={reloadKey}>
            {isFounder && (
              <div className={tab === "prenotazioni" ? "" : "hidden"}>
                <PrenotazioniTab idSede={sede.idSede} token={token} />
              </div>
            )}

            {isFounder && (
              <div className={tab === "conferma" ? "" : "hidden"}>
                <ConfermaPrenotazioniTab idSede={sede.idSede} token={token} />
              </div>
            )}

            <div className={tab === "calendario" ? "" : "hidden"}>
              <CalendarioTab idSede={sede.idSede} token={token} isFounder={!!isFounder} />
            </div>

            <div className={tab === "social" ? "" : "hidden"}>
              <SocialTab campi={sede.campi} token={token} isCliente={sede.ruolo === "cliente"} />
            </div>

            <div className={tab === "info" ? "space-y-4" : "hidden"}>
              <SedeInfoCard sede={sede} token={token} onSaved={setSede} />
              <CampiCard sede={sede} token={token} onSaved={handleCampiSaved} />
              <OrariCard sede={sede} token={token} onSaved={handleOrariSaved} />
            </div>
          </Fragment>
        )}
        {(loadingSede || !sede || !token) && !error && <Spinner />}
      </div>

      {joiningCliente && sede && (
        <DiventaClienteModal
          nomeSede={sede.nomeSede}
          onConfirm={handleDiventaCliente}
          onClose={() => setJoiningCliente(false)}
        />
      )}
    </div>
  );
}
