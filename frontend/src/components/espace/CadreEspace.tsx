'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, type FormEvent, type ReactNode } from 'react';
import { BookOpen, FlaskConical, Heart, LayoutDashboard, Lightbulb, MessageCircle } from 'lucide-react';
import { classeLisible } from '@/lib/apprenant';
import { useEspace } from './EspaceContext';
import { Alerte, CHAMP, Chargement } from './ui';

const ONGLETS = [
  { href: '/espace-apprenant', label: 'Tableau de bord', Icone: LayoutDashboard },
  { href: '/espace-apprenant/notes', label: 'Notes', Icone: BookOpen },
  { href: '/espace-apprenant/preferences', label: 'Vœux', Icone: Heart },
  { href: '/espace-apprenant/recommandations', label: 'Recommandations', Icone: Lightbulb },
  { href: '/espace-apprenant/conseiller', label: 'Conseiller', Icone: MessageCircle },
];

export function CadreEspace({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { moi, nip, choisirNip, profil, chargementProfil, erreurProfil, estParent } = useEspace();
  const [nipSaisi, setNipSaisi] = useState('');
  const estAdmin = moi.role === 'ADMIN';

  const titre = estParent && profil ? `Suivi de ${profil.prenom}` : estAdmin ? 'Dossier élève' : 'Mon espace';

  const ouvrirDossier = (e: FormEvent) => {
    e.preventDefault();
    if (nipSaisi.trim()) choisirNip(nipSaisi.trim());
  };

  let contenu: ReactNode;
  if (chargementProfil) contenu = <Chargement />;
  else if (erreurProfil) contenu = <Alerte ton="erreur">{erreurProfil}</Alerte>;
  else if (profil) contenu = children;
  else if (estParent) {
    contenu = (
      <Alerte ton="info">
        Aucun enfant n&apos;est encore rattaché à ton compte. Ton établissement doit rattacher ton compte au dossier de ton enfant.
      </Alerte>
    );
  } else if (estAdmin) contenu = <Alerte ton="info">Saisis le NIP d&apos;un élève pour consulter son dossier.</Alerte>;
  else contenu = <Alerte ton="attention">Ton compte n&apos;est rattaché à aucun dossier élève.</Alerte>;

  return (
    <div className="py-8v">
      <div className="bj-container">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4v mb-6v">
          <div>
            <h1 className="text-3xl font-bold mb-1v">{titre}</h1>
            {profil && (
              <p className="text-bj-gray-500">
                {profil.prenom} {profil.nom} · {classeLisible(profil)} · {profil.departement} ({profil.commune}) · NIP {profil.nip}
              </p>
            )}
          </div>

          {estParent && moi.enfants.length > 1 && (
            <div>
              <label htmlFor="enfant" className="block text-sm font-medium mb-1v">Enfant suivi</label>
              <select id="enfant" value={nip ?? ''} onChange={(e) => choisirNip(e.target.value)} className={CHAMP}>
                {moi.enfants.map((enfant) => (
                  <option key={enfant.nip} value={enfant.nip}>
                    {enfant.prenom} {enfant.nom}
                  </option>
                ))}
              </select>
            </div>
          )}

          {estAdmin && (
            <form onSubmit={ouvrirDossier} className="flex gap-2v items-end">
              <div>
                <label htmlFor="nip-dossier" className="block text-sm font-medium mb-1v">NIP de l&apos;élève</label>
                <input id="nip-dossier" value={nipSaisi} onChange={(e) => setNipSaisi(e.target.value)} className={CHAMP} />
              </div>
              <button type="submit" className="bj-btn bj-btn-secondary">Ouvrir</button>
            </form>
          )}
        </div>

        {nip?.startsWith('DEMO-') && (
          <div role="note" className="flex gap-2v items-center p-3v mb-6v rounded-bj-sm border border-bj-blue/30 bg-bj-blue/5 text-sm">
            <FlaskConical size={16} className="text-bj-blue shrink-0" aria-hidden="true" />
            Dossier de démonstration : élève et notes fictifs, en attendant la connexion à EducMaster.
          </div>
        )}

        {profil && (
          <nav aria-label="Espace apprenant" className="flex gap-2v mb-8v overflow-x-auto pb-1v">
            {ONGLETS.map(({ href, label, Icone }) => {
              const actif = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={actif ? 'page' : undefined}
                  className={`flex items-center gap-2v px-4v py-2v rounded-bj-sm text-sm font-medium whitespace-nowrap transition-colors ${
                    actif ? 'bg-bj-green text-white' : 'bg-white border border-bj-gray-925 text-bj-gray-200 hover:border-bj-green'
                  }`}
                >
                  <Icone size={16} aria-hidden="true" /> {label}
                </Link>
              );
            })}
          </nav>
        )}

        {contenu}
      </div>
    </div>
  );
}
