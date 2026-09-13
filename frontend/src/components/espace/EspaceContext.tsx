'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { apprenantApi, authApi, type Moi } from '@/lib/api';
import type { ProfilApprenant } from '@/lib/apprenant';
import { messageErreur } from '@/lib/erreurs';
import { Alerte, Chargement } from './ui';

interface Espace {
  moi: Moi;
  /** Dossier consulté : celui de l'élève, ou de l'enfant choisi par le parent, ou saisi par l'admin */
  nip: string | null;
  choisirNip: (nip: string) => void;
  profil: ProfilApprenant | null;
  chargementProfil: boolean;
  erreurProfil: string | null;
  /** Seul l'élève saisit ses vœux ; le parent les valide ; l'admin consulte. */
  estEleve: boolean;
  estParent: boolean;
}

const EspaceContext = createContext<Espace | null>(null);

export function useEspace(): Espace {
  const espace = useContext(EspaceContext);
  if (!espace) throw new Error('useEspace doit être utilisé dans <EspaceProvider>');
  return espace;
}

/** Profil du dossier consulté ; les pages de l'espace ne s'affichent qu'une fois celui-ci chargé. */
export function useProfil(): ProfilApprenant {
  const { profil } = useEspace();
  if (!profil) throw new Error('Profil non chargé');
  return profil;
}

export function EspaceProvider({ children }: { children: ReactNode }) {
  const [moi, setMoi] = useState<Moi | null>(null);
  const [erreurMoi, setErreurMoi] = useState<string | null>(null);
  const [nip, setNip] = useState<string | null>(null);
  const [profil, setProfil] = useState<ProfilApprenant | null>(null);
  const [chargementProfil, setChargementProfil] = useState(false);
  const [erreurProfil, setErreurProfil] = useState<string | null>(null);

  useEffect(() => {
    authApi
      .moi()
      .then(({ data }) => {
        setMoi(data);
        setNip(data.apprenant?.nip ?? data.enfants[0]?.nip ?? null);
      })
      .catch((err) => setErreurMoi(messageErreur(err)));
  }, []);

  useEffect(() => {
    if (!nip) {
      setProfil(null);
      return;
    }
    let annule = false;
    setChargementProfil(true);
    setErreurProfil(null);
    apprenantApi
      .getProfile(nip)
      .then(({ data }) => {
        if (!annule) setProfil(data);
      })
      .catch((err) => {
        if (annule) return;
        setProfil(null);
        setErreurProfil(messageErreur(err, { 404: 'Aucun élève ne correspond à ce NIP.', 403: "Tu n'as pas accès à ce dossier." }));
      })
      .finally(() => {
        if (!annule) setChargementProfil(false);
      });
    return () => {
      annule = true;
    };
  }, [nip]);

  if (erreurMoi) {
    return (
      <div className="bj-container py-8v">
        <Alerte ton="erreur">{erreurMoi}</Alerte>
      </div>
    );
  }
  if (!moi) return <Chargement />;

  return (
    <EspaceContext.Provider
      value={{
        moi,
        nip,
        choisirNip: setNip,
        profil,
        chargementProfil,
        erreurProfil,
        estEleve: moi.role === 'APPRENANT',
        estParent: moi.role === 'PARENT',
      }}
    >
      {children}
    </EspaceContext.Provider>
  );
}
