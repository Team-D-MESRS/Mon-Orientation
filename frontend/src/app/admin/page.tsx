'use client';

import { useEffect, useState } from 'react';
import { Archive, Database, ExternalLink, FileCheck2, MessageCircle, ShieldCheck, Users } from 'lucide-react';
import { api, filiereApi, statsApi, type StatsNationales } from '@/lib/api';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { Alerte, Chargement } from '@/components/espace/ui';
import { ActionCard } from '@/components/ui/ActionCard';
import { ButtonLink } from '@/components/ui/Button';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { StatCard } from '@/components/ui/StatCard';
import { StatusPill } from '@/components/ui/StatusPill';
import type { ValeursFiltres } from '@/lib/filiere';

export default function AdminPage() {
  return (
    <RequireAuth roles={['ADMIN']}>
      <ConsoleAdmin />
    </RequireAuth>
  );
}

function ConsoleAdmin() {
  const [stats, setStats] = useState<StatsNationales | null>(null);
  const [filtres, setFiltres] = useState<ValeursFiltres | null>(null);
  const [health, setHealth] = useState<{ status: string; database: string } | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([statsApi.getNationales(), filiereApi.filtres(), api.get('/health')])
      .then(([statsResponse, filtresResponse, healthResponse]) => {
        setStats(statsResponse.data);
        setFiltres(filtresResponse.data);
        setHealth(healthResponse.data);
      })
      .catch(() => setErreur('Les indicateurs administrateur sont momentanément indisponibles.'));
  }, []);

  if (erreur) {
    return (
      <div className="py-8v">
        <div className="bj-container">
          <Alerte ton="erreur">{erreur}</Alerte>
        </div>
      </div>
    );
  }
  if (!stats || !filtres || !health) {
    return (
      <div className="py-8v">
        <div className="bj-container">
          <Chargement texte="Chargement de la console d’administration…" />
        </div>
      </div>
    );
  }

  const apiOk = health.status === 'ok';
  const dbOk = health.database === 'ok';

  return (
    <div className="py-8v">
      <div className="bj-container space-y-6v">
        <SectionHeader
          as="h1"
          eyebrow="Accès administration"
          title="Piloter la plateforme"
          subtitle="Référentiel, qualité des sources, accès et santé technique."
          action={
            <ButtonLink href="/stats" variant="secondary" iconRight={<ExternalLink size={16} aria-hidden="true" />}>
              Voir les statistiques nationales
            </ButtonLink>
          }
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4v">
          <StatCard icon={<Users size={18} aria-hidden="true" />} label="Apprenants suivis" value={stats.totalApprenants.toLocaleString('fr-FR')} />
          <StatCard icon={<FileCheck2 size={18} aria-hidden="true" />} label="Fiches formations" value={stats.totalFiliere.toLocaleString('fr-FR')} />
          <StatCard icon={<Database size={18} aria-hidden="true" />} label="Établissements" value={stats.totalEtablissements.toLocaleString('fr-FR')} />
          <StatCard
            icon={<ShieldCheck size={18} aria-hidden="true" />}
            label="API / base"
            value={
              <span className="flex flex-wrap gap-2v">
                <StatusPill ton={apiOk ? 'succes' : 'erreur'}>API {health.status}</StatusPill>
                <StatusPill ton={dbOk ? 'succes' : 'erreur'}>Base {health.database}</StatusPill>
              </span>
            }
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6v">
          <section className="bj-card p-5v" aria-labelledby="qualite-catalogue">
            <h2 id="qualite-catalogue" className="text-lg font-bold mb-3v">
              Qualité du catalogue
            </h2>
            <p className="text-sm text-text-secondary mb-4v">Les filtres donnent une première vision du référentiel chargé.</p>
            <ul className="space-y-2v text-sm">
              {filtres.domaines.slice(0, 8).map((domaine) => (
                <li key={domaine.code} className="flex justify-between border-b border-border pb-2v">
                  <span>{domaine.libelle}</span>
                  <strong>{domaine.total}</strong>
                </li>
              ))}
            </ul>
            <ActionCard variant="compact" className="mt-4v" href="/catalogue" title="Ouvrir le catalogue" />
          </section>

          <section className="bj-card p-5v" aria-labelledby="actions-admin">
            <h2 id="actions-admin" className="text-lg font-bold mb-3v">
              Actions de supervision
            </h2>
            <div className="space-y-3v">
              <ActionCard variant="compact" href="/catalogue?officielle=false" title="Vérifier les fiches non officielles" description="Identifier les contenus à confirmer avant publication." />
              {/* Pas des ActionCard : ni l'une ni l'autre n'a de page à ouvrir dans cette console (accès API
                  et documentation technique, pas un écran de l'application) — un href vers /stats ou /guide
                  ferait cliquer sur une carte qui promet une chose et en ouvre une autre, sans rapport. */}
              <div className="flex items-center gap-3v rounded-bj-sm border border-border p-3v">
                <MessageCircle size={16} className="shrink-0 text-text-muted" aria-hidden="true" />
                <span className="min-w-0">
                  <span className="block font-medium">Conversations Guido</span>
                  <span className="block text-sm text-text-secondary mt-1v">La supervision des échanges reste disponible via l’API sécurisée.</span>
                </span>
              </div>
              <div className="flex items-center gap-3v rounded-bj-sm border border-border p-3v">
                <Archive size={16} className="shrink-0 text-text-muted" aria-hidden="true" />
                <span className="min-w-0">
                  <span className="block font-medium">Sauvegardes</span>
                  <span className="block text-sm text-text-secondary mt-1v">Le script PostgreSQL est documenté dans la documentation Phase 3.</span>
                </span>
              </div>
            </div>
          </section>
        </div>

        <Alerte ton="info">
          Cette première console est volontairement en lecture seule : aucune modification de catalogue n’est effectuée sans validation
          métier. Les actions d’édition et de publication pourront être ajoutées après définition du workflow ministériel.
        </Alerte>
      </div>
    </div>
  );
}
