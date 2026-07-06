export interface SedeInfo {
  idSede: string;
  nomeSede: string;
  citta: string;
  numeroTelefono: string | null;
  descrizione: string | null;
  ruolo: string | null;
  orari: { giorno: number; oraApertura: string; oraChiusura: string }[];
  campi: { idCampo: string; nome: string; tipo: string; prezzoOrario: number }[];
}

export interface Prenotazione {
  id: string;
  data: string;
  oraInizio: string;
  oraFine: string;
  stato: string;
  nomeCampo: string;
  tipoCampo: string;
  nomeUtente: string;
  emailUtente: string;
}

export interface Slot {
  ora: string;
  libero: boolean;
}

export interface CampoDisponibilita {
  idCampo: string;
  nomeCampo: string;
  tipoCampo: string;
  prezzoOrario: number;
  slots: Slot[];
}

export interface DisponibilitaGiorno {
  data: string;
  sedeAperta: boolean;
  oraApertura: string | null;
  oraChiusura: string | null;
  campi: CampoDisponibilita[];
}

export interface GiornoStato {
  data: string;
  stato: "chiuso" | "occupato" | "libero";
}

export const STATO_STYLE: Record<string, string> = {
  confermata: "bg-green-100 text-green-700",
  in_attesa: "bg-amber-100 text-amber-700",
  annullata: "bg-red-100 text-red-500",
};
