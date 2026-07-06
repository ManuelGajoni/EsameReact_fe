"use client";

import { useState } from "react";
import { apiJson } from "./api";
import { PrenotazioneUtente } from "./types";
import { notifyPrenotazioniChanged } from "@/lib/prenotazioniEvents";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const formatData = (iso: string) =>
  new Date(iso).toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const formatOra = (t: string) => t.slice(0, 5);

export default function CancelMiaPrenotazioneModal({
  prenotazione, token, onClose, onCancelled,
}: {
  prenotazione: PrenotazioneUtente;
  token: string;
  onClose: () => void;
  onCancelled: (id: string) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleAnnulla = async () => {
    setSaving(true); setError("");
    try {
      await apiJson(`/api/prenotazioni/${prenotazione.id}/annullare`, token, "PATCH");
      notifyPrenotazioniChanged();
      onCancelled(prenotazione.id);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Annullamento fallito.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent showCloseButton={false} className="text-center">
        <div className="w-12 h-12 mx-auto rounded-full bg-red-50 flex items-center justify-center">
          <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>
        <DialogHeader>
          <DialogTitle className="text-center">Annullare la prenotazione?</DialogTitle>
          <DialogDescription className="text-center">
            {prenotazione.nomeSede} · {formatData(prenotazione.data)}, {formatOra(prenotazione.oraInizio)} – {formatOra(prenotazione.oraFine)}
          </DialogDescription>
        </DialogHeader>
        {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            No, torna indietro
          </Button>
          <Button variant="destructive" onClick={handleAnnulla} disabled={saving}>
            {saving ? "Annullamento…" : "Sì, annulla"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
