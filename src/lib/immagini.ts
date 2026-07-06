// Le immagini statiche vanno salvate in EsameReact_fe/public/, con questi nomi esatti
// (minuscolo, spazi sostituiti da "_", estensione .jpg):
//   immagine_calcio_a_5.jpg, immagine_calcio_a_7.jpg, immagine_calcio_a_11.jpg,
//   immagine_padel.jpg, immagine_tennis.jpg, immagine_sede1.jpg, immagine_sede2.jpg

/** Immagine di sfondo per un campo in base alla sua tipologia (es. "Calcio a 5" -> immagine_calcio_a_5.jpg) */
export function immagineCampo(nomeTipologia: string): string {
  const slug = nomeTipologia.trim().toLowerCase().replace(/\s+/g, "_");
  return `/immagine_${slug}.jpg`;
}

/** Immagine della sede: variante 1 per il founder, variante 2 per cliente o non associato */
export function immagineSede(ruolo: string | null | undefined): string {
  return ruolo === "founder" ? "/immagine_sede1.jpg" : "/immagine_sede2.jpg";
}
