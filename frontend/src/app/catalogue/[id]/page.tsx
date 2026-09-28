'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  BookOpen,
  Briefcase,
  CheckCircle2,
  ClipboardCheck,
  Compass,
  CornerDownRight,
  ExternalLink,
  FileText,
  GraduationCap,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Wallet,
} from 'lucide-react';
import { filiereApi, orientationApi, type EvaluationFiliere } from '@/lib/api';
import type { Recommandation } from '@/lib/apprenant';
import {
  ContenuMetier as ContenuMetierType,
  DOMAINE_LABELS,
  ElementListe,
  Filiere,
  LieuDeFormation,
  NIVEAU_LABELS,
  TYPE_LABELS,
  TYPE_TONES,
  aUneSourceOfficielle,
  avecAdmission,
  serieDuBac,
} from '@/lib/filiere';
import { useAuthStore } from '@/stores/authStore';
import { useFavoris } from '@/stores/favorisStore';
import { BoutonComparer } from '@/components/catalogue/BoutonComparer';
import { BoutonFavori } from '@/components/catalogue/BoutonFavori';
import { Partage } from '@/components/catalogue/Partage';
import { Alerte } from '@/components/espace/ui';
import { Badge } from '@/components/ui/Badge';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { ButtonLink } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';

const NON_RENSEIGNE = 'Non renseigné pour le moment.';

function Section({ icone, titre, children }: { icone: ReactNode; titre: string; children: ReactNode }) {
  return (
    <section className="py-6v border-b border-border last:border-b-0 break-inside-avoid">
      <h2 className="flex items-center gap-2v text-sm font-bold uppercase tracking-wide text-text-secondary mb-3v">
        <span className="text-primary" aria-hidden="true">{icone}</span>
        {titre}
      </h2>
      <div className="text-text">{children}</div>
    </section>
  );
}

function Liste({ elements }: { elements: string[] | null }) {
  if (!elements || elements.length === 0) return <p className="text-text-secondary">{NON_RENSEIGNE}</p>;
  return (
    <ul className="list-disc pl-6v space-y-1v">
      {elements.map((e) => (
        <li key={e}>{e}</li>
      ))}
    </ul>
  );
}

