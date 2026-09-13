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
  ExternalLink,
  FileText,
  GraduationCap,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import { filiereApi } from '@/lib/api';
import { Filiere, NIVEAU_LABELS, TYPE_COLORS, TYPE_LABELS, aUneSourceOfficielle } from '@/lib/filiere';

const NON_RENSEIGNE = 'Non renseigné pour le moment.';

function Section({ icone, titre, children }: { icone: ReactNode; titre: string; children: ReactNode }) {
  return (
    <section className="py-6v border-b border-bj-gray-925 last:border-b-0">
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

const formaterDate = (iso: string) => new Date(iso).toLocaleDateString('fr-FR');

export default function FicheFilierePage() {
  const { id } = useParams<{ id: string }>();
  const [filiere, setFiliere] = useState<Filiere | null>(null);
  const [statut, setStatut] = useState<'chargement' | 'ok' | 'introuvable' | 'erreur'>('chargement');

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

  return (
    <div className="py-8v">
      <div className="bj-container max-w-3xl">
        <Link href="/catalogue" className="inline-flex items-center gap-2v text-sm font-medium text-bj-green mb-6v hover:underline">
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
            <h1 className="text-3xl font-bold mb-6v">{filiere.nom}</h1>

            {!aUneSourceOfficielle(filiere) && (
              <div role="note" className="flex gap-3v items-start p-4v mb-6v rounded-bj-sm border border-bj-ochre/40 bg-bj-ochre/10 text-sm">
                <AlertTriangle className="text-bj-ochre shrink-0 mt-[2px]" size={18} aria-hidden="true" />
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
                  <ul className="space-y-3v text-sm">
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
                            <span className="flex items-center gap-1v text-bj-ochre">
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

            <div className="mt-8v">
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
