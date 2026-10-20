'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Archive, BookOpen, ClipboardList, FileText, Landmark, RefreshCw, ShieldCheck } from 'lucide-react';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { ButtonLink } from '@/components/ui/Button';
import { Alerte, Chargement } from '@/components/espace/ui';
import { adminApi } from '@/lib/api';
import { messageErreur } from '@/lib/erreurs';

function AdminHome() {
  const [resume, setResume] = useState<{ filieres: number; etablissements: number; pagesPubliees: number; brouillons: number } | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const charger = () => adminApi.resume().then(({ data }) => setResume(data)).catch((error) => setErreur(messageErreur(error)));
  useEffect(() => { void charger(); }, []);

  if (!resume && !erreur) return <div className="mo-container py-12v"><Chargement texte="Chargement de la console d’administration…" /></div>;

  return (
    <div className="mo-container py-10v space-y-7v">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4v">
        <div>
          <p className="mo-kicker">Console d’administration</p>
          <h1 className="text-3xl md:text-4xl font-bold mt-2v">Gérer les contenus du site</h1>
          <p className="text-text-secondary mt-2v max-w-2xl">Modifie le catalogue et les contenus éditoriaux, prévisualise tes changements, puis publie-les. Les versions précédentes restent restaurables.</p>
        </div>
        <ButtonLink href="/admin/gestion" iconRight={<ClipboardList size={16} aria-hidden="true" />}>Ouvrir l’atelier d’édition</ButtonLink>
      </header>

      {erreur && <Alerte ton="erreur">{erreur}</Alerte>}
      {resume && <div className="grid grid-cols-2 xl:grid-cols-4 gap-3v">
        <Stat titre="Filières visibles" valeur={resume.filieres} icone={<BookOpen size={18} />} />
        <Stat titre="Établissements actifs" valeur={resume.etablissements} icone={<Landmark size={18} />} />
        <Stat titre="Pages éditoriales publiées" valeur={resume.pagesPubliees} icone={<FileText size={18} />} />
        <Stat titre="Brouillons à traiter" valeur={resume.brouillons} icone={<Archive size={18} />} />
      </div>}

      <div className="grid md:grid-cols-2 gap-4v">
        <Carte href="/admin/gestion?onglet=catalogue" titre="Catalogue de formations" texte="Créer ou corriger les filières, descriptions, conditions d’accès, métiers, images, vidéos et sources officielles." icone={<BookOpen size={20} />} />
        <Carte href="/admin/gestion?onglet=etablissements" titre="Lieux et offres de formation" texte="Maintenir les établissements, leur implantation et les formations qu’ils dispensent. L’accès utilisateur Établissement reste hors périmètre." icone={<Landmark size={20} />} />
        <Carte href="/admin/gestion?onglet=contenus" titre="Pages et annonces" texte="Mettre à jour l’accueil, la FAQ, le guide et les informations de contact sans modifier les composants du site." icone={<FileText size={20} />} />
        <Carte href="/admin/gestion?onglet=historique" titre="Historique et restauration" texte="Voir qui a préparé ou publié une version et restaurer une version antérieure sous forme de brouillon." icone={<RefreshCw size={20} />} />
      </div>

      <Alerte ton="info"><ShieldCheck size={16} className="inline mr-2" aria-hidden="true" />La console Admin gère les contenus. Les statistiques approfondies et leurs exports agrégés sont réservés à la DGES.</Alerte>
    </div>
  );
}

function Stat({ titre, valeur, icone }: { titre: string; valeur: number; icone: React.ReactNode }) {
  return <div className="bj-card p-5v"><div className="flex items-center gap-2 text-text-secondary text-sm">{icone}{titre}</div><strong className="block text-3xl mt-3v">{valeur.toLocaleString('fr-FR')}</strong></div>;
}
function Carte({ href, titre, texte, icone }: { href: string; titre: string; texte: string; icone: React.ReactNode }) {
  return <Link href={href} className="bj-card p-5v hover:shadow-lg transition-shadow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"><span className="inline-flex p-3 rounded-full bg-bj-green/10 text-bj-green">{icone}</span><h2 className="text-lg font-bold mt-3v">{titre}</h2><p className="text-sm text-text-secondary mt-2v">{texte}</p></Link>;
}

export default function AdminPage() {
  return <RequireAuth roles={['ADMIN']}><AdminHome /></RequireAuth>;
}
