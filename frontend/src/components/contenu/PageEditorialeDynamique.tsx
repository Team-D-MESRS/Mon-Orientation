'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { contenuSiteApi, type PageSitePublique } from '@/lib/api';
import { Apparition } from '@/components/animation/Apparition';

export function PageEditorialeDynamique({ slug, children }: { slug: string; children: ReactNode }) {
  const [page, setPage] = useState<PageSitePublique | null>(null);
  useEffect(() => {
    let annule = false;
    contenuSiteApi.get(slug).then(({ data }) => { if (!annule) setPage(data); }).catch(() => { if (!annule) setPage(null); });
    return () => { annule = true; };
  }, [slug]);

  if (!page) return <>{children}</>;
  return (
    <article className="mo-container py-10v max-w-4xl">
      <header className="max-w-3xl mb-8v">
        <p className="mo-kicker">Mon Orientation · Information</p>
        <h1 className="text-3xl md:text-4xl font-bold mt-2v">{page.titre}</h1>
        {page.intro && <p className="text-lg text-text-secondary mt-3v">{page.intro}</p>}
        <p className="text-xs text-text-muted mt-3v">Mise à jour le {new Date(page.updatedAt).toLocaleDateString('fr-FR')}</p>
      </header>
      <div className="space-y-5v">
        {page.sections.map((section, index) => <section key={`${section.titre}-${index}`} className="bj-card p-5v">
          <h2 className="text-xl font-bold">{section.titre}</h2>
          <div className="mt-3v space-y-3v text-text-secondary">{section.paragraphes.map((paragraph, paragraphIndex) => <p key={paragraphIndex} className="whitespace-pre-line">{paragraph}</p>)}</div>
          {section.lienLabel && section.lienUrl && (section.lienUrl.startsWith('/') ? <Link href={section.lienUrl} className="inline-flex mt-4v text-bj-green underline font-medium">{section.lienLabel}</Link> : <a href={section.lienUrl} target="_blank" rel="noopener noreferrer" className="inline-flex mt-4v text-bj-green underline font-medium">{section.lienLabel}</a>)}
        </section>)}
      </div>
    </article>
  );
}

export function AccueilHeroDynamique({ titre, intro }: { titre: string; intro: string }) {
  const [page, setPage] = useState<PageSitePublique | null>(null);
  useEffect(() => {
    let annule = false;
    contenuSiteApi.get('accueil').then(({ data }) => { if (!annule) setPage(data); }).catch(() => { if (!annule) setPage(null); });
    return () => { annule = true; };
  }, []);
  return <>
    <Apparition as="h1" delai={80}>{page?.titre || titre}</Apparition>
    <Apparition as="p" delai={160} className="mo-hero-lede">{page?.intro || intro}</Apparition>
  </>;
}
