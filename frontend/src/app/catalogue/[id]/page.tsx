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
  ClipboardCheck,
  CornerDownRight,
  ExternalLink,
  FileText,
  GraduationCap,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import { filiereApi } from '@/lib/api';
import { DOMAINE_LABELS, Filiere, NIVEAU_LABELS, TYPE_COLORS, TYPE_LABELS, aUneSourceOfficielle, serieDuBac } from '@/lib/filiere';
import { useFavoris } from '@/stores/favorisStore';
import { BoutonComparer } from '@/components/catalogue/BoutonComparer';
import { BoutonFavori } from '@/components/catalogue/BoutonFavori';
import { Partage } from '@/components/catalogue/Partage';
import { Alerte } from '@/components/espace/ui';

const NON_RENSEIGNE = 'Non renseigné pour le moment.';

function Section({ icone, titre, children }: { icone: ReactNode; titre: string; children: ReactNode }) {
  return (
    <section className="py-6v border-b border-bj-gray-925 last:border-b-0 break-inside-avoid">
      <h2 className="flex items-center gap-2v text-sm font-bold uppercase tracking-wide text-bj-gray-500 mb-3v">
        <span className="text-bj-green" aria-hidden="true">{icone}</span>
        {titre}
      </h2>
      <div className="text-bj-gray-50">{children}</div>
    </section>
  );
}

function Liste({ elements }: { elements: string[] | null }) {
  if (!elements || elements.length === 0) return <p className="text-bj-gray-500">{NON_RENSEIGNE}</p>;
  return (
    <ul className="list-disc pl-6v space-y-1v">
      {elements.map((e) => (
        <li key={e}>{e}</li>
      ))}
    </ul>
  );
}

function ListeLiens({ filieres }: { filieres: Filiere[] }) {
  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6v gap-y-2v">
      {filieres.map((f) => (
        <li key={f.id}>
          <Link href={`/catalogue/${f.id}`} className="text-bj-green hover:underline">
            {f.nom}
          </Link>
        </li>
      ))}
    </ul>
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
      .list({ serie, limit: 100 })
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

  if (erreur) return <p className="text-bj-gray-500">Liste indisponible pour le moment.</p>;
  if (!liste) return <p className="text-bj-gray-500" aria-busy="true">Chargement…</p>;
  if (liste.length === 0) {
    return <p className="text-bj-gray-500">Aucune formation du supérieur n&apos;est encore recensée dans le catalogue pour ce bac.</p>;
  }

  const admises = liste.filter((f) => f.accesSerie === 'ADMISE');
  const sousConditions = liste.filter((f) => f.accesSerie === 'SOUS_CONDITIONS');
  return (
    <div id="poursuites">
      <p className="mb-3v">
        {liste.length} formation{liste.length > 1 ? 's' : ''} du supérieur de ce catalogue {liste.length > 1 ? 'sont accessibles' : 'est accessible'}{' '}
        avec un bac {serie} :
      </p>
      <ListeLiens filieres={admises} />
      {sousConditions.length > 0 && (
        <>
          <p className="mt-4v mb-2v text-sm font-medium text-bj-ochre-fonce">Sous conditions (à vérifier auprès de l&apos;établissement)</p>
          <ListeLiens filieres={sousConditions} />
        </>
      )}
      <Link href={`/catalogue?serie=${encodeURIComponent(serie)}&niveau=APRES_BAC`} className="inline-block mt-4v text-sm font-medium text-bj-green hover:underline print:hidden">
        Les parcourir dans le catalogue →
      </Link>
      <p className="mt-2v text-xs text-bj-gray-500">
        Liste limitée aux formations recensées dans ce catalogue : d&apos;autres formations existent au Bénin.
      </p>
    </div>
  );
}

