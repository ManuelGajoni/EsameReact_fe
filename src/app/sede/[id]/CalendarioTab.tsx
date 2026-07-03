"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiGet } from "./api";
import { GiornoStato } from "./types";
import DayAvailability from "./DayAvailability";
import { usePrenotazioniChanged } from "@/lib/prenotazioniEvents";

const MONTH_NAMES = [
  "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
  "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre",
];
const DAY_NAMES = ["Lu", "Ma", "Me", "Gi", "Ve", "Sa", "Do"];

const STATO_COLOR: Record<string, string> = {
  chiuso: "bg-gray-200 text-gray-400",
  occupato: "bg-amber-200 text-amber-800",
  libero: "bg-green-200 text-green-800",
};

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function CalendarioTab({ idSede, token, isFounder }: { idSede: string; token: string; isFounder: boolean }) {
  const [view, setView] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [giorni, setGiorni] = useState<GiornoStato[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openDay, setOpenDay] = useState<string | null>(null);

  // cache in memoria per mese ("YYYY-MM" -> giorni) così tornare su un mese già
  // visitato non richiede una nuova chiamata e non mostra lo spinner
  const cache = useRef<Map<string, GiornoStato[]>>(new Map());

  const year = view.getFullYear();
  const month = view.getMonth();

  const loadMonth = useCallback((forceRefresh: boolean) => {
    const key = `${year}-${month}`;
    const cached = !forceRefresh ? cache.current.get(key) : undefined;
    if (cached) {
      setGiorni(cached);
      setLoading(false);
      setError("");
      return;
    }

    setLoading(true); setError("");
    apiGet<GiornoStato[]>(`/api/sedi/${idSede}/calendario?anno=${year}&mese=${month + 1}`, token)
      .then((data) => { cache.current.set(key, data); setGiorni(data); })
      .catch(() => setError("Impossibile caricare il calendario."))
      .finally(() => setLoading(false));
  }, [idSede, token, year, month]);

  useEffect(() => { loadMonth(false); }, [loadMonth]);

  // una prenotazione creata/annullata/confermata altrove invalida l'intera cache
  // (potrebbe riguardare un mese già visitato) e ricarica il mese corrente
  usePrenotazioniChanged(useCallback(() => {
    cache.current.clear();
    loadMonth(true);
  }, [loadMonth]));

  const statoPerData = Object.fromEntries(giorni.map((g) => [g.data, g.stato]));

  const firstDayRaw = new Date(year, month, 1).getDay();
  const adjustedFirst = firstDayRaw === 0 ? 6 : firstDayRaw - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array<null>(adjustedFirst).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const today = todayIso();

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setView(new Date(year, month - 1, 1))}
            className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full text-gray-500 text-lg">‹</button>
          <span className="text-sm font-semibold text-gray-800">{MONTH_NAMES[month]} {year}</span>
          <button onClick={() => setView(new Date(year, month + 1, 1))}
            className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full text-gray-500 text-lg">›</button>
        </div>

        <div className="grid grid-cols-7 mb-1">
          {DAY_NAMES.map((d) => (
            <div key={d} className="text-center text-xs text-gray-400 font-medium pb-1">{d}</div>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-7 h-7 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <p className="text-red-500 text-sm py-4">{error}</p>
        ) : (
          <div className="grid grid-cols-7 gap-1.5">
            {cells.map((cell, i) => {
              if (cell === null) return <div key={`e${i}`} />;
              const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(cell).padStart(2, "0")}`;
              const stato = statoPerData[iso];
              const isPast = iso < today;
              return (
                <button
                  key={cell}
                  disabled={isPast || !stato}
                  onClick={() => setOpenDay(iso)}
                  className={[
                    "aspect-square rounded-xl text-sm font-medium flex items-center justify-center transition-opacity",
                    isPast ? "bg-gray-50 text-gray-300 cursor-not-allowed" : "cursor-pointer hover:opacity-80",
                    !isPast ? (STATO_COLOR[stato ?? "chiuso"] ?? "bg-gray-100 text-gray-400") : "",
                  ].join(" ")}
                >
                  {cell}
                </button>
              );
            })}
          </div>
        )}

        <div className="flex items-center gap-4 mt-5 text-xs text-gray-500">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-gray-200" /> Chiuso</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-200" /> Occupato</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-200" /> Libero</span>
        </div>
      </div>

      {openDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setOpenDay(null)}>
          <div className="bg-gray-50 rounded-2xl shadow-2xl p-5 w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                {new Date(openDay).toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })}
              </h3>
              <button onClick={() => setOpenDay(null)} className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 rounded-full text-gray-500">✕</button>
            </div>
            <DayAvailability idSede={idSede} token={token} data={openDay} isFounder={isFounder} />
          </div>
        </div>
      )}
    </div>
  );
}
