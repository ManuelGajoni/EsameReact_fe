"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

const API_BASE_URL = "http://localhost:8080";

export default function HeroSection() {
  const router = useRouter();
  const [citySearch, setCitySearch] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const requestId = useRef(0);
  const boxRef = useRef<HTMLDivElement>(null);

  const fetchCitta = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setSuggestions([]); setSuggestionsOpen(false); return; }
    const id = ++requestId.current;
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${API_BASE_URL}/api/sedi/citta?q=${encodeURIComponent(q)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok || id !== requestId.current) return;
      const data: string[] = await res.json();
      if (id === requestId.current) {
        setSuggestions(data);
        setSuggestionsOpen(data.length > 0);
      }
    } catch { /* ignora errori di rete */ }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchCitta(citySearch), 300);
    return () => clearTimeout(timer);
  }, [citySearch, fetchCitta]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setSuggestionsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleCerca = () => {
    const citta = citySearch.trim();
    if (!citta) return;
    router.push(`/ricerca-sedi?citta=${encodeURIComponent(citta)}`);
  };

  return (
    <main className="flex-1 flex flex-col items-center bg-gradient-to-b from-green-50 to-white px-6 py-24">
      <h1 className="text-3xl md:text-4xl font-bold text-gray-800 text-center mb-8 max-w-xl leading-tight">
        In quale città vuoi prenotare la prossima partita?
      </h1>
      <div className="w-full max-w-md relative" ref={boxRef}>
        <div className="flex items-stretch gap-2">
          <div className="relative flex-1">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={citySearch}
              onChange={(e) => setCitySearch(e.target.value)}
              onFocus={() => { if (suggestions.length > 0) setSuggestionsOpen(true); }}
              onKeyDown={(e) => { if (e.key === "Enter") handleCerca(); }}
              placeholder="Cerca la tua città..."
              autoComplete="off"
              className="w-full pl-12 pr-4 py-4 text-base rounded-2xl border-2 border-gray-200 focus:border-green-500 focus:outline-none shadow-md transition-colors"
            />

            {suggestionsOpen && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                {suggestions.map((citta) => (
                  <button
                    key={citta}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => { setCitySearch(citta); setSuggestionsOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-green-50 transition-colors border-b last:border-0 border-gray-50"
                  >
                    <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-800">{citta}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleCerca}
            disabled={!citySearch.trim()}
            aria-label="Cerca sedi in questa città"
            className="shrink-0 w-14 rounded-2xl bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white flex items-center justify-center shadow-md transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
          </button>
        </div>
      </div>
    </main>
  );
}
