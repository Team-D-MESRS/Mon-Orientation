'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, ExternalLink, Heart, Search } from 'lucide-react';
import { apprenantApi, filiereApi } from '@/lib/api';
import {
  ORDINAUX,
  PALIER_LABELS,
  dateLisible,
  niveauDuPalier,
  palierDeSaisie,
  type Preference,
  type ProfilApprenant,
} from '@/lib/apprenant';
import { TYPE_LABELS, correspond, type EtablissementPourVoeu, type Filiere, type TypeFiliere } from '@/lib/filiere';
import { messageErreur } from '@/lib/erreurs';
import { useEspace, useProfil } from '@/components/espace/EspaceContext';
import { Alerte, BadgeType, CHAMP, Chargement, PastilleRang } from '@/components/espace/ui';

// En 3e (entrée en lycée technique) comme en Terminale (admission au supérieur) : 3 étapes. Ce qui
// change selon le niveau, c'est ce qu'on y choisit — voir SaisieDesVoeux.
const NB_ETAPES = 3;
const RECAPITULATIF = NB_ETAPES + 1;

export default function PreferencesPage() {
  const profil = useProfil();
  const { moi, estEleve } = useEspace();
  const saisieOuverte = palierDeSaisie(profil.palier);
  const [preference, setPreference] = useState<Preference | null | undefined>(undefined);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    if (!saisieOuverte) return;
    let annule = false;
    setPreference(undefined);
    apprenantApi
      .getPreferences(profil.nip)
      .then(({ data }) => {
        if (!annule) setPreference(data.find((p) => p.palier === profil.palier) ?? null);
      })
      .catch((err) => {
        if (!annule) setErreur(messageErreur(err));
      });
    return () => {
      annule = true;
    };
  }, [profil.nip, profil.palier, saisieOuverte]);

  if (!saisieOuverte) {
    return (
      <Alerte ton="info">
        La saisie des vœux se fait en 3e et en Terminale. En attendant,{' '}
        <Link href="/espace-apprenant/recommandations" className="font-medium text-bj-green hover:underline">
          consulte les pistes proposées à partir des résultats
        </Link>
        .
      </Alerte>
    );
  }
  if (erreur) return <Alerte ton="erreur">{erreur}</Alerte>;
  if (preference === undefined) return <Chargement />;
  if (!estEleve) {
    return <VoeuxEnLecture profil={profil} preference={preference} peutValider={moi.role === 'PARENT'} onValide={setPreference} />;
  }
  return <SaisieDesVoeux profil={profil} preference={preference} onEnregistre={setPreference} />;
}

function ListeVoeux({ voeux }: { voeux: (Filiere | null | undefined)[] }) {
  return (
    <ol className="space-y-3v">
      {voeux.map((f, i) => (
        <li key={i} className="flex items-center gap-3v p-4v rounded-bj-sm border border-bj-gray-925">
          <PastilleRang rang={i + 1} />
          {f ? (
            <div className="flex-1 min-w-0">
              <p className="font-medium">{f.nom}</p>
              <div className="mt-1v flex items-center gap-2v">
                <BadgeType type={f.type} />
                <Link href={`/catalogue/${f.id}`} className="text-xs text-bj-green hover:underline">
                  Voir la fiche
                </Link>
              </div>
            </div>
          ) : (
            <p className="flex-1 text-bj-gray-500">{ORDINAUX[i]} choix non renseigné</p>
          )}
        </li>
      ))}
    </ol>
  );
}

/** Établissement demandé (3e seulement, fiche unique d'inscription) : pas un choix classé comme les vœux, pas de pastille de rang. */
function CarteEtablissement({ etablissement }: { etablissement: EtablissementPourVoeu | null }) {
  return (
    <div className="flex items-center gap-3v p-4v rounded-bj-sm border border-bj-gray-925">
      {etablissement ? (
        <div className="flex-1 min-w-0">
          <p className="font-medium">{etablissement.nom}</p>
          <p className="mt-1v text-xs text-bj-gray-500">
            {[etablissement.commune, etablissement.departement].filter(Boolean).join(', ') || 'Lieu non renseigné'}
            {etablissement.internat ? ' · Internat' : ''}
          </p>
        </div>
      ) : (
        <p className="flex-1 text-bj-gray-500">Établissement non renseigné</p>
      )}
    </div>
  );
}

