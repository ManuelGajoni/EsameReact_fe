"use client";

import { useEffect } from "react";

const PRENOTAZIONI_CHANGED_EVENT = "prenotazioni-changed";

/** Da chiamare dopo qualunque creazione/conferma/annullamento di una prenotazione. */
export function notifyPrenotazioniChanged() {
  window.dispatchEvent(new Event(PRENOTAZIONI_CHANGED_EVENT));
}

/** Da usare nelle tab che mostrano prenotazioni: richiama `onChange` quando qualcosa cambia altrove. */
export function usePrenotazioniChanged(onChange: () => void) {
  useEffect(() => {
    window.addEventListener(PRENOTAZIONI_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(PRENOTAZIONI_CHANGED_EVENT, onChange);
  }, [onChange]);
}