/** Liste plate, ou liste de groupes titrés (« Emploi salarié » / « Auto-emploi »…) telle que publiée. */
function Elements({ elements }: { elements: ElementListe[] }) {
  if (elements.every((e) => typeof e === 'string')) {
    return (
      <ul className="list-disc pl-6v space-y-1v">
        {(elements as string[]).map((e) => (
          <li key={e}>{e}</li>
        ))}
      </ul>
    );
  }
  return (
    <div className="space-y-3v">
      {elements.map((e) =>
        typeof e === 'string' ? (
          <p key={e}>{e}</p>
        ) : (
          <div key={e.titre}>
            <p className="font-medium mb-1v">{e.titre}</p>
            <ul className="list-disc pl-6v space-y-1v">
              {e.elements.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
        ),
      )}
    </div>
  );
}

function SousTitre({ children }: { children: ReactNode }) {
  return <h3 className="font-bold text-sm mb-2v mt-5v first:mt-0">{children}</h3>;
}

/** Contenu d'une fiche des catalogues officiels des nouveaux métiers (DTM). */
function LeMetier({ contenu }: { contenu: ContenuMetierType }) {
  return (
    <div>
      {contenu.secteur && <p>{contenu.secteur}</p>}
      <p className={contenu.secteur ? 'mt-3v' : ''}>{contenu.description}</p>
      {contenu.profilSortie && <p className="mt-3v text-sm text-text-secondary">{contenu.profilSortie}</p>}

      {contenu.missions && (
        <>
          <SousTitre>Missions principales</SousTitre>
          <Elements elements={contenu.missions} />
        </>
      )}

      {contenu.competences.length > 0 && (
        <>
          <SousTitre>Compétences</SousTitre>
          {contenu.competencesIntro && <p className="mb-2v text-sm text-text-secondary">{contenu.competencesIntro}</p>}
          <Elements elements={contenu.competences} />
        </>
      )}

      {contenu.qualites && (
        <>
          <SousTitre>Qualités requises</SousTitre>
          <Elements elements={contenu.qualites} />
        </>
      )}

      {contenu.secteursActivite && (
        <>
          <SousTitre>Secteurs d&apos;activité</SousTitre>
          <Elements elements={contenu.secteursActivite} />
        </>
      )}

      <SousTitre>Débouchés</SousTitre>
      <Elements elements={contenu.debouches} />

      {contenu.employeurs && (
        <>
          <SousTitre>Entreprises et structures qui recrutent</SousTitre>
          <Elements elements={contenu.employeurs} />
        </>
      )}

      {(contenu.partenariats || contenu.perspectives) && (
        <>
          <SousTitre>{contenu.catalogue === 'LTA' ? 'Partenariat avec le milieu professionnel' : 'Partenariats'}</SousTitre>
          {contenu.partenariatsIntro && <p className="mb-2v text-sm text-text-secondary">{contenu.partenariatsIntro}</p>}
          {contenu.partenariats && <Elements elements={contenu.partenariats} />}
          {contenu.perspectives && <Elements elements={contenu.perspectives} />}
        </>
      )}
    </div>
  );
}

function ListeLiens({ filieres }: { filieres: Filiere[] }) {
  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6v gap-y-2v">
      {filieres.map((f) => (
        <li key={f.id}>
          <Link href={`/catalogue/${f.id}`} className="text-primary hover:underline">
            {f.nom}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Formations regroupées par université (la plus fournie d'abord), chaque groupe dépliable. */
function ParUniversite({ filieres }: { filieres: Filiere[] }) {
  const groupes = new Map<string, Filiere[]>();
  for (const f of filieres) {
    const universite = f.etablissement?.universite ?? 'Autres établissements';
    groupes.set(universite, [...(groupes.get(universite) ?? []), f]);
  }
  const tries = Array.from(groupes.entries()).sort((a, b) => b[1].length - a[1].length);
  return (
    <div className="space-y-2v">
      {tries.map(([universite, liste], i) => (
        <details key={universite} open={i === 0} className="rounded-bj-sm border border-border px-4v py-3v">
          <summary className="cursor-pointer font-medium">
            {universite} <span className="font-normal text-text-secondary">({liste.length})</span>
          </summary>
          <div className="mt-3v">
            <ListeLiens filieres={liste} />
          </div>
        </details>
      ))}
    </div>
  );
}

/** Établissements où la formation est ouverte, par département ; les écoles des métiers, sans adresse publiée, à la fin. */
function LieuxDeFormation({ offres, precision }: { offres: LieuDeFormation[]; precision: string | null }) {
  const groupes = new Map<string, LieuDeFormation[]>();
  for (const o of offres) {
    const departement = o.etablissement.departement ?? '';
    groupes.set(departement, [...(groupes.get(departement) ?? []), o]);
  }
  return (
    <>
      <p className="text-sm text-text-secondary mb-4v">
        {offres.length === 1 ? 'Un établissement' : `${offres.length} établissements`} d&apos;après les documents officiels du
        ministère.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6v gap-y-6v">
        {Array.from(groupes.entries()).map(([departement, liste]) => (
          <div key={departement || 'ecoles-des-metiers'} className="break-inside-avoid">
            <h3 className="text-sm font-bold mb-2v">{departement || 'Écoles des métiers (implantation non publiée)'}</h3>
            <ul className="space-y-2v">
              {liste.map(({ etablissement: e }) => (
                <li key={e.code}>
                  <span className="font-medium">{e.nom}</span>
                  {e.commune && <span className="text-text-secondary"> — {e.commune}</span>}
                  {e.internat && (
                    <span className="ml-2v inline-block px-2v rounded-full border border-primary bg-surface text-xs font-medium text-primary">Internat</span>
                  )}
                  {e.quartier && <span className="block text-xs text-text-secondary">{e.quartier}</span>}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {precision && <p className="mt-4v text-sm text-text-secondary">{precision}</p>}
    </>
  );
}

/** Admission au supérieur d'après le guide officiel du MESRS. */
function Admission({ filiere: f }: { filiere: Filiere }) {
  const nonPrecise = <span className="text-text-secondary">Non précisé</span>;
  const lignes: [string, ReactNode][] = [
    ['Mode d’entrée', f.modeEntree ?? nonPrecise],
    ['Séries de bac recommandées', f.seriesRecommandees ?? nonPrecise],
    ['Matières du classement', f.matieresClassement ?? nonPrecise],
  ];
  if (f.quotaBourses !== null) lignes.push(['Places avec bourse', f.quotaBourses]);
  if (f.quotaAides !== null) lignes.push(['Aides universitaires ou places partiellement payantes', f.quotaAides]);
  return (
    <>
      <dl className="grid grid-cols-1 sm:grid-cols-[14rem_1fr] gap-x-6v gap-y-3v">
        {lignes.map(([titre, valeur]) => (
          <div key={titre} className="contents">
            <dt className="text-sm text-text-secondary">{titre}</dt>
            <dd>{valeur}</dd>
          </div>
        ))}
      </dl>
      {f.modeEntree?.startsWith('Classement') && (
        <p className="mt-4v text-sm text-text-secondary">
          Le classement se fait filière par filière, à partir de la moyenne des matières du classement pondérées par les coefficients du
          bac. Les meilleures moyennes obtiennent les bourses, puis les aides et places partiellement payantes. Les choix se font sur la
          plateforme officielle{' '}
          <a href="https://apresmonbac.bj" target="_blank" rel="noopener noreferrer" className="text-info hover:underline">
            apresmonbac.bj
          </a>
          .
        </p>
      )}
    </>
  );
}

/** « Et après ce bac ? » : formations du supérieur du catalogue qui admettent la série. */
function PoursuitesApresBac({ serie }: { serie: string }) {
  const [liste, setListe] = useState<Filiere[] | null>(null);
  const [erreur, setErreur] = useState(false);

  useEffect(() => {
    let annule = false;
    setListe(null);
    setErreur(false);
    filiereApi
      .list({ serie, limit: 500 })
      .then(({ data }) => {
        if (!annule) setListe(data.items);
      })
      .catch(() => {
        if (!annule) setErreur(true);
      });
    return () => {
      annule = true;
    };
  }, [serie]);

  if (erreur) return <p className="text-text-secondary">Liste indisponible pour le moment.</p>;
  if (!liste) return <p className="text-text-secondary" aria-busy="true">Chargement…</p>;
  if (liste.length === 0) {
    return <p className="text-text-secondary">Aucune formation du supérieur n&apos;est encore recensée dans le catalogue pour ce bac.</p>;
  }

  const admises = liste.filter((f) => f.accesSerie === 'ADMISE');
  const sousConditions = liste.filter((f) => f.accesSerie === 'SOUS_CONDITIONS');
  return (
    <div id="poursuites">
      <p className="mb-3v">
        {liste.length} formation{liste.length > 1 ? 's' : ''} du supérieur de ce catalogue {liste.length > 1 ? 'sont accessibles' : 'est accessible'}{' '}
        avec un bac {serie} :
      </p>
      <ParUniversite filieres={admises} />
      {sousConditions.length > 0 && (
        <>
          <p className="mt-4v mb-2v text-sm font-medium text-terre-strong">Sous conditions (à vérifier auprès de l&apos;établissement)</p>
          <ListeLiens filieres={sousConditions} />
        </>
      )}
      <Link href={`/catalogue?serie=${encodeURIComponent(serie)}&niveau=APRES_BAC`} className="inline-block mt-4v text-sm font-medium text-primary hover:underline print:hidden">
        Les parcourir dans le catalogue →
      </Link>
      <p className="mt-2v text-xs text-text-secondary">
        Liste limitée aux formations recensées dans ce catalogue : d&apos;autres formations existent au Bénin.
      </p>
    </div>
  );
}

const formaterDate = (iso: string) => new Date(iso).toLocaleDateString('fr-FR');

/**
 * « Pourquoi cette formation peut te correspondre » : jamais de justification inventée. D'abord la
 * vraie explication déjà calculée par le moteur d'orientation pour cet élève (identique à celle de la
 * page Recommandations) si la formation en fait partie ; sinon, évaluée en direct via `evaluer_filiere`
 * (même outil que celui de Guido, désormais aussi exposé au frontend) — utile en particulier quand la
 * formation n'est pas admissible (ex. une condition de notes non remplie) : le détail dit alors
 * précisément dans quelle(s) matière(s) et de combien il manque, pas seulement « hors de tes pistes ».
 */
function PourquoiCetteFormation({ filiereId, code }: { filiereId: string; code: string | null }) {
  const user = useAuthStore((s) => s.user);
  const [recommandations, setRecommandations] = useState<Recommandation[] | null | undefined>(undefined);
  const [evaluation, setEvaluation] = useState<EvaluationFiliere | null | undefined>(undefined);

  useEffect(() => {
    if (user?.role !== 'APPRENANT' || !user.nip) {
      setRecommandations(undefined);
      return;
    }
    let annule = false;
    setRecommandations(undefined);
    orientationApi
      .getRecommandations(user.nip)
      .then(({ data }) => {
        if (!annule) setRecommandations(data);
      })
      .catch(() => {
        if (!annule) setRecommandations(null);
      });
    return () => {
      annule = true;
    };
  }, [user?.role, user?.nip]);

  const nip = user?.role === 'APPRENANT' ? user.nip : null;
  const dejaCalculee = recommandations?.some((r) => r.filiereId === filiereId) ?? false;

  useEffect(() => {
    if (!nip || !code || recommandations === undefined || dejaCalculee) {
      setEvaluation(undefined);
      return;
    }
    let annule = false;
    setEvaluation(undefined);
    orientationApi
      .evaluerFiliere(nip, code)
      .then(({ data }) => {
        if (!annule) setEvaluation(data);
      })
      .catch(() => {
        if (!annule) setEvaluation(null);
      });
    return () => {
      annule = true;
    };
  }, [nip, code, recommandations, dejaCalculee]);

  if (!user) {
    return (
      <Cadre>
        <p className="text-sm text-text-secondary">
          <Link href="/identification" className="font-medium text-primary hover:underline">
            Identifie-toi
          </Link>{' '}
          pour savoir si cette formation te correspond, à partir de ton profil de découverte.
        </p>
      </Cadre>
    );
  }
  if (user.role !== 'APPRENANT') return null;
  if (recommandations === undefined) {
    return (
      <Cadre>
        <p className="text-sm text-text-secondary" aria-busy="true">
          Vérification de la correspondance avec ton profil…
        </p>
      </Cadre>
    );
  }
  if (recommandations === null) {
    return (
      <Cadre>
        <p className="text-sm text-text-secondary">Impossible de vérifier la correspondance avec ton profil pour le moment.</p>
      </Cadre>
    );
  }

  const correspondance = recommandations.find((r) => r.filiereId === filiereId);

  if (!correspondance) {
    if (!code || evaluation === null) {
      return (
        <Cadre>
          <p className="text-sm text-text-secondary">
            Impossible de vérifier la correspondance de cette formation avec ton profil pour le moment —{' '}
            <Link href="/espace-apprenant/conseiller" className="font-medium text-primary hover:underline">
              demande l&apos;avis de Guido
            </Link>
            , qui peut évaluer n&apos;importe quelle formation du catalogue.
          </p>
        </Cadre>
      );
    }
    if (evaluation === undefined) {
      return (
        <Cadre>
          <p className="text-sm text-text-secondary" aria-busy="true">
            Vérification de la correspondance avec ton profil…
          </p>
        </Cadre>
      );
    }
    if (!evaluation.accessibleAuNiveauActuel) {
      return (
        <Cadre>
          <p className="text-sm text-text-secondary">Cette formation ne correspond pas à ton niveau actuel.</p>
        </Cadre>
      );
    }
    return (
      <Cadre>
        <div className="flex items-start justify-between gap-4v mb-3v">
          <p className="text-sm text-text-secondary max-w-md">
            {evaluation.admissible
              ? 'Cette formation ne fait pas encore partie de tes pistes recommandées, mais rien ne t’en empêche pour l’instant.'
              : 'Au moins une condition officielle d’inscription n’est pas encore remplie pour cette formation, d’après tes notes actuelles.'}
          </p>
          {evaluation.score !== null && (
            <div className="text-right shrink-0">
              <p className="text-2xl font-bold text-primary leading-none">
                {Math.round(evaluation.score)}
                <span className="text-sm font-medium text-text-secondary">/100</span>
              </p>
              <p className="text-xs text-text-secondary">compatibilité</p>
            </div>
          )}
        </div>
        {evaluation.criteres.length > 0 && (
          <ul className="space-y-1v text-sm">
            {evaluation.criteres.map((c, i) => (
              <li key={i} className={`flex gap-2v ${c.alerte ? 'text-warning-strong' : ''}`}>
                {c.alerte ? (
                  <AlertTriangle size={15} className="shrink-0 mt-[2px]" aria-hidden="true" />
                ) : (
                  <CheckCircle2 size={15} className="shrink-0 mt-[2px] text-primary" aria-hidden="true" />
                )}
                {c.detail}
              </li>
            ))}
          </ul>
        )}
        {!evaluation.admissible && (
          <p className="mt-3v text-sm text-text-secondary">
            Si tu tiens à ce choix, c&apos;est dans ces matières qu&apos;il faut progresser d&apos;ici là.
          </p>
        )}
      </Cadre>
    );
  }

  const score = Math.round(correspondance.score);
  return (
    <Cadre>
      <div className="flex items-start justify-between gap-4v mb-3v">
        <p className="text-sm text-text-secondary max-w-md">
          {correspondance.explication || 'Cette formation a été rapprochée de ton profil et de ton parcours scolaire.'}
        </p>
        <div className="text-right shrink-0">
          <p className="text-2xl font-bold text-primary leading-none">
            {score}
            <span className="text-sm font-medium text-text-secondary">/100</span>
          </p>
          <p className="text-xs text-text-secondary">compatibilité</p>
        </div>
      </div>
      {correspondance.criteres && correspondance.criteres.length > 0 && (
        <ul className="space-y-1v text-sm">
          {correspondance.criteres.map((c, i) => (
            <li key={i} className={`flex gap-2v ${c.alerte ? 'text-warning-strong' : ''}`}>
              {c.alerte ? (
                <AlertTriangle size={15} className="shrink-0 mt-[2px]" aria-hidden="true" />
              ) : (
                <CheckCircle2 size={15} className="shrink-0 mt-[2px] text-primary" aria-hidden="true" />
              )}
              {c.detail}
            </li>
          ))}
        </ul>
      )}
      <Link href="/espace-apprenant/recommandations" className="inline-block mt-3v text-sm font-medium text-primary hover:underline">
        Voir toutes tes pistes →
      </Link>
    </Cadre>
  );
}

/** Bandeau commun à tous les états de PourquoiCetteFormation. */
function Cadre({ children }: { children: ReactNode }) {
  return (
    <section className="rounded-bj-md border border-primary/25 bg-primary-soft p-4v md:p-5v mb-6v" aria-labelledby="pourquoi-titre">
      <h2 id="pourquoi-titre" className="flex items-center gap-2v text-sm font-bold uppercase tracking-wide text-primary mb-3v">
        <Sparkles size={16} aria-hidden="true" /> Pourquoi cette formation peut te correspondre
      </h2>
      {children}
    </section>
  );
}

/** Quelques formations du même domaine, pour continuer à explorer — jamais présenté comme une recommandation personnalisée (voir PourquoiCetteFormation pour ça). */
function FormationsProches({ filiereId, domaine }: { filiereId: string; domaine: string }) {
  const [proches, setProches] = useState<Filiere[] | null>(null);

  useEffect(() => {
    let annule = false;
    setProches(null);
    filiereApi
      .list({ domaine, limit: 8 })
      .then(({ data }) => {
        if (!annule) setProches(data.items.filter((f) => f.id !== filiereId).slice(0, 3));
      })
      .catch(() => {
        if (!annule) setProches([]);
      });
    return () => {
      annule = true;
    };
  }, [filiereId, domaine]);

  if (proches !== null && proches.length === 0) return null;

  return (
    <section className="mt-8v print:hidden" aria-labelledby="proches-titre">
      <h2 id="proches-titre" className="flex items-center gap-2v text-lg font-bold mb-4v">
        <Compass size={18} className="text-primary" aria-hidden="true" /> Formations proches
      </h2>
      {proches === null ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3v" aria-busy="true">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 rounded-bj-md bg-surface-sunken skeleton-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3v">
          {proches.map((f) => (
            <Link key={f.id} href={`/catalogue/${f.id}`} className="bj-card bj-card-hoverable block p-4v">
              <Badge ton={TYPE_TONES[f.type]}>{TYPE_LABELS[f.type]}</Badge>
              <p className="font-semibold mt-2v text-sm leading-snug">{f.nom}</p>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

export default function FicheFilierePage() {
  const { id } = useParams<{ id: string }>();
  const [filiere, setFiliere] = useState<Filiere | null>(null);
  const [statut, setStatut] = useState<'chargement' | 'ok' | 'introuvable' | 'erreur'>('chargement');
  const { erreur: erreurFavoris } = useFavoris();

  useEffect(() => {
    let annule = false;
    setStatut('chargement');
    filiereApi
      .get(id)
      .then(({ data }) => {
        if (annule) return;
        setFiliere(data);
        setStatut('ok');
      })
      .catch((err) => {
        if (!annule) setStatut(err.response?.status === 404 ? 'introuvable' : 'erreur');
      });
    return () => {
      annule = true;
    };
  }, [id]);

  const serie = filiere ? serieDuBac(filiere) : null;

  return (
    <div className="py-8v">
      <div className="bj-container max-w-3xl">
        {statut === 'ok' && filiere ? (
          <Breadcrumb className="mb-6v" items={[{ label: 'Catalogue', href: '/catalogue' }, { label: filiere.nom }]} />
        ) : (
          <Link href="/catalogue" className="inline-flex items-center gap-2v text-sm font-medium text-primary mb-6v hover:underline print:hidden">
            <ArrowLeft size={16} aria-hidden="true" /> Retour au catalogue
          </Link>
        )}

        {statut === 'chargement' && (
          <div aria-busy="true" aria-label="Chargement de la fiche" className="space-y-4v">
            <div className="h-8 w-2/3 rounded-bj-sm bg-surface-sunken skeleton-pulse" />
            <div className="h-64 rounded-bj-md bg-surface-sunken skeleton-pulse" />
          </div>
        )}

        {statut === 'introuvable' && (
          <p className="text-text-secondary text-lg py-12v text-center">Cette filière n&apos;existe pas ou plus dans le catalogue.</p>
        )}

        {statut === 'erreur' && (
          <p role="alert" className="text-text-secondary text-lg py-12v text-center">
            Impossible de charger cette fiche pour le moment.
          </p>
        )}

        {statut === 'ok' && filiere && (
          <article className="stagger-sections">
            <p className="hidden print:block text-xs text-text-secondary mb-4v">
              Fiche du catalogue Mon Orientation (République du Bénin), imprimée le {new Date().toLocaleDateString('fr-FR')}.
            </p>
            <div className="flex flex-wrap items-center gap-2v mb-3v">
              <Badge ton={TYPE_TONES[filiere.type]}>{TYPE_LABELS[filiere.type]}</Badge>
              {filiere.niveauAcces && (
                <span className="px-3v py-1v rounded-full text-xs font-medium bg-surface-sunken text-text">
                  {NIVEAU_LABELS[filiere.niveauAcces]}
                </span>
              )}
            </div>
            <h1 className="text-3xl font-bold mb-4v">{filiere.nom}</h1>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3v mb-6v" aria-label="À retenir">
              <div className="rounded-bj-sm border border-primary/30 bg-primary/5 p-3v">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary mb-1v">Métiers visés</p>
                <p className="text-sm font-medium">{filiere.metiersVises?.slice(0, 2).join(' · ') ?? 'À découvrir dans la fiche'}</p>
              </div>
              <div className="rounded-bj-sm border border-info/30 bg-info/5 p-3v">
                <p className="text-xs font-semibold uppercase tracking-wide text-info mb-1v">Accès</p>
                <p className="text-sm font-medium">{filiere.niveauAcces ? NIVEAU_LABELS[filiere.niveauAcces] : 'Conditions à vérifier'}</p>
              </div>
              <div className="rounded-bj-sm border border-accent/50 bg-accent-soft p-3v">
                <p className="text-xs font-semibold uppercase tracking-wide text-accent-strong mb-1v">Où se former</p>
                <p className="text-sm font-medium">{filiere.offres?.length ? `${filiere.offres.length} établissement${filiere.offres.length > 1 ? 's' : ''}` : 'Voir les lieux disponibles'}</p>
              </div>
            </div>

            {filiere.domaines.length > 0 && (
              <ul className="flex flex-wrap gap-2v mb-6v" aria-label="Domaines">
                {filiere.domaines.map((d) => (
                  <li key={d}>
                    <Link
                      href={`/catalogue?domaine=${d}`}
                      className="inline-block px-3v py-1v rounded-full border border-border-strong text-xs text-text hover:border-primary hover:text-primary"
                    >
                      {DOMAINE_LABELS[d]}
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            <PourquoiCetteFormation filiereId={filiere.id} code={filiere.code} />

            <div className="flex flex-wrap items-center gap-2v mb-6v print:hidden">
              <BoutonFavori filiere={filiere} />
              <BoutonComparer filiere={filiere} avecBordure />
              <Partage titre={filiere.nom} />
            </div>
            {erreurFavoris && <Alerte ton="erreur">{erreurFavoris}</Alerte>}

            {!aUneSourceOfficielle(filiere) && (
              <div role="note" className="flex gap-3v items-start p-4v mb-6v rounded-bj-sm border border-terre/40 bg-terre-soft text-sm">
                <AlertTriangle className="text-terre-strong shrink-0 mt-[2px]" size={18} aria-hidden="true" />
                <p>
                  Les informations de cette fiche proviennent de sources non officielles et doivent être confirmées
                  par le Ministère.
                </p>
              </div>
            )}

            <div className="bg-surface rounded-bj-md border border-border px-6v">
              <Section icone={<FileText size={18} />} titre="Description">
                <p>{filiere.description ?? NON_RENSEIGNE}</p>
              </Section>

              <Section icone={<GraduationCap size={18} />} titre="Diplômes délivrés">
                <Liste elements={filiere.diplomesDelivres} />
              </Section>

              {filiere.contenuMetier ? (
                <Section icone={<Briefcase size={18} />} titre="Le métier">
                  <LeMetier contenu={filiere.contenuMetier} />
                </Section>
              ) : (
                <Section icone={<Briefcase size={18} />} titre="Métiers visés et débouchés">
                  {filiere.metiersVises && filiere.metiersVises.length > 0 && <Liste elements={filiere.metiersVises} />}
                  {filiere.debouches && <p className={filiere.metiersVises?.length ? 'mt-3v' : ''}>{filiere.debouches}</p>}
                  {!filiere.metiersVises?.length && !filiere.debouches && <p className="text-text-secondary">{NON_RENSEIGNE}</p>}
                </Section>
              )}

              {serie && (
                <Section icone={<CornerDownRight size={18} />} titre="Et après ce bac ?">
                  <PoursuitesApresBac serie={serie} />
                </Section>
              )}

              {avecAdmission(filiere) ? (
                <Section icone={<ClipboardCheck size={18} />} titre="Admission">
                  <Admission filiere={filiere} />
                </Section>
              ) : (
                <>
                  <Section icone={<ClipboardCheck size={18} />} titre="Conditions d'accès">
                    <p className={filiere.conditionsAcces ? '' : 'text-text-secondary'}>{filiere.conditionsAcces ?? NON_RENSEIGNE}</p>
                  </Section>

                  {filiere.seriesAdmises && filiere.seriesAdmises.length > 0 && (
                    <Section icone={<BookOpen size={18} />} titre="Séries de bac admises">
                      <p>{filiere.seriesAdmises.join(', ')}</p>
                    </Section>
                  )}
                </>
              )}

              <Section icone={<MapPin size={18} />} titre="Où se former">
                {filiere.offres && filiere.offres.length > 0 ? (
                  <LieuxDeFormation offres={filiere.offres} precision={filiere.ouSeFormer} />
                ) : (
                  <p className={filiere.ouSeFormer ? '' : 'text-text-secondary'}>{filiere.ouSeFormer ?? NON_RENSEIGNE}</p>
                )}
              </Section>

              <Section icone={<BarChart3 size={18} />} titre="Taux d'insertion">
                {filiere.tauxInsertion === null ? (
                  <p className="text-text-secondary">Aucune donnée publique disponible pour cette filière.</p>
                ) : (
                  <div className="flex items-center gap-3v">
                    <ProgressBar className="flex-1" value={filiere.tauxInsertion} label="Taux d'insertion" size="sm" />
                    <span className="font-semibold shrink-0">{filiere.tauxInsertion} %</span>
                  </div>
                )}
              </Section>

              {/* Pour les fiches du guide du MESRS, le nombre de places avec bourse figure dans « Admission » */}
              {filiere.quotaBourses === null && (
                <Section icone={<Wallet size={18} />} titre="Bourses">
                  <p className={filiere.bourses === null ? 'text-text-secondary' : ''}>
                    {filiere.bourses === null
                      ? NON_RENSEIGNE
                      : filiere.bourses
                        ? 'Oui — places boursières attribuées sur classement.'
                        : 'Non'}
                  </p>
                </Section>
              )}

              <Section icone={<ExternalLink size={18} />} titre="Sources">
                {filiere.sources && filiere.sources.length > 0 ? (
                  <ul className="space-y-3v text-sm liens-imprimes">
                    {filiere.sources.map((s) => (
                      <li key={s.libelle} className="flex flex-col gap-1v">
                        <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-info hover:underline">
                          {s.libelle}
                        </a>
                        <span className="flex items-center gap-2v text-xs text-text-secondary">
                          {s.officielle ? (
                            <span className="flex items-center gap-1v text-primary">
                              <ShieldCheck size={14} aria-hidden="true" /> Source officielle
                            </span>
                          ) : (
                            <span className="flex items-center gap-1v text-terre-strong">
                              <AlertTriangle size={14} aria-hidden="true" /> Source non officielle
                            </span>
                          )}
                          · consultée le {formaterDate(s.consulteLe)}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-text-secondary">{NON_RENSEIGNE}</p>
                )}
              </Section>
            </div>

            <div className="mt-8v print:hidden">
              <ButtonLink href="/conseiller" icon={<MessageCircle size={18} aria-hidden="true" />}>
                Poser une question à Guido
              </ButtonLink>
            </div>

            {filiere.domaines[0] && <FormationsProches filiereId={filiere.id} domaine={filiere.domaines[0]} />}
          </article>
        )}
      </div>
    </div>
  );
}
