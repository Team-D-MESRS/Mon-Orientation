import type { Metadata } from 'next';
import Link from 'next/link';
import { Bloc, EnTete } from '@/components/informations/ui';
import { SITE } from '@/lib/site';

export const metadata: Metadata = { title: 'Accessibilité — Mon Orientation' };

export default function AccessibilitePage() {
  return (
    <>
      <EnTete
        titre="Accessibilité"
        intro="Mon Orientation doit pouvoir être utilisée par tous les élèves et leurs familles, y compris les personnes en situation de handicap."
        miseAJour={SITE.miseAJour}
      />

      <Bloc titre="Engagement">
        <p>
          La plateforme vise le niveau AA des règles internationales d&apos;accessibilité des contenus web (WCAG 2.1) et suit le Design
          Système du Bénin (DSBJ).
        </p>
      </Bloc>

      <Bloc titre="État de conformité">
        <p>
          La plateforme n&apos;a pas encore fait l&apos;objet d&apos;un audit de conformité. Cette page sera complétée avec ses résultats.
        </p>
      </Bloc>

      <Bloc titre="Ce qui est déjà pris en compte">
        <ul>
          <li>un lien « Aller au contenu principal » en haut de chaque page, accessible au clavier ;</li>
          <li>des titres structurés et des zones de navigation nommées, pour les lecteurs d&apos;écran ;</li>
          <li>des boutons et des tableaux décrits pour les lecteurs d&apos;écran (comparateur, vœux, cœur « Mettre de côté ») ;</li>
          <li>des couleurs de texte suffisamment contrastées, y compris pour les avertissements ;</li>
          <li>un affichage adapté aux téléphones, sans défilement horizontal ;</li>
          <li>des fiches et des comparaisons imprimables.</li>
        </ul>
      </Bloc>

      <Bloc titre="Limites connues">
        <ul>
          <li>pas encore de mode à contraste renforcé ;</li>
          <li>contenus proposés en français uniquement pour le moment ;</li>
          <li>le conseiller IA répond par écrit uniquement.</li>
        </ul>
      </Bloc>

      <Bloc titre="Signaler une difficulté">
        <p>
          Si un contenu ou une fonction vous est inaccessible, signalez-le en décrivant la page concernée : voir la page{' '}
          <Link href="/contact">Contact</Link>.
        </p>
      </Bloc>
    </>
  );
}
