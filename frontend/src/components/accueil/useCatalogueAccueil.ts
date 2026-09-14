'use client';

import { useEffect, useState } from 'react';
import { filiereApi } from '@/lib/api';
import type { ValeursFiltres } from '@/lib/filiere';

export interface CatalogueAccueil extends ValeursFiltres {
  /** Nombre de formations du catalogue */
  total: number;
}

// Une seule série de requêtes par visite, partagée par les sections de l'accueil
let chargement: Promise<CatalogueAccueil> | null = null;

function charger() {
  chargement ??= Promise.all([filiereApi.filtres(), filiereApi.list({ limit: 1 })])
    .then(([filtres, liste]) => ({ ...filtres.data, total: liste.data.total }))
    .catch((err) => {
      chargement = null;
      throw err;
    });
  return chargement;
}

/** Séries du bac, domaines (avec leur nombre de formations) et total, lus dans l'API plutôt qu'écrits en dur. */
export function useCatalogueAccueil() {
  const [donnees, setDonnees] = useState<CatalogueAccueil | null>(null);
  const [erreur, setErreur] = useState(false);

  useEffect(() => {
    let annule = false;
    charger()
      .then((d) => {
        if (!annule) setDonnees(d);
      })
      .catch(() => {
        if (!annule) setErreur(true);
      });
    return () => {
      annule = true;
    };
  }, []);

  return { donnees, erreur };
}