function VoeuxEnLecture({
  profil,
  preference,
  peutValider,
  onValide,
}: {
  profil: ProfilApprenant;
  preference: Preference | null;
  peutValider: boolean;
  onValide: (preference: Preference) => void;
}) {
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  if (!preference) {
    return <Alerte ton="info">{profil.prenom} n&apos;a pas encore saisi ses vœux.</Alerte>;
  }
  const estBepc = niveauDuPalier(profil.palier as NonNullable<ProfilApprenant['palier']>) === 'APRES_BEPC';

  const valider = async () => {
    setEnvoi(true);
    setErreur(null);
    try {
      const { data } = await apprenantApi.validerPreferences(profil.nip);
      onValide(data);
    } catch (err) {
      setErreur(messageErreur(err));
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <section className="bg-white rounded-bj-md border border-bj-gray-925 p-6v">
      <h2 className="text-xl font-bold mb-4v">Vœux de {profil.prenom}</h2>
      <ListeVoeux voeux={estBepc ? [preference.filiere1, preference.filiere2] : [preference.filiere1, preference.filiere2, preference.filiere3]} />
      {estBepc && (
        <div className="mt-3v">
          <p className="text-sm font-medium mb-2v">Établissement demandé</p>
          <CarteEtablissement etablissement={preference.etablissement} />
        </div>
      )}
      {preference.motivation && (
        <blockquote className="mt-4v text-sm border-l-4 border-bj-green pl-4v italic">« {preference.motivation} »</blockquote>
      )}
      <p className="text-xs text-bj-gray-500 mt-4v">Saisis le {dateLisible(preference.dateSaisie)}.</p>

      <div className="mt-6v">
        {preference.valideParent ? (
          <p className="flex items-center gap-2v text-bj-green font-medium">
            <CheckCircle2 size={18} aria-hidden="true" /> Vœux validés le {dateLisible(preference.dateValidationParent as string)}.
          </p>
        ) : peutValider ? (
          <>
            <p className="text-sm mb-3v">
              En validant, tu confirmes avoir pris connaissance des choix de {profil.prenom} et en avoir parlé ensemble.
            </p>
            <button type="button" onClick={valider} disabled={envoi} className="bj-btn bj-btn-primary disabled:opacity-60">
              {envoi ? 'Validation…' : `Valider les vœux de ${profil.prenom}`}
            </button>
          </>
        ) : (
          <p className="text-sm text-bj-gray-500">En attente de validation par le parent.</p>
        )}
        {erreur && <Alerte ton="erreur">{erreur}</Alerte>}
      </div>
    </section>
  );
}

function SaisieDesVoeux({
  profil,
  preference,
  onEnregistre,
}: {
  profil: ProfilApprenant;
  preference: Preference | null;
  onEnregistre: (preference: Preference | null) => void;
}) {
  const palier = profil.palier as NonNullable<ProfilApprenant['palier']>;
  // 3e (entrée en lycée technique) : 2 choix de spécialité classés + 1 établissement qui les dispense tous
  // deux (fiche unique d'inscription MESRS/DESTFP). Terminale (admission au supérieur) : 3 choix libres,
  // sans établissement — un circuit différent, non couvert par cette fiche.
  const estBepc = niveauDuPalier(palier) === 'APRES_BEPC';
  const [choix, setChoix] = useState<(string | null)[]>([
    preference?.filiereId1 ?? null,
    preference?.filiereId2 ?? null,
    preference?.filiereId3 ?? null,
  ]);
  const [etablissement, setEtablissement] = useState<EtablissementPourVoeu | null>(preference?.etablissement ?? null);
  const [etablissements, setEtablissements] = useState<EtablissementPourVoeu[] | null>(null);
  const [motivation, setMotivation] = useState(preference?.motivation ?? '');
  const [etape, setEtape] = useState(preference ? RECAPITULATIF : 1);
  const [filieres, setFilieres] = useState<Filiere[] | null>(null);
  const [favoris, setFavoris] = useState<Set<string>>(new Set());
  const [seulementFavoris, setSeulementFavoris] = useState(false);
  const [recherche, setRecherche] = useState('');
  const [type, setType] = useState<TypeFiliere | ''>('');
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enregistre, setEnregistre] = useState(false);

  useEffect(() => {
    filiereApi
      .list({ niveau: niveauDuPalier(palier), limit: 500 })
      .then(({ data }) => setFilieres(data.items))
      .catch((err) => setErreur(messageErreur(err)));
    // Les formations mises de côté dans le catalogue sont proposées en premier ; sans elles, la saisie reste possible
    apprenantApi
      .getFavoris(profil.nip)
      .then(({ data }) => setFavoris(new Set(data.map((f) => f.filiereId))))
      .catch(() => undefined);
  }, [palier, profil.nip]);

  const estEtapeEtablissement = estBepc && etape === 3;
  const premierChoix = choix[0];
  const deuxiemeChoix = choix[1];

  // Établissement de la fiche unique : chargé seulement à l'étape 3 en 3e, filtré aux deux spécialités choisies
  useEffect(() => {
    if (!estEtapeEtablissement) return;
    const filiereIds = [premierChoix, deuxiemeChoix].filter((id): id is string => !!id);
    if (filiereIds.length === 0) {
      setEtablissements([]);
      return;
    }
    let annule = false;
    setEtablissements(null);
    filiereApi
      .etablissementsCommuns(filiereIds)
      .then(({ data }) => {
        if (!annule) setEtablissements(data);
      })
      .catch((err) => {
        if (!annule) setErreur(messageErreur(err));
      });
    return () => {
      annule = true;
    };
  }, [estEtapeEtablissement, premierChoix, deuxiemeChoix]);

  const parId = useMemo(() => new Map((filieres ?? []).map((f) => [f.id, f])), [filieres]);
  const types = useMemo(() => Array.from(new Set((filieres ?? []).map((f) => f.type))), [filieres]);

  // Enregistrement à chaque étape : un vœu choisi n'est jamais perdu
  const enregistrer = async (nouveauxChoix: (string | null)[], nouvelEtablissement: EtablissementPourVoeu | null = etablissement) => {
    const [f1, f2, f3] = nouveauxChoix;
    if (!f1) return false;
    setEnvoi(true);
    setErreur(null);
    setEnregistre(false);
    try {
      const { data } = await apprenantApi.enregistrerPreferences(profil.nip, {
        filiereId1: f1,
        ...(f2 ? { filiereId2: f2 } : {}),
        ...(estBepc ? (nouvelEtablissement ? { etablissementId: nouvelEtablissement.id } : {}) : f2 && f3 ? { filiereId3: f3 } : {}),
        ...(motivation.trim() ? { motivation: motivation.trim() } : {}),
      });
      onEnregistre(data.find((p) => p.palier === palier) ?? null);
      return true;
    } catch (err) {
      setErreur(messageErreur(err));
      return false;
    } finally {
      setEnvoi(false);
    }
  };

  const continuer = async () => {
    if (await enregistrer(choix)) {
      setEtape(etape + 1);
      setRecherche('');
    }
  };

  const passer = async () => {
    const sansLaSuite = choix.map((c, i) => (i >= etape - 1 ? null : c));
    setChoix(sansLaSuite);
    const nouvelEtablissement = estEtapeEtablissement ? null : etablissement;
    setEtablissement(nouvelEtablissement);
    if (await enregistrer(sansLaSuite, nouvelEtablissement)) setEtape(RECAPITULATIF);
  };

  if (!filieres) return erreur ? <Alerte ton="erreur">{erreur}</Alerte> : <Chargement />;

  if (etape === RECAPITULATIF) {
    const choixAffiches = estBepc ? choix.slice(0, 2) : choix;
    return (
      <section className="bg-white rounded-bj-md border border-bj-gray-925 p-6v space-y-6v">
        <div>
          <h2 className="text-xl font-bold">Tes vœux pour la {PALIER_LABELS[palier]}</h2>
          <p className="text-sm text-bj-gray-500">Vérifie tes choix, ajoute une motivation si tu le souhaites, puis enregistre.</p>
        </div>

        <ListeVoeux voeux={choixAffiches.map((id) => (id ? parId.get(id) : null))} />
        {estBepc && (
          <div>
            <p className="text-sm font-medium mb-2v">Établissement demandé</p>
            <CarteEtablissement etablissement={etablissement} />
          </div>
        )}
        <div className="flex flex-wrap gap-3v">
          {choixAffiches.map((id, i) =>
            i === 0 || choix[i - 1] ? (
              <button key={i} type="button" onClick={() => setEtape(i + 1)} className="text-sm font-medium text-bj-green hover:underline">
                {id ? `Modifier le ${ORDINAUX[i]} choix` : `Ajouter un ${ORDINAUX[i]} choix`}
              </button>
            ) : null,
          )}
          {estBepc && premierChoix && (
            <button type="button" onClick={() => setEtape(3)} className="text-sm font-medium text-bj-green hover:underline">
              {etablissement ? "Modifier l'établissement" : 'Choisir un établissement'}
            </button>
          )}
        </div>

        <div>
          <label htmlFor="motivation" className="block text-sm font-medium mb-1v">
            Pourquoi ces choix ? <span className="font-normal text-bj-gray-500">(facultatif)</span>
          </label>
          <textarea id="motivation" rows={3} maxLength={1000} value={motivation} onChange={(e) => setMotivation(e.target.value)} className={CHAMP} />
        </div>

        {preference?.valideParent ? (
          <Alerte ton="attention">
            Tes vœux ont été validés par ton parent le {dateLisible(preference.dateValidationParent as string)}. Si tu les modifies, il devra les
            valider à nouveau.
          </Alerte>
        ) : (
          preference && <p className="text-sm text-bj-gray-500">Vœux en attente de validation par ton parent.</p>
        )}
        {erreur && <Alerte ton="erreur">{erreur}</Alerte>}
        {enregistre && (
          <Alerte ton="succes">
            Vœux enregistrés. Tes recommandations ont été mises à jour.{' '}
            <Link href="/espace-apprenant/recommandations" className="font-medium underline">
              Voir mes recommandations
            </Link>
          </Alerte>
        )}

        <button
          type="button"
          disabled={envoi || !choix[0]}
          onClick={async () => setEnregistre(await enregistrer(choix))}
          className="bj-btn bj-btn-primary disabled:opacity-60"
        >
          {envoi ? 'Enregistrement…' : 'Enregistrer mes vœux'}
        </button>
      </section>
    );
  }

  const progression = (
    <div className="mb-6v">
      <p className="text-sm font-medium text-bj-green mb-2v">
        Étape {etape} sur {NB_ETAPES}
      </p>
      <div
        className="h-2 rounded-full bg-bj-gray-925 overflow-hidden"
        role="progressbar"
        aria-label="Progression de la saisie des vœux"
        aria-valuemin={0}
        aria-valuemax={NB_ETAPES}
        aria-valuenow={etape}
      >
        <div className="h-full bg-bj-green transition-all" style={{ width: `${(etape / NB_ETAPES) * 100}%` }} />
      </div>
    </div>
  );

  if (estEtapeEtablissement) {
    return (
      <section className="bg-white rounded-bj-md border border-bj-gray-925 p-6v">
        {progression}

        <h2 className="text-xl font-bold mb-1v">Ton établissement</h2>
        <p className="text-sm text-bj-gray-500 mb-4v">
          Assure-toi que l&apos;établissement choisi dispense bien {deuxiemeChoix ? 'tes deux choix de spécialité' : 'ton choix de spécialité'}.
        </p>

        {etablissements === null ? (
          <Chargement />
        ) : etablissements.length === 0 ? (
          <Alerte ton="info">
            Aucun établissement ne dispense {deuxiemeChoix ? 'ces deux formations à la fois' : 'cette formation'}.{' '}
            {deuxiemeChoix ? 'Modifie un de tes choix pour continuer.' : 'Modifie ton choix pour continuer.'}
          </Alerte>
        ) : (
          <fieldset>
            <legend className="sr-only">Choisis un établissement</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3v max-h-[28rem] overflow-y-auto pr-1v">
              {etablissements.map((e) => (
                <label
                  key={e.id}
                  className={`flex gap-3v p-4v rounded-bj-sm border cursor-pointer transition-colors ${
                    etablissement?.id === e.id ? 'border-bj-green bg-bj-green/5 ring-1 ring-bj-green' : 'border-bj-gray-925 hover:border-bj-green'
                  }`}
                >
                  <input
                    type="radio"
                    name="etablissement-voeu"
                    value={e.id}
                    checked={etablissement?.id === e.id}
                    onChange={() => setEtablissement(e)}
                    className="mt-1 accent-bj-green"
                  />
                  <span className="flex-1 min-w-0">
                    <span className="block font-medium">{e.nom}</span>
                    <span className="mt-1v block text-xs text-bj-gray-500">
                      {[e.commune, e.departement].filter(Boolean).join(', ') || 'Lieu non renseigné'}
                      {e.internat ? ' · Internat' : ''}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        )}

        {erreur && <Alerte ton="erreur">{erreur}</Alerte>}

        <div className="flex flex-wrap gap-3v justify-between mt-6v">
          <button type="button" onClick={() => setEtape(etape - 1)} className="bj-btn bj-btn-secondary">
            ← Retour
          </button>
          <div className="flex flex-wrap gap-3v">
            <button type="button" onClick={passer} disabled={envoi} className="bj-btn bj-btn-secondary">
              Je choisirai plus tard
            </button>
            <button type="button" onClick={continuer} disabled={!etablissement || envoi} className="bj-btn bj-btn-primary disabled:opacity-60">
              {envoi ? 'Enregistrement…' : 'Enregistrer et continuer →'}
            </button>
          </div>
        </div>
      </section>
    );
  }

  const autresChoix = choix.filter((c, i) => c && i !== etape - 1);
  const proposees = filieres
    .filter(
      (f) =>
        !autresChoix.includes(f.id) &&
        (!type || f.type === type) &&
        (!seulementFavoris || favoris.has(f.id)) &&
        correspond(f, recherche),
    )
    .sort((a, b) => Number(favoris.has(b.id)) - Number(favoris.has(a.id)));
  const favorisAccessibles = filieres.filter((f) => favoris.has(f.id)).length;
  const favorisAilleurs = favoris.size - favorisAccessibles;
  const selection = choix[etape - 1];

  return (
    <section className="bg-white rounded-bj-md border border-bj-gray-925 p-6v">
      {progression}

      <h2 className="text-xl font-bold mb-1v">{etape === 1 ? "Quelle formation t'intéresse le plus ?" : `Ton ${ORDINAUX[etape - 1]} choix`}</h2>
      <p className="text-sm text-bj-gray-500 mb-4v">
        {filieres.length} formations accessibles {palier === 'TROISIEME' ? 'après le BEPC' : 'après le bac'}. Tes choix sont enregistrés à chaque
        étape.
      </p>

      <div className="flex flex-col md:flex-row gap-3v mb-4v">
        <div className="flex-1 relative">
          <Search className="absolute left-3v top-1/2 -translate-y-1/2 text-bj-gray-500" size={18} aria-hidden="true" />
          <label htmlFor="recherche-voeu" className="sr-only">Rechercher une formation</label>
          <input
            id="recherche-voeu"
            type="search"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher une formation…"
            className={`${CHAMP} pl-10`}
          />
        </div>
        <label htmlFor="type-voeu" className="sr-only">Type de formation</label>
        <select id="type-voeu" value={type} onChange={(e) => setType(e.target.value as TypeFiliere | '')} className={`${CHAMP} md:w-56`}>
          <option value="">Tous les types</option>
          {types.map((t) => (
            <option key={t} value={t}>
              {TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </div>

      {favorisAccessibles > 0 ? (
        <div className="mb-4v flex flex-wrap items-center gap-3v">
          <button
            type="button"
            aria-pressed={seulementFavoris}
            onClick={() => setSeulementFavoris(!seulementFavoris)}
            className={`inline-flex items-center gap-2v px-3v py-2v rounded-full border text-sm font-medium transition-colors ${
              seulementFavoris ? 'border-bj-red bg-bj-red/5 text-bj-red' : 'border-bj-gray-850 text-bj-gray-200 hover:border-bj-red'
            }`}
          >
            <Heart size={14} aria-hidden="true" fill={seulementFavoris ? 'currentColor' : 'none'} />
            Seulement mes formations mises de côté ({favorisAccessibles})
          </button>
          {favorisAilleurs > 0 && (
            <p className="text-xs text-bj-gray-500">
              {favorisAilleurs === 1 ? 'Une autre formation mise de côté ne se choisit' : `${favorisAilleurs} autres formations mises de côté ne se choisissent`}{' '}
              pas {palier === 'TROISIEME' ? 'après le BEPC' : 'après le bac'}.
            </p>
          )}
        </div>
      ) : (
        <p className="mb-4v text-xs text-bj-gray-500">
          Astuce : dans le{' '}
          <Link href="/catalogue" className="text-bj-green hover:underline">
            catalogue
          </Link>
          , appuie sur le cœur pour mettre des formations de côté : elles apparaîtront ici en premier.
        </p>
      )}

      <fieldset>
        <legend className="sr-only">Choisis une formation</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3v max-h-[28rem] overflow-y-auto pr-1v">
          {proposees.map((f) => (
            <label
              key={f.id}
              className={`flex gap-3v p-4v rounded-bj-sm border cursor-pointer transition-colors ${
                selection === f.id ? 'border-bj-green bg-bj-green/5 ring-1 ring-bj-green' : 'border-bj-gray-925 hover:border-bj-green'
              }`}
            >
              <input
                type="radio"
                name={`voeu-${etape}`}
                value={f.id}
                checked={selection === f.id}
                onChange={() => {
                  setChoix(choix.map((c, i) => (i === etape - 1 ? f.id : c)));
                  // L'établissement choisi doit dispenser les deux spécialités : un changement de choix l'invalide.
                  if (estBepc && etablissement) setEtablissement(null);
                }}
                className="mt-1 accent-bj-green"
              />
              <span className="flex-1 min-w-0">
                <span className="block font-medium">{f.nom}</span>
                <span className="mt-1v flex flex-wrap items-center gap-2v">
                  <BadgeType type={f.type} />
                  {favoris.has(f.id) && (
                    <span className="inline-flex items-center gap-1v text-xs font-medium text-bj-red">
                      <Heart size={12} aria-hidden="true" fill="currentColor" /> Mise de côté
                    </span>
                  )}
                  <Link
                    href={`/catalogue/${f.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-bj-green hover:underline inline-flex items-center gap-1v"
                  >
                    Fiche <ExternalLink size={12} aria-hidden="true" />
                  </Link>
                </span>
              </span>
            </label>
          ))}
          {proposees.length === 0 && <p className="text-sm text-bj-gray-500">Aucune formation ne correspond à ta recherche.</p>}
        </div>
      </fieldset>

      {erreur && <Alerte ton="erreur">{erreur}</Alerte>}

      <div className="flex flex-wrap gap-3v justify-between mt-6v">
        <button
          type="button"
          onClick={() => setEtape(etape === 1 ? RECAPITULATIF : etape - 1)}
          disabled={etape === 1 && !preference}
          className="bj-btn bj-btn-secondary disabled:opacity-40"
        >
          ← Retour
        </button>
        <div className="flex flex-wrap gap-3v">
          {etape > 1 && (
            <button type="button" onClick={passer} disabled={envoi} className="bj-btn bj-btn-secondary">
              Je n&apos;ai pas d&apos;autre choix
            </button>
          )}
          <button type="button" onClick={continuer} disabled={!selection || envoi} className="bj-btn bj-btn-primary disabled:opacity-60">
            {envoi ? 'Enregistrement…' : 'Enregistrer et continuer →'}
          </button>
        </div>
      </div>
    </section>
  );
}
