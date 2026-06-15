"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import type { UserVenue } from "@/context/AuthContext";

const GRADIENTS = [
  "from-green-400 to-green-600",
  "from-emerald-400 to-teal-600",
  "from-teal-400 to-cyan-600",
  "from-green-500 to-emerald-700",
  "from-lime-400 to-green-600",
  "from-cyan-400 to-teal-600",
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function VenueCard({ venue, index }: { venue: UserVenue; index: number }) {
  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">

      {/* Colored header */}
      <div
        className={`h-32 bg-gradient-to-br ${GRADIENTS[index % GRADIENTS.length]} flex items-center justify-center`}
      >
        <span className="text-white text-6xl font-extrabold opacity-25 select-none tracking-tighter">
          {getInitials(venue.nome_sede)}
        </span>
      </div>

      {/* Body */}
      <div className="p-4">
        <h2 className="font-bold text-gray-800 text-base leading-tight mb-1 line-clamp-2">
          {venue.nome_sede}
        </h2>
        <div className="flex items-center gap-1 text-gray-400 text-sm mb-4">
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>{venue.citta}</span>
        </div>

        {/* Footer row */}
        <div className="flex items-center justify-between">
          <span
            className={[
              "text-xs font-semibold px-2.5 py-1 rounded-full",
              venue.ruolo === "founder"
                ? "bg-amber-100 text-amber-700"
                : "bg-green-100 text-green-700",
            ].join(" ")}
          >
            {venue.ruolo === "founder" ? "⭐ Proprietario" : "Cliente"}
          </span>

          {/* Search icon → opens home search page */}
          <Link href="/" aria-label="Cerca campi in questa sede">
            <span className="w-9 h-9 rounded-full bg-green-50 hover:bg-green-600 flex items-center justify-center transition-colors group/btn">
              <svg
                className="w-4 h-4 text-green-600 group-hover/btn:text-white transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function DashboardPage() {
  const { user, venues, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) router.push("/login");
  }, [user, isLoading, router]);

  if (isLoading || !user) return <Spinner />;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-green-600 font-extrabold text-2xl tracking-tight">Fields</span>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {getInitials(user.name)}
              </div>
              <span className="text-sm font-medium text-gray-700 hidden sm:block">{user.name}</span>
            </div>
            <button
              onClick={logout}
              className="text-sm text-gray-400 hover:text-red-500 transition-colors"
            >
              Esci
            </button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Le tue sedi</h1>
          <p className="text-gray-400 text-sm mt-1">
            {venues.length} {venues.length === 1 ? "sede associata" : "sedi associate"} al tuo account
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {venues.map((venue, i) => (
            <VenueCard key={venue.id_sede} venue={venue} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
