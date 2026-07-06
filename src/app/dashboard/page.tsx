"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import type { UserVenue } from "@/context/AuthContext";
import MiePrenotazioniTab from "./MiePrenotazioniTab";
import CreaSedeModal from "@/components/CreaSedeModal";
import { immagineSede } from "@/lib/immagini";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

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

function SearchCard() {
  return (
    <Link href="/" className="block group">
      <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden h-full">

        {/* Header tratteggiato */}
        <div className="h-32 border-2 border-dashed border-gray-200 group-hover:border-green-400 rounded-t-2xl flex items-center justify-center transition-colors">
          <div className="w-14 h-14 rounded-full bg-green-50 group-hover:bg-green-600 flex items-center justify-center transition-colors">
            <svg
              className="w-7 h-7 text-green-500 group-hover:text-white transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 flex flex-col justify-center">
          <h2 className="font-bold text-gray-700 group-hover:text-green-600 text-base leading-tight mb-1 transition-colors">
            Cerca
          </h2>
          <p className="text-gray-400 text-sm">Scopri nuove sedi e campi</p>
        </div>
      </div>
    </Link>
  );
}

function CreaSedeCard({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="block group text-left h-full">
      <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden h-full">

        {/* Header tratteggiato */}
        <div className="h-32 border-2 border-dashed border-gray-200 group-hover:border-green-400 rounded-t-2xl flex items-center justify-center transition-colors">
          <div className="w-14 h-14 rounded-full bg-green-50 group-hover:bg-green-600 flex items-center justify-center transition-colors">
            <svg
              className="w-7 h-7 text-green-500 group-hover:text-white transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 flex flex-col justify-center">
          <h2 className="font-bold text-gray-700 group-hover:text-green-600 text-base leading-tight mb-1 transition-colors">
            Crea sede
          </h2>
          <p className="text-gray-400 text-sm">Registra un nuovo centro sportivo</p>
        </div>
      </div>
    </button>
  );
}

function VenueCard({ venue, index }: { venue: UserVenue; index: number }) {
  return (
    <Link href={`/sede/${venue.id_sede}`} className="block group">
      <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">

        {/* Colored header (fallback) + immagine della sede */}
        <div
          className={`relative h-32 bg-gradient-to-br ${GRADIENTS[index % GRADIENTS.length]} flex items-center justify-center overflow-hidden`}
        >
          <span className="text-white text-6xl font-extrabold opacity-25 select-none tracking-tighter">
            {getInitials(venue.nome_sede)}
          </span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={immagineSede(venue.ruolo)}
            alt=""
            onError={(e) => { e.currentTarget.style.opacity = "0"; }}
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>

        {/* Body */}
        <div className="p-4">
          <h2 className="font-bold text-gray-800 group-hover:text-green-600 text-base leading-tight mb-1 line-clamp-2 transition-colors">
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
        </div>
      </div>
    </Link>
  );
}

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}


function BookedSuccessModal({ stato, onClose }: { stato: string; onClose: () => void }) {
  const confermata = stato === "confermata";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center" onClick={(e) => e.stopPropagation()}>
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-50 flex items-center justify-center">
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-sm font-bold text-gray-800 mb-1">
          {confermata ? "Prenotazione confermata!" : "Richiesta inviata!"}
        </h3>
        <p className="text-sm text-gray-500 mb-5">
          {confermata
            ? "Il campo è stato prenotato con successo."
            : "La tua richiesta è in attesa di conferma da parte del gestore della sede."}
        </p>
        <button onClick={onClose} className="w-full px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition-colors">
          Chiudi
        </button>
      </div>
    </div>
  );
}

// legge il parametro ?booked= per mostrare la modale di esito dopo un redirect da una prenotazione
function BookedParamHandler({ onDetected }: { onDetected: (stato: string) => void }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const booked = searchParams.get("booked");
    if (booked) {
      onDetected(booked);
      router.replace("/dashboard");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return null;
}

export default function DashboardPage() {
  const { user, venues, isLoading, logout, refreshVenues } = useAuth();
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [tab, setTab] = useState<"sedi" | "prenotazioni">("sedi");
  const [bookedResult, setBookedResult] = useState<string | null>(null);
  const [creatingSede, setCreatingSede] = useState(false);

  useEffect(() => {
    console.log("[DEBUG dashboard redirect-check]", { isLoading, user });
    if (!isLoading && !user) {
      console.log("[DEBUG dashboard] redirecting to /login because user is falsy");
      router.push("/login");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    setToken(localStorage.getItem("access_token"));
  }, []);

  const handleBookedDetected = (stato: string) => {
    setTab("prenotazioni");
    setBookedResult(stato);
  };

  if (isLoading || !user) return <Spinner />;

  return (
    <div className="min-h-screen bg-gray-50">

      <Suspense fallback={null}>
        <BookedParamHandler onDetected={handleBookedDetected} />
      </Suspense>

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
        <Tabs value={tab} onValueChange={(v) => { if (v) setTab(v as "sedi" | "prenotazioni"); }}>
          <TabsList className="mb-6 h-auto bg-transparent gap-2 p-0">
            <TabsTrigger value="sedi" className="px-5 py-2.5 text-sm rounded-xl data-active:bg-green-600 data-active:text-white data-active:shadow-sm">
              Le tue sedi
            </TabsTrigger>
            <TabsTrigger value="prenotazioni" className="px-5 py-2.5 text-sm rounded-xl data-active:bg-green-600 data-active:text-white data-active:shadow-sm">
              Le Mie Prenotazioni
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sedi">
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
              <SearchCard />
              <CreaSedeCard onClick={() => setCreatingSede(true)} />
            </div>
          </TabsContent>

          <TabsContent value="prenotazioni">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-800">Le Mie Prenotazioni</h1>
              <p className="text-gray-400 text-sm mt-1">Le partite che hai prenotato, passate e future</p>
            </div>
            {token ? <MiePrenotazioniTab token={token} /> : <Spinner />}
          </TabsContent>
        </Tabs>
      </div>

      {bookedResult && (
        <BookedSuccessModal stato={bookedResult} onClose={() => setBookedResult(null)} />
      )}

      {creatingSede && token && (
        <CreaSedeModal
          token={token}
          onClose={() => setCreatingSede(false)}
          onCreated={async (sede) => {
            setCreatingSede(false);
            await refreshVenues();
            router.push(`/sede/${sede.idSede}`);
          }}
        />
      )}
    </div>
  );
}
