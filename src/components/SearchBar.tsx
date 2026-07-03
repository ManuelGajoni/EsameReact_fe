"use client";

import { useState, useRef, useEffect, useCallback } from "react";

const API_BASE_URL = "http://localhost:8080";

// ── tipi esportati ─────────────────────────────────────────────────────────────

export interface DisponibilitaResult {
  idCampo: string;
  nomeCampo: string;
  idSede: string;
  nomeSede: string;
  citta: string;
  slotDisponibili: string[];
}

// ── tipi interni ───────────────────────────────────────────────────────────────

interface CercaRisultato {
  tipo: "citta" | "sede";
  id: string | null;
  nome: string;
  citta: string | null;
}

type Selezione =
  | { tipo: "citta"; nome: string }
  | { tipo: "sede"; id: string; nomeSede: string }
  | null;

// ── costanti ───────────────────────────────────────────────────────────────────

const TUTTI_I_TIPI = ["Calcio a 5", "Calcio a 7", "Calcio a 11", "Padel", "Tennis"];

const ICONE: Record<string, string> = {
  "Calcio a 5": "⚽",
  "Calcio a 7": "⚽",
  "Calcio a 11": "⚽",
  "Tennis": "🎾",
  "Padel": "🏓",
};

const MONTH_NAMES = [
  "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
  "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre",
];
const DAY_NAMES = ["Lu", "Ma", "Me", "Gi", "Ve", "Sa", "Do"];

