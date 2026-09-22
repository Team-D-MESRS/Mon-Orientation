'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { LIENS_EXTERNES } from '@/lib/site';
import { PAGES_AIDE, PAGES_LEGALES, liensVisibles } from './navigation';

const LIEN = 'hover:text-white hover:underline underline-offset-2 transition-colors';

const SITES_OFFICIELS = [
  { href: LIENS_EXTERNES.mestfp, label: 'MESTFP' },
  { href: LIENS_EXTERNES.educmaster, label: 'EducMaster' },
  { href: LIENS_EXTERNES.apresMonBac, label: 'Après mon bac' },
  { href: LIENS_EXTERNES.gouvernement, label: 'Gouvernement du Bénin' },
];

function Colonne({ id, titre, children }: { id: string; titre: string; children: ReactNode }) {
  return (
    <nav aria-labelledby={id}>
      <h2 id={id} className="font-bold text-sm mb-4v">
        {titre}
      </h2>
      <ul className="space-y-2v text-sm text-bj-gray-750">{children}</ul>
    </nav>
  );
}

export function Footer() {
  const user = useAuthStore((s) => s.user);

  return (
    <footer className="bg-bj-gray-50 text-white py-12v print:hidden">
      <div className="bj-container">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8v mb-8v">
          <div>
            <Link href="/" className="flex items-center gap-3v mb-4v w-fit">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center font-bold text-sm shrink-0">MO</div>
              <div>
                <div className="font-serif font-bold text-base">Mon Orientation</div>
                <div className="text-xs text-bj-gray-750">Plateforme nationale</div>
              </div>
            </Link>
            <p className="text-sm text-bj-gray-750">Accompagnement personnalisé dans l&apos;orientation scolaire pour les élèves du Bénin.</p>
          </div>

          <Colonne id="pied-services" titre="Services">
            {liensVisibles(user).map((l) => (
              <li key={l.href}>
                <Link href={l.href} className={LIEN}>
                  {l.label}
                </Link>
              </li>
            ))}
          </Colonne>

          <Colonne id="pied-aide" titre="Aide">
            {PAGES_AIDE.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className={LIEN}>
                  {l.label}
                </Link>
              </li>
            ))}
          </Colonne>

          <Colonne id="pied-officiels" titre="Sites officiels">
            {SITES_OFFICIELS.map((l) => (
              <li key={l.href}>
                <a href={l.href} target="_blank" rel="noopener noreferrer" className={`${LIEN} inline-flex items-center gap-1v`}>
                  {l.label}
                  <ExternalLink size={12} aria-hidden="true" />
                  <span className="sr-only">(nouvel onglet)</span>
                </a>
              </li>
            ))}
          </Colonne>
        </div>

        <div className="border-t border-bj-gray-425 pt-6v flex flex-col md:flex-row items-center justify-between gap-4v">
          <p className="text-xs text-bj-gray-750 text-center md:text-left">
            © 2026 Mon Orientation — Ministère de l&apos;Enseignement Secondaire, Technique et de la Formation Professionnelle
          </p>
          <nav aria-label="Informations légales">
            <ul className="flex flex-wrap justify-center gap-x-4v gap-y-2v text-xs text-bj-gray-750">
              {PAGES_LEGALES.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={LIEN}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}
