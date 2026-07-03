"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet } from "./api";
import { CampoDisponibilita, DisponibilitaGiorno } from "./types";
import BookingModal from "./BookingModal";
import { usePrenotazioniChanged } from "@/lib/prenotazioniEvents";

function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-7 h-7 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function DayAvailability({
  idSede, token, data, isFounder,
}: {
  idSede: string;
  token: string;
  data: string; // ISO yyyy-MM-dd
  isFounder: boolean;
}) {
  const [giorno, setGiorno] = useState<DisponibilitaGiorno | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selezione, setSelezione] = useState<{ campo: CampoDisponibilita; ora: string } | null>(null);

  const load = useCallback(() => {
    setLoading(true); setError("");
    apiGet<DisponibilitaGiorno>(`/api/sedi/${idSede}/disponibilita-giorno?data=${data}`, token)
      .then(setGiorno)
      .catch(() => setError("Impossibile caricare la disponibilità."))
      .finally(() => setLoading(false));
  }, [idSede, token, data]);

  useEffect(() => { load(); }, [load]);
  usePrenotazioniChanged(load);

  const isPast = data < todayIso();

  if (loading) return <Spinner />;
  if (error) return <p className="text-red-500 text-sm">{error}</p>;
  if (!giorno) return null;

  if (!giorno.sedeAperta) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-8 text-center text-gray-400">
        <p className="text-sm font-medium">Sede chiusa in questo giorno</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {giorno.campi.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center text-gray-400">
            <p className="text-sm font-medium">Nessun campo disponibile</p>
          </div>
        ) : (
          giorno.campi.map((campo) => (
            <div key={campo.idCampo} className="bg-white rounded-2xl shadow-sm px-5 py-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{campo.nomeCampo}</p>
                  <p className="text-xs text-gray-400 capitalize">{campo.tipoCampo}</p>
                </div>
                <span className="text-xs font-medium text-gray-500">€ {campo.prezzoOrario.toFixed(2)}/h</span>
              </div>
              {campo.slots.length === 0 ? (
                <p className="text-xs text-gray-400">Nessun orario disponibile</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {campo.slots.map((slot) => (
                    <button
                      key={slot.ora}
                      disabled={!slot.libero || isPast}
                      onClick={() => setSelezione({ campo, ora: slot.ora })}
                      className={[
                        "px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors",
                        slot.libero && !isPast
                          ? "bg-green-50 text-green-700 hover:bg-green-100 cursor-pointer"
                          : "bg-gray-100 text-gray-400 cursor-not-allowed",
                      ].join(" ")}
                    >
                      {slot.ora}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {selezione && (
        <BookingModal
          idSede={idSede}
          token={token}
          isFounder={isFounder}
          campo={selezione.campo}
          data={data}
          ora={selezione.ora}
          onClose={() => setSelezione(null)}
        />
      )}
    </>
  );
}