const formaterDate = (iso: string) => new Date(iso).toLocaleDateString('fr-FR');

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
        <Link href="/catalogue" className="inline-flex items-center gap-2v text-sm font-medium text-bj-green mb-6v hover:underline print:hidden">
          <ArrowLeft size={16} aria-hidden="true" /> Retour au catalogue
        </Link>

        {statut === 'chargement' && (
          <div aria-busy="true" aria-label="Chargement de la fiche" className="space-y-4v">
            <div className="h-8 w-2/3 rounded-bj-sm bg-bj-gray-950 animate-pulse" />
            <div className="h-64 rounded-bj-md bg-bj-gray-950 animate-pulse" />
          </div>
        )}

        {statut === 'introuvable' && (
          <p className="text-bj-gray-500 text-lg py-12v text-center">Cette filière n&apos;existe pas ou plus dans le catalogue.</p>
        )}

        {statut === 'erreur' && (
          <p role="alert" className="text-bj-gray-500 text-lg py-12v text-center">
            Impossible de charger cette fiche pour le moment.
          </p>
        )}

        {statut === 'ok' && filiere && (
          <article>
            <p className="hidden print:block text-xs text-bj-gray-500 mb-4v">
              Fiche du catalogue Mon Orientation (République du Bénin), imprimée le {new Date().toLocaleDateString('fr-FR')}.
            </p>
            <div className="flex flex-wrap items-center gap-2v mb-3v">
              <span className={`px-3v py-1v rounded-full text-xs font-medium ${TYPE_COLORS[filiere.type]}`}>
                {TYPE_LABELS[filiere.type]}
              </span>
              {filiere.niveauAcces && (
                <span className="px-3v py-1v rounded-full text-xs font-medium bg-bj-gray-950 text-bj-gray-200">
                  {NIVEAU_LABELS[filiere.niveauAcces]}
                </span>
              )}
            </div>
            <h1 className="text-3xl font-bold mb-4v">{filiere.nom}</h1>

            {filiere.domaines.length > 0 && (
              <ul className="flex flex-wrap gap-2v mb-4v" aria-label="Domaines">
                {filiere.domaines.map((d) => (
                  <li key={d}>
                    <Link
                      href={`/catalogue?domaine=${d}`}
                      className="inline-block px-3v py-1v rounded-full border border-bj-gray-850 text-xs text-bj-gray-200 hover:border-bj-green hover:text-bj-green"
                    >
                      {DOMAINE_LABELS[d]}
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex flex-wrap items-center gap-2v mb-6v print:hidden">
              <BoutonFavori filiere={filiere} />
              <BoutonComparer filiere={filiere} avecBordure />
              <Partage titre={filiere.nom} />
            </div>
            {erreurFavoris && <Alerte ton="erreur">{erreurFavoris}</Alerte>}

            {!aUneSourceOfficielle(filiere) && (
              <div role="note" className="flex gap-3v items-start p-4v mb-6v rounded-bj-sm border border-bj-ochre/40 bg-bj-ochre/10 text-sm">
                <AlertTriangle className="text-bj-ochre-fonce shrink-0 mt-[2px]" size={18} aria-hidden="true" />
                <p>
                  Les informations de cette fiche proviennent de sources non officielles et doivent être confirmées
                  par le Ministère.
                </p>
              </div>
            )}

            <div className="bg-white rounded-bj-md border border-bj-gray-925 px-6v">
              <Section icone={<FileText size={18} />} titre="Description">
                <p>{filiere.description ?? NON_RENSEIGNE}</p>
              </Section>

              <Section icone={<GraduationCap size={18} />} titre="Diplômes délivrés">
                <Liste elements={filiere.diplomesDelivres} />
              </Section>

              <Section icone={<Briefcase size={18} />} titre="Métiers visés et débouchés">
                {filiere.metiersVises && filiere.metiersVises.length > 0 && <Liste elements={filiere.metiersVises} />}
                {filiere.debouches && <p className={filiere.metiersVises?.length ? 'mt-3v' : ''}>{filiere.debouches}</p>}
                {!filiere.metiersVises?.length && !filiere.debouches && <p className="text-bj-gray-500">{NON_RENSEIGNE}</p>}
              </Section>

              {serie && (
                <Section icone={<CornerDownRight size={18} />} titre="Et après ce bac ?">
                  <PoursuitesApresBac serie={serie} />
                </Section>
              )}

              <Section icone={<ClipboardCheck size={18} />} titre="Conditions d'accès">
                <p className={filiere.conditionsAcces ? '' : 'text-bj-gray-500'}>{filiere.conditionsAcces ?? NON_RENSEIGNE}</p>
              </Section>

              {filiere.seriesAdmises && filiere.seriesAdmises.length > 0 && (
                <Section icone={<BookOpen size={18} />} titre="Séries de bac admises">
                  <p>{filiere.seriesAdmises.join(', ')}</p>
                </Section>
              )}

              <Section icone={<MapPin size={18} />} titre="Où se former">
                <p className={filiere.ouSeFormer ? '' : 'text-bj-gray-500'}>{filiere.ouSeFormer ?? NON_RENSEIGNE}</p>
              </Section>

              <Section icone={<BarChart3 size={18} />} titre="Taux d'insertion">
                {filiere.tauxInsertion === null ? (
                  <p className="text-bj-gray-500">Aucune donnée publique disponible pour cette filière.</p>
                ) : (
                  <div className="flex items-center gap-3v">
                    <div
                      className="flex-1 h-3 rounded-full bg-bj-gray-925 overflow-hidden"
                      role="meter"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={filiere.tauxInsertion}
                      aria-label="Taux d'insertion"
                    >
                      <div className="h-full bg-bj-green" style={{ width: `${filiere.tauxInsertion}%` }} />
                    </div>
                    <span className="font-semibold">{filiere.tauxInsertion} %</span>
                  </div>
                )}
              </Section>

              <Section icone={<Wallet size={18} />} titre="Bourses">
                <p className={filiere.bourses === null ? 'text-bj-gray-500' : ''}>
                  {filiere.bourses === null
                    ? NON_RENSEIGNE
                    : filiere.bourses
                      ? 'Oui — places boursières attribuées sur classement.'
                      : 'Non'}
                </p>
              </Section>

              <Section icone={<ExternalLink size={18} />} titre="Sources">
                {filiere.sources && filiere.sources.length > 0 ? (
                  <ul className="space-y-3v text-sm liens-imprimes">
                    {filiere.sources.map((s) => (
                      <li key={s.url} className="flex flex-col gap-1v">
                        <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-bj-blue hover:underline">
                          {s.libelle}
                        </a>
                        <span className="flex items-center gap-2v text-xs text-bj-gray-500">
                          {s.officielle ? (
                            <span className="flex items-center gap-1v text-bj-green">
                              <ShieldCheck size={14} aria-hidden="true" /> Source officielle
                            </span>
                          ) : (
                            <span className="flex items-center gap-1v text-bj-ochre-fonce">
                              <AlertTriangle size={14} aria-hidden="true" /> Source non officielle
                            </span>
                          )}
                          · consultée le {formaterDate(s.consulteLe)}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-bj-gray-500">{NON_RENSEIGNE}</p>
                )}
              </Section>
            </div>

            <div className="mt-8v print:hidden">
              <Link href="/conseiller" className="bj-btn bj-btn-primary inline-flex items-center gap-2v">
                <MessageCircle size={18} aria-hidden="true" /> Poser une question au conseiller
              </Link>
            </div>
          </article>
        )}
      </div>
    </div>
  );
}