function getNextHalfHour(): string {
  const now = new Date();
  if (now.getMinutes() < 30) {
    now.setMinutes(30, 0, 0);
  } else {
    now.setHours(now.getHours() + 1, 0, 0, 0);
  }
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

function formatDateIT(date: Date): string {
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${d}/${m}/${date.getFullYear()}`;
}

function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let h = 0; h < 24; h++) {
    slots.push(`${String(h).padStart(2, "0")}:00`);
    slots.push(`${String(h).padStart(2, "0")}:30`);
  }
  return slots;
}
const TIME_SLOTS = generateTimeSlots();

// ── FieldTypeDropdown con opzioni dinamiche ────────────────────────────────────

function FieldTypeDropdown({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  return (
    <div className="relative flex items-center border-b md:border-b-0 md:border-r border-gray-200" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-3 w-full h-full text-left hover:bg-gray-50 transition-colors"
      >
        <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M3 10h18M3 14h18M10 3v18M14 3v18" />
        </svg>
        <span className={`text-sm whitespace-nowrap flex items-center gap-1.5 ${value ? "text-gray-700" : "text-gray-400"}`}>
          {value ? (
            <><span>{ICONE[value] ?? "🏟️"}</span><span>{value}</span></>
          ) : "Tipo di campo"}
        </span>
        <svg className={`w-3.5 h-3.5 text-gray-400 ml-1 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 min-w-[190px] overflow-hidden">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => { onChange(opt); setIsOpen(false); }}
              className={[
                "w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors",
                opt === value ? "bg-green-50 text-green-700 font-semibold" : "text-gray-700 hover:bg-gray-50",
              ].join(" ")}
            >
              <span className="text-base w-5 text-center">{ICONE[opt] ?? "🏟️"}</span>
              <span className="flex-1">{opt}</span>
              {opt === value && (
                <svg className="w-4 h-4 text-green-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── CalendarDropdown ───────────────────────────────────────────────────────────

function CalendarDropdown({
  selectedDate, onSelect, onClose,
}: {
  selectedDate: Date; onSelect: (d: Date) => void; onClose: () => void;
}) {
  const [view, setView] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
  const year = view.getFullYear();
  const month = view.getMonth();
  const firstDayRaw = new Date(year, month, 1).getDay();
  const adjustedFirst = firstDayRaw === 0 ? 6 : firstDayRaw - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const cells: (number | null)[] = [
    ...Array<null>(adjustedFirst).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 z-50 w-72">
      <div className="flex items-center justify-between mb-3">
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
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((cell, i) => {
          if (cell === null) return <div key={`e${i}`} />;
          const cellDate = new Date(year, month, cell);
          const isPast = cellDate < today;
          const isSelected =
            cell === selectedDate.getDate() &&
            month === selectedDate.getMonth() &&
            year === selectedDate.getFullYear();
          return (
            <button key={cell} disabled={isPast}
              onClick={() => { onSelect(new Date(year, month, cell)); onClose(); }}
              className={[
                "flex items-center justify-center text-sm rounded-full w-8 h-8 mx-auto transition-colors",
                isPast ? "text-gray-300 cursor-not-allowed" : "cursor-pointer hover:bg-green-50",
                isSelected ? "bg-green-600 text-white hover:bg-green-600" : "",
              ].join(" ")}
            >{cell}</button>
          );
        })}
      </div>
    </div>
  );
}

// ── TimeModal ──────────────────────────────────────────────────────────────────

function TimeModal({ selectedTime, onSelect, onClose }: {
  selectedTime: string; onSelect: (t: string) => void; onClose: () => void;
}) {
  const selectedRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { selectedRef.current?.scrollIntoView({ block: "center", behavior: "instant" }); }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl p-5 w-56" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-sm font-semibold text-gray-700 mb-3 text-center">Seleziona orario</h3>
        <div className="max-h-64 overflow-y-auto flex flex-col gap-1 pr-1">
          {TIME_SLOTS.map((slot) => (
            <button key={slot} ref={slot === selectedTime ? selectedRef : undefined}
              onClick={() => { onSelect(slot); onClose(); }}
              className={[
                "w-full text-center py-2 rounded-lg text-sm font-medium transition-colors",
                slot === selectedTime ? "bg-green-600 text-white" : "hover:bg-green-50 text-gray-700",
              ].join(" ")}
            >{slot}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── SearchBar principale ───────────────────────────────────────────────────────

export default function SearchBar({ onResults }: { onResults: (results: DisponibilitaResult[]) => void }) {
  const [query, setQuery] = useState("");
  const [selezione, setSelezione] = useState<Selezione>(null);
  const [suggestions, setSuggestions] = useState<CercaRisultato[]>([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const [fieldType, setFieldType] = useState("");
  const [tipiDisponibili, setTipiDisponibili] = useState<string[]>(TUTTI_I_TIPI);

  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [selectedTime, setSelectedTime] = useState<string>(() => getNextHalfHour());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const calendarRef = useRef<HTMLDivElement>(null);

  // ── autocomplete ─────────────────────────────────────────────────────────────

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setSuggestions([]); setSuggestionsOpen(false); return; }
    const token = localStorage.getItem("access_token");
    try {
      const res = await fetch(`${API_BASE_URL}/api/cerca?q=${encodeURIComponent(q)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) return;
      const data: CercaRisultato[] = await res.json();
      setSuggestions(data);
      setSuggestionsOpen(data.length > 0);
    } catch { /* ignora errori di rete */ }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchSuggestions(query), 300);
    return () => clearTimeout(timer);
  }, [query, fetchSuggestions]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSuggestionsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!isCalendarOpen) return;
    const handler = (e: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) setIsCalendarOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isCalendarOpen]);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    if (selezione) {
      setSelezione(null);
      setTipiDisponibili(TUTTI_I_TIPI);
    }
  };

  const handleSelectRisultato = async (r: CercaRisultato) => {
    setQuery(r.nome);
    setSuggestionsOpen(false);
    setSuggestions([]);

    if (r.tipo === "citta") {
      setSelezione({ tipo: "citta", nome: r.nome });
      setTipiDisponibili(TUTTI_I_TIPI);
    } else {
      setSelezione({ tipo: "sede", id: r.id!, nomeSede: r.nome });
      try {
        const token = localStorage.getItem("access_token");
        const res = await fetch(`${API_BASE_URL}/api/sedi/${r.id}/tipi-campo`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const tipi: string[] = await res.json();
          const lista = tipi.length > 0 ? tipi : TUTTI_I_TIPI;
          setTipiDisponibili(lista);
          if (!lista.includes(fieldType)) setFieldType(lista[0] ?? "");
        }
      } catch { /* ignora */ }
    }
  };

  // ── CERCA ────────────────────────────────────────────────────────────────────

  const handleCerca = async () => {
    if (!selezione) return;

    const params = new URLSearchParams();
    if (selezione.tipo === "sede") params.set("idSede", selezione.id);
    else params.set("citta", selezione.nome);
    if (fieldType) params.set("tipoCampo", fieldType);

    // data in formato ISO "YYYY-MM-DD"
    const y = selectedDate.getFullYear();
    const mo = String(selectedDate.getMonth() + 1).padStart(2, "0");
    const d = String(selectedDate.getDate()).padStart(2, "0");
    params.set("data", `${y}-${mo}-${d}`);
    params.set("oraInizio", selectedTime);

    const token = localStorage.getItem("access_token");
    setIsSearching(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/disponibilita?${params}`, {
        headers: { Authorization: `Bearer ${token ?? ""}` },
      });
      if (res.ok) {
        const data: DisponibilitaResult[] = await res.json();
        onResults(data);
      }
    } catch { /* ignora */ } finally {
      setIsSearching(false);
    }
  };

  // ── render ───────────────────────────────────────────────────────────────────

  return (
    <div className="bg-green-600 py-4 shadow-md">
      <div className="max-w-7xl mx-auto px-6">
        <div className="bg-white rounded-2xl shadow-lg flex flex-col md:flex-row items-stretch overflow-visible">

          {/* Città / centro sportivo */}
          <div className="relative flex-1 flex items-center gap-2 px-4 py-3 border-b md:border-b-0 md:border-r border-gray-200" ref={searchRef}>
            <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={handleQueryChange}
              onFocus={() => { if (suggestions.length > 0) setSuggestionsOpen(true); }}
              placeholder="Città o centro sportivo"
              className="w-full text-sm text-gray-700 placeholder-gray-400 outline-none bg-transparent"
              autoComplete="off"
            />

            {/* Dropdown suggerimenti misti */}
            {suggestionsOpen && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                {suggestions.map((r, i) => (
                  <button
                    key={`${r.tipo}-${r.id ?? r.nome}-${i}`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelectRisultato(r)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-green-50 transition-colors group"
                  >
                    {r.tipo === "citta" ? (
                      /* Icona città */
                      <svg className="w-4 h-4 text-blue-400 group-hover:text-blue-500 shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M3 21h18M3 10.5L12 3l9 7.5M9 21v-6h6v6" />
                      </svg>
                    ) : (
                      /* Icona sede */
                      <svg className="w-4 h-4 text-gray-300 group-hover:text-green-500 shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-800">{r.nome}</p>
                      {r.tipo === "citta" ? (
                        <p className="text-xs text-blue-400">Città</p>
                      ) : (
                        <p className="text-xs text-gray-400">{r.citta}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tipo di campo (dinamico) */}
          <FieldTypeDropdown value={fieldType} onChange={setFieldType} options={tipiDisponibili} />

          {/* Data */}
          <div className="relative flex items-center border-b md:border-b-0 md:border-r border-gray-200" ref={calendarRef}>
            <button onClick={() => setIsCalendarOpen(!isCalendarOpen)}
              className="flex items-center gap-2 px-4 py-3 w-full h-full text-left hover:bg-gray-50 transition-colors">
              <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm text-gray-700 whitespace-nowrap">{formatDateIT(selectedDate)}</span>
            </button>
            {isCalendarOpen && (
              <CalendarDropdown selectedDate={selectedDate} onSelect={setSelectedDate} onClose={() => setIsCalendarOpen(false)} />
            )}
          </div>

          {/* Orario */}
          <div className="flex items-center gap-2 px-4 py-3 border-b md:border-b-0 md:border-r border-gray-200">
            <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 6v6l4 2m4-2a8 8 0 11-16 0 8 8 0 0116 0z" />
            </svg>
            <button onClick={() => setIsTimeModalOpen(true)}
              className="text-sm text-gray-700 whitespace-nowrap hover:text-green-600 transition-colors">
              {selectedTime}
            </button>
          </div>

          {/* Bottone CERCA */}
          <div className="px-3 py-3 flex items-center">
            <button
              onClick={handleCerca}
              disabled={!selezione || isSearching}
              className={[
                "w-full md:w-auto font-bold px-8 py-2.5 rounded-xl transition-colors text-sm tracking-widest",
                selezione && !isSearching
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed",
              ].join(" ")}
            >
              {isSearching ? "..." : "CERCA"}
            </button>
          </div>
        </div>
      </div>

      {isTimeModalOpen && (
        <TimeModal selectedTime={selectedTime} onSelect={setSelectedTime} onClose={() => setIsTimeModalOpen(false)} />
      )}
    </div>
  );
}
