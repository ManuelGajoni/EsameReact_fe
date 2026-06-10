"use client";

import { useState } from "react";

export default function HeroSection() {
  const [citySearch, setCitySearch] = useState("");

  return (
    <main className="flex-1 flex flex-col items-center justify-center bg-gradient-to-b from-green-50 to-white px-6 py-24">
      <h1 className="text-3xl md:text-4xl font-bold text-gray-800 text-center mb-8 max-w-xl leading-tight">
        In quale città vuoi prenotare la prossima partita?
      </h1>
      <div className="w-full max-w-md relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg
            className="w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
            />
          </svg>
        </div>
        <input
          type="text"
          value={citySearch}
          onChange={(e) => setCitySearch(e.target.value)}
          placeholder="Cerca la tua città..."
          className="w-full pl-12 pr-4 py-4 text-base rounded-2xl border-2 border-gray-200 focus:border-green-500 focus:outline-none shadow-md transition-colors"
        />
      </div>
    </main>
  );
}
