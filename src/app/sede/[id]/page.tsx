"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PrenotazioniTab from "./PrenotazioniTab";
import ConfermaPrenotazioniTab from "./ConfermaPrenotazioniTab";
import CalendarioTab from "./CalendarioTab";

const API_BASE_URL = "http://localhost:8080";

// 0=domenica … 6=sabato (come PostgreSQL)
const GIORNI = ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"];
const ORDINE_GIORNI = [1, 2, 3, 4, 5, 6, 0];

interface OrarioDto { giorno: number; oraApertura: string; oraChiusura: string; }
interface SedeInfo {
  idSede: string; nomeSede: string; citta: string;
  numeroTelefono: string | null; descrizione: string | null;
  ruolo: string | null; orari: OrarioDto[];
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

// ── Pagina principale ─────────────────────────────────────────────────────────

export default function SedePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [sede, setSede] = useState<SedeInfo | null>(null);
  const [loadingSede, setLoadingSede] = useState(true);
  const [error, setError] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [tab, setTab] = useState<"prenotazioni" | "conferma" | "calendario" | "info">("calendario");

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

  const handleOrariSaved = (nuoviOrari: OrarioDto[]) =>
    setSede((prev) => prev ? { ...prev, orari: nuoviOrari } : prev);

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
          <div className="h-10 w-64 bg-gray-200 animate-pulse rounded-xl mb-6" />
        ) : error ? (
          <p className="text-red-500 mb-6">{error}</p>
        ) : (
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-800">{sede?.nomeSede}</h1>
            <p className="text-gray-400 text-sm mt-1 flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {sede?.citta}
            </p>
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
          <TabButton label="Informazioni" active={tab === "info"} onClick={() => setTab("info")} />
        </div>

        {/*
          Tutte le tab a cui l'utente ha accesso vengono montate insieme al primo
          caricamento e restano montate (nascoste con "hidden") quando si cambia tab:
          così i dati vengono richiesti una sola volta e cambiare tab è istantaneo,
          senza spinner ripetuti.
        */}
        {!loadingSede && sede && token && (
          <>
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

            <div className={tab === "info" ? "space-y-4" : "hidden"}>
              <SedeInfoCard sede={sede} token={token} onSaved={setSede} />
              <OrariCard sede={sede} token={token} onSaved={handleOrariSaved} />
            </div>
          </>
        )}
        {(loadingSede || !sede || !token) && !error && <Spinner />}
      </div>
    </div>
  );
}
