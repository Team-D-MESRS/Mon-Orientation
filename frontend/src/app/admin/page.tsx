'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { Database, ExternalLink, FileCheck2, ShieldCheck, Users } from 'lucide-react';
import { api, filiereApi, statsApi, type StatsNationales } from '@/lib/api';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { Alerte, Chargement } from '@/components/espace/ui';
import type { ValeursFiltres } from '@/lib/filiere';

export default function AdminPage() {
  return <RequireAuth roles={['ADMIN']}><ConsoleAdmin /></RequireAuth>;
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

  if (erreur) return <div className="py-8v"><div className="bj-container"><Alerte ton="erreur">{erreur}</Alerte></div></div>;
  if (!stats || !filtres || !health) return <div className="py-8v"><div className="bj-container"><Chargement texte="Chargement de la console d’administration…" /></div></div>;

  return (
    <div className="py-8v">
      <div className="bj-container space-y-6v">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4v">
          <div><p className="text-xs font-semibold uppercase tracking-wide text-bj-green">Accès administration</p><h1 className="text-3xl font-bold">Piloter la plateforme</h1><p className="text-bj-gray-500 mt-1v">Référentiel, qualité des sources, accès et santé technique.</p></div>
          <Link href="/stats" className="bj-btn bj-btn-secondary inline-flex items-center gap-2v">Voir les statistiques nationales <ExternalLink size={16} aria-hidden="true" /></Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4v">
          <Kpi icon={<Users size={18} />} label="Apprenants suivis" value={stats.totalApprenants.toLocaleString('fr-FR')} />
          <Kpi icon={<FileCheck2 size={18} />} label="Fiches formations" value={stats.totalFiliere.toLocaleString('fr-FR')} />
          <Kpi icon={<Database size={18} />} label="Établissements" value={stats.totalEtablissements.toLocaleString('fr-FR')} />
          <Kpi icon={<ShieldCheck size={18} />} label="API / base" value={`${health.status} / ${health.database}`} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6v">
          <section className="bj-card p-5v" aria-labelledby="qualite-catalogue"><h2 id="qualite-catalogue" className="text-lg font-bold mb-3v">Qualité du catalogue</h2><p className="text-sm text-bj-gray-500 mb-4v">Les filtres donnent une première vision du référentiel chargé.</p><ul className="space-y-2v text-sm">{filtres.domaines.slice(0, 8).map((domaine) => <li key={domaine.code} className="flex justify-between border-b border-bj-gray-925 pb-2v"><span>{domaine.libelle}</span><strong>{domaine.total}</strong></li>)}</ul><Link href="/catalogue" className="inline-block mt-4v text-sm font-medium text-bj-green hover:underline">Ouvrir le catalogue →</Link></section>
          <section className="bj-card p-5v" aria-labelledby="actions-admin"><h2 id="actions-admin" className="text-lg font-bold mb-3v">Actions de supervision</h2><div className="space-y-3v"><AdminAction titre="Vérifier les fiches non officielles" detail="Identifier les contenus à confirmer avant publication." href="/catalogue?officielle=false" /><AdminAction titre="Consulter les conversations Guido" detail="La supervision des échanges reste disponible via l’API sécurisée." href="/stats" /><AdminAction titre="Contrôler les sauvegardes" detail="Le script PostgreSQL est documenté dans la documentation Phase 3." href="/guide" /></div></section>
        </div>
        <Alerte ton="info">Cette première console est volontairement en lecture seule : aucune modification de catalogue n’est effectuée sans validation métier. Les actions d’édition et de publication pourront être ajoutées après définition du workflow ministériel.</Alerte>
      </div>
    </div>
  );
}

function Kpi({ icon, label, value }: { icon: ReactNode; label: string; value: string }) { return <div className="bj-card p-4v"><div className="flex items-center gap-2v text-bj-green mb-2v">{icon}<span className="text-xs uppercase tracking-wide font-semibold">{label}</span></div><p className="text-2xl font-bold">{value}</p></div>; }
function AdminAction({ titre, detail, href }: { titre: string; detail: string; href: string }) { return <Link href={href} className="block rounded-bj-sm border border-bj-gray-925 p-3v hover:border-bj-green"><p className="font-medium">{titre}</p><p className="text-sm text-bj-gray-500 mt-1v">{detail}</p></Link>; }
