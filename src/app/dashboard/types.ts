export interface PrenotazioneUtente {
  id: string;
  data: string;
  oraInizio: string;
  oraFine: string;
  stato: string;
  nomeCampo: string;
  tipoCampo: string;
  idSede: string;
  nomeSede: string;
  cittaSede: string;
}

export const STATO_STYLE: Record<string, string> = {
  confermata: "bg-green-100 text-green-700",
  in_attesa: "bg-amber-100 text-amber-700",
  annullata: "bg-red-100 text-red-500",
};
