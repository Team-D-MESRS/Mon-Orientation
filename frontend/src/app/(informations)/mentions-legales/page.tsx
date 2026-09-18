import type { Metadata } from 'next';
import Link from 'next/link';
import { ACompleter, Bloc, EnTete, LienExterne, Provisoire } from '@/components/informations/ui';
import { LIENS_EXTERNES, SITE } from '@/lib/site';

export const metadata: Metadata = { title: 'Mentions légales — Mon Orientation' };

export default function MentionsLegalesPage() {
  return (
    <>
      <EnTete titre="Mentions légales" miseAJour={SITE.miseAJour} />
      <Provisoire>Document provisoire, à compléter et à valider par le Ministère avant la mise en ligne.</Provisoire>

      <Bloc titre="Éditeur">
        <p>
          {SITE.editeur} — <LienExterne href={LIENS_EXTERNES.mestfp}>enseignementsecondaire.gouv.bj</LienExterne>
        </p>
        <p>
          <strong>Directeur de la publication</strong> : {SITE.directeurPublication ?? <ACompleter />}
        </p>
      </Bloc>

      <Bloc titre="Hébergement">
        <p>{SITE.hebergeur ?? <ACompleter />}</p>
      </Bloc>

      <Bloc titre="Contenus">
        <p>
          Les fiches du catalogue sont constituées à partir de sources publiques citées sur chaque fiche. Tant qu&apos;elles n&apos;ont pas
          été validées par le Ministère, elles portent la mention « À confirmer ».
        </p>
        <p>
          Les pistes recommandées et les réponses de Guido, le conseiller IA, sont des aides à la réflexion : elles ne constituent pas une décision
          d&apos;orientation.
        </p>
      </Bloc>

      <Bloc titre="Propriété intellectuelle">
        <p>
          Les textes et l&apos;interface propres à la plateforme appartiennent à l&apos;éditeur. Les contenus cités restent la propriété de
          leurs auteurs, dont la source est indiquée.
        </p>
      </Bloc>

      <Bloc titre="Liens vers d'autres sites">
        <p>
          La plateforme renvoie vers des sites officiels et vers les sources des fiches. L&apos;éditeur n&apos;est pas responsable de leur
          contenu.
        </p>
      </Bloc>

      <Bloc titre="Voir aussi">
        <ul>
          <li>
            <Link href="/donnees-personnelles">Données personnelles</Link>
          </li>
          <li>
            <Link href="/accessibilite">Accessibilité</Link>
          </li>
          <li>
            <Link href="/contact">Contact</Link>
          </li>
        </ul>
      </Bloc>
    </>
  );
}
