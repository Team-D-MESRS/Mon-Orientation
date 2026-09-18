'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Clock, GraduationCap, TrendingUp } from 'lucide-react';
import { apprenantApi, orientationApi } from '@/lib/api';
import {
  dateLisible,
  etiquetteProfil,
  noteLisible,
  palierDeSaisie,
  type Decouverte,
  type Favori,
  type Preference,
  type ProfilApprenant,
  type Recommandation,
} from '@/lib/apprenant';
import { useEspace, useProfil } from '@/components/espace/EspaceContext';
import { BadgeType, Carte, Chargement } from '@/components/espace/ui';

const LIEN = 'text-sm font-medium text-bj-green hover:underline';

export default function TableauDeBordPage() {
  const profil = useProfil();
  const { estParent, estEleve } = useEspace();
  // undefined tant que les vœux ne sont pas chargés : évite d'afficher « pas encore saisi » à tort
  const [preference, setPreference] = useState<Preference | null | undefined>(undefined);
  const [recommandations, setRecommandations] = useState<Recommandation[] | null>(null);
  const [favoris, setFavoris] = useState<Favori[] | null>(null);
  const [decouverte, setDecouverte] = useState<Decouverte | null | undefined>(undefined);

  useEffect(() => {
    let annule = false;
    setDecouverte(undefined);
    apprenantApi
      .getDecouverte(profil.nip)
      .then(({ data }) => {
        if (!annule) setDecouverte(data);
      })
      .catch(() => {
        if (!annule) setDecouverte(null);
      });
    return () => {
      annule = true;
    };
  }, [profil.nip]);

  useEffect(() => {
    let annule = false;
    setFavoris(null);
    apprenantApi
      .getFavoris(profil.nip)
      .then(({ data }) => {
        if (!annule) setFavoris(data);
      })
      .catch(() => {
        if (!annule) setFavoris([]);
      });
    return () => {
      annule = true;
    };
  }, [profil.nip]);

  useEffect(() => {
    let annule = false;
    setPreference(undefined);
    setRecommandations(null);
    Promise.all([apprenantApi.getPreferences(profil.nip), orientationApi.getRecommandations(profil.nip)])
      .then(([voeux, recos]) => {
        if (annule) return;
        setPreference(voeux.data.find((p) => p.palier === profil.palier) ?? null);
        setRecommandations(recos.data);
      })
      .catch(() => {
        if (annule) return;
        setPreference(null);
        setRecommandations([]);
      });
    return () => {
      annule = true;
    };
  }, [profil.nip, profil.palier]);

  const { bilan } = profil;

  return (
    // Identité, classe, département et NIP figurent déjà dans l'en-tête de l'espace (CadreEspace)
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6v">
      {decouverte && (
        <div className="md:col-span-2 bg-bj-green/5 border border-bj-green/30 rounded-bj-md p-4v">
          <p className="text-xs font-medium text-bj-green uppercase tracking-wide mb-1v">Ton profil</p>
          <p className="text-sm">{etiquetteProfil(decouverte)}</p>
        </div>
      )}

      <Carte titre={`Résultats ${bilan.anneeScolaire ?? ''}`} icone={<TrendingUp size={18} />}>
        {bilan.moyenneGenerale === null ? (
          <p className="text-sm text-bj-gray-500">Aucune note disponible pour l&apos;instant.</p>
        ) : (
          <>
            <p className="text-3xl font-bold text-bj-green">
              {noteLisible(bilan.moyenneGenerale)}
              <span className="text-base font-medium text-bj-gray-500">/20</span>
            </p>
            <p className="text-xs text-bj-gray-500 mb-4v">Moyenne générale</p>
            {bilan.forces.length > 0 && (
              <p className="text-sm mb-1v">
                <span className="font-medium">{estParent ? 'Points forts' : 'Tes points forts'} :</span> {bilan.forces.join(', ')}
              </p>
            )}
            {bilan.aAmeliorer.length > 0 && (
              <p className="text-sm">
                <span className="font-medium">À renforcer :</span> {bilan.aAmeliorer.join(', ')}
              </p>
            )}
            <Link href="/espace-apprenant/notes" className={`${LIEN} inline-block mt-3v`}>
              Détail des notes →
            </Link>
          </>
        )}
      </Carte>

      <Carte titre="Orientation" icone={<GraduationCap size={18} />}>
        <EtapeOrientation profil={profil} preference={preference} estParent={estParent} />
      </Carte>

      <section className="md:col-span-2">
        <div className="flex items-center justify-between mb-4v">
          <h2 className="text-xl font-bold">{profil.palier === 'QUATRIEME' ? 'Pistes à explorer' : 'Pistes recommandées'}</h2>
          <Link href="/espace-apprenant/recommandations" className={LIEN}>
            Tout voir →
          </Link>
        </div>
        {recommandations === null ? (
          <Chargement />
        ) : recommandations.length === 0 ? (
          <p className="text-sm text-bj-gray-500">
            Pas encore de recommandation.{' '}
            <Link href="/espace-apprenant/recommandations" className={LIEN}>
              Voir mes pistes
            </Link>
          </p>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-4v">
            {recommandations.slice(0, 3).map((r) => (
              <li key={r.id}>
                <Link href={`/catalogue/${r.filiere.id}`} className="bj-card block p-4v h-full">
                  <BadgeType type={r.filiere.type} />
                  <p className="font-bold mt-2v">{r.filiere.nom}</p>
                  <p className="text-sm text-bj-gray-500 mt-1v">Compatibilité {Math.round(r.score)}/100</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="md:col-span-2" aria-labelledby="titre-favoris">
        <div className="flex items-center justify-between mb-4v">
          <h2 id="titre-favoris" className="text-xl font-bold">
            {estEleve ? 'Mes formations mises de côté' : 'Formations mises de côté'}
          </h2>
          <Link href="/catalogue" className={LIEN}>
            Catalogue →
          </Link>
        </div>
        {favoris === null ? (
          <Chargement />
        ) : favoris.length === 0 ? (
          <p className="text-sm text-bj-gray-500">
            {estEleve
              ? 'Aucune pour l’instant. Dans le catalogue, appuie sur le cœur pour garder les formations qui t’intéressent : tu les retrouveras en saisissant tes vœux.'
              : `${profil.prenom} n'a pas encore mis de formation de côté.`}
          </p>
        ) : (
          <>
            <ul className="grid grid-cols-1 md:grid-cols-3 gap-4v">
              {favoris.slice(0, 6).map((f) => (
                <li key={f.filiereId}>
                  <Link href={`/catalogue/${f.filiereId}`} className="bj-card block p-4v h-full">
                    <BadgeType type={f.filiere.type} />
                    <p className="font-bold mt-2v">{f.filiere.nom}</p>
                  </Link>
                </li>
              ))}
            </ul>
            {favoris.length > 6 && <p className="text-sm text-bj-gray-500 mt-3v">Et {favoris.length - 6} autre(s).</p>}
          </>
        )}
      </section>
    </div>
  );
}

function EtapeOrientation({
  profil,
  preference,
  estParent,
}: {
  profil: ProfilApprenant;
  preference: Preference | null | undefined;
  estParent: boolean;
}) {
  if (!palierDeSaisie(profil.palier)) {
    return (
      <>
        <p className="text-sm mb-3v">
          {profil.palier === 'QUATRIEME'
            ? 'En 4e, découvre les formations qui correspondent à tes résultats, avant de choisir tes vœux en 3e.'
            : 'Les vœux se saisissent en 3e et en Terminale.'}
        </p>
        <Link href="/espace-apprenant/recommandations" className="bj-btn bj-btn-primary text-sm">
          Voir les pistes
        </Link>
      </>
    );
  }

  if (preference === undefined) return <Chargement />;

  if (!preference) {
    return (
      <>
        <p className="text-sm mb-3v">
          {estParent ? `${profil.prenom} n'a pas encore saisi ses vœux.` : "Tu n'as pas encore saisi tes vœux d'orientation."}
        </p>
        {!estParent && (
          <Link href="/espace-apprenant/preferences" className="bj-btn bj-btn-primary text-sm">
            Saisir mes vœux
          </Link>
        )}
      </>
    );
  }

  if (preference.valideParent) {
    return (
      <p className="flex items-start gap-2v text-sm text-bj-green font-medium">
        <CheckCircle2 size={18} className="shrink-0" aria-hidden="true" />
        Vœux validés par le parent le {dateLisible(preference.dateValidationParent as string)}.
      </p>
    );
  }

  return (
    <>
      <p className="flex items-start gap-2v text-sm mb-3v">
        <Clock size={18} className="shrink-0 text-bj-ochre-fonce" aria-hidden="true" />
        {estParent ? `Les vœux de ${profil.prenom} attendent ta validation.` : 'Vœux enregistrés, en attente de validation par ton parent.'}
      </p>
      <Link href="/espace-apprenant/preferences" className="bj-btn bj-btn-primary text-sm">
        {estParent ? 'Voir et valider' : 'Voir mes vœux'}
      </Link>
    </>
  );
}
