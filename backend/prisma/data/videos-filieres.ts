/**
 * Vidéos présentant une filière et ses débouchés, curatées manuellement et validées avec le client
 * (01/10/2026) — pas d'extraction automatique, pas de clé API vidéo.
 *
 * Aucune vidéo n'est spécifique au Bénin ni à l'école exacte : une recherche systématique n'en a
 * trouvé aucune (ni pour une fiche du guide MESRS, ni pour une série de bac). Les vidéos retenues
 * sont les meilleures trouvées en français sur le métier ou le domaine concerné — pour la plupart
 * des contenus français génériques (Afpa, Thotis, chaînes indépendantes), à l'exception notable de
 * « quels débouchés avec un bac scientifique en Afrique ? » (BAC-C) et d'une vidéo qui cite
 * explicitement le BAC G2 (BAC-G2), toutes deux en contexte francophone africain.
 *
 * Une fiche sans entrée ici affiche à la place un lien de recherche YouTube généré à partir de son
 * nom (voir `recherche Youtube` dans `frontend/src/lib/filiere.ts`) — jamais de vide.
 *
 * Clé : `code` de la fiche filière (REFERENTIEL_FILIERES ou guide-mesrs-2026-2027.json).
 */
export const VIDEOS_FILIERES: Record<string, string> = {
  'BAC-C': 'https://www.youtube.com/watch?v=9IwEUOqmXXU',
  'BAC-D': 'https://www.youtube.com/watch?v=Bx9g7_y6reo',
  'BAC-G2': 'https://www.youtube.com/watch?v=neweCBc6O40',
  'BAC-F3': 'https://www.youtube.com/watch?v=rVUFMBf0dUQ',
  'BAC-F4': 'https://www.youtube.com/watch?v=sH9Q47cv720',
  'DTM-LTP-ELEC-ENERGIE': 'https://www.youtube.com/watch?v=fv2-qeVk_EI',
  'DTM-LTP-RESEAUX-CYBER': 'https://www.youtube.com/watch?v=_YekdtxIqz0',
  'DTM-LTA-HORTICULTURE': 'https://www.youtube.com/watch?v=AWiFvGDG0zY',
  'DTM-LTP-MECA-AUTO': 'https://www.youtube.com/watch?v=PoQlXtFmFlI',
  'UNIV-FSS-MEDECINE': 'https://www.youtube.com/watch?v=zKN2TdswzQU',
  'UNIV-FADESP-DROIT': 'https://www.youtube.com/watch?v=02dG8lbSSig',
  'UNIV-FASEG-GESTION': 'https://www.youtube.com/watch?v=L5DeXxYDhCA',
  'UNIV-IFRI-INFORMATIQUE': 'https://www.youtube.com/watch?v=6tnT-i3hO8M',
  'UNIV-FSS-PHARMACIE': 'https://www.youtube.com/watch?v=VVKnxidp5nI',
  'UNIV-UAC-INEMES-SCIENCES-INFIRMIERES': 'https://www.youtube.com/watch?v=jhq_0Od7vTw',
  'UNIV-UNSTIM-ENSTP-ARCHITECTURE-ET-URBANISME': 'https://www.youtube.com/watch?v=952aG2DebSA',
  'UNIV-UNSTIM-INSTI-GENIE-CIVIL': 'https://www.youtube.com/watch?v=ykNdlSaOTKI',
};
