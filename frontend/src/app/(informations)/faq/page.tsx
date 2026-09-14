import type { Metadata } from 'next';
import Link from 'next/link';
import { Bloc, EnTete, Question } from '@/components/informations/ui';
import { SITE } from '@/lib/site';

export const metadata: Metadata = { title: 'Questions fréquentes — Mon Orientation' };

export default function FaqPage() {
  return (
    <>
      <EnTete titre="Questions fréquentes" intro="Les réponses aux questions les plus courantes des élèves et des parents." miseAJour={SITE.miseAJour} />

      <Bloc titre="La plateforme">
        <Question question="Qu'est-ce que Mon Orientation ?">
          <p>
            La plateforme nationale d&apos;orientation scolaire du Bénin. Elle aide les élèves, de la 4e à la Terminale, à découvrir les
            formations, à comprendre leurs résultats et à préparer leurs vœux, avec leurs parents.
          </p>
        </Question>
        <Question question="Faut-il un compte ?">
          <p>
            Non pour consulter le <Link href="/catalogue">catalogue</Link>. Oui pour suivre tes notes, recevoir des pistes, saisir tes vœux
            et poser tes questions au conseiller : voir le <Link href="/guide#compte">guide</Link>.
          </p>
        </Question>
      </Bloc>

      <Bloc titre="Mon compte">
        <Question question="Où trouver mon NIP ?">
          <p>
            Le NIP (numéro d&apos;identification personnel) figure dans ton dossier scolaire. Ton établissement peut te le communiquer.
          </p>
        </Question>
        <Question question="Mon inscription est refusée : que faire ?">
          <p>
            Vérifie ton NIP et ta date de naissance : ils doivent correspondre exactement à ton dossier scolaire. Si le problème
            persiste, adresse-toi à ton établissement.
          </p>
        </Question>
        <Question question="Je suis parent : comment suivre mon enfant ?">
          <p>
            Créez un compte avec votre adresse e-mail. L&apos;établissement de votre enfant rattache ensuite son dossier à votre compte :
            vous voyez alors ses résultats, ses pistes et ses vœux, que vous pouvez valider.
          </p>
        </Question>
      </Bloc>

      <Bloc titre="Le catalogue">
        <Question question="D'où viennent les informations sur les formations ?">
          <p>
            De sources publiques citées sur chaque fiche : Office du Baccalauréat, portail du Gouvernement, communiqués du Ministère,
            établissements. La mention « À confirmer » signale une fiche qui n&apos;a pas encore de source officielle et doit être validée
            par le Ministère.
          </p>
        </Question>
        <Question question="Pourquoi une formation n'apparaît-elle pas avec ma série de bac ?">
          <p>
            Le filtre par série ne montre que les formations dont les séries admises sont connues. Consulte aussi la fiche de la
            formation et la plateforme officielle{' '}
            <a href="https://apresmonbac.bj" target="_blank" rel="noopener noreferrer">
              apresmonbac.bj
            </a>{' '}
            pour l&apos;orientation après le bac.
          </p>
        </Question>
        <Question question="À quoi sert le cœur sur les fiches ?">
          <p>
            Il met une formation de côté. Tu la retrouves sur ton tableau de bord et en tête de liste quand tu saisis tes vœux. Il est
            réservé aux élèves connectés.
          </p>
        </Question>
      </Bloc>

      <Bloc titre="L'orientation">
        <Question question="Comment sont calculées les pistes recommandées ?">
          <p>
            À partir de tes résultats dans les matières clés de chaque formation, de tes vœux, des conditions d&apos;accès et de ta série.
            Chaque piste reçoit une note sur 100, et chaque point est expliqué.
          </p>
          <p>La plateforme propose, elle ne décide pas : ces pistes sont une aide à la réflexion.</p>
        </Question>
        <Question question="Quand dois-je saisir mes vœux ?">
          <p>En 3e, pour les formations après le BEPC, et en Terminale, pour les formations après le bac. Tu peux choisir jusqu&apos;à 3 vœux.</p>
        </Question>
        <Question question="Puis-je modifier mes vœux ?">
          <p>Oui. Si ton parent les avait déjà validés, il devra les valider à nouveau.</p>
        </Question>
      </Bloc>

      <Bloc titre="Le conseiller IA">
        <Question question="Le conseiller peut-il se tromper ?">
          <p>
            Oui. Il s&apos;appuie sur le catalogue et sur ton dossier, mais vérifie toujours ses réponses sur les fiches, et parles-en avec
            tes parents, tes enseignants ou le conseiller d&apos;orientation de ton établissement.
          </p>
        </Question>
        <Question question="Quelles informations reçoit-il ?">
          <p>
            Ta classe, ta série, le bilan de tes notes, tes vœux et les pistes proposées. Il ne reçoit ni ton nom, ni ton NIP, ni ta date
            de naissance. Détails sur la page <Link href="/donnees-personnelles">Données personnelles</Link>.
          </p>
        </Question>
      </Bloc>

      <Bloc titre="Mes données">
        <Question question="Qui peut voir mon dossier ?">
          <p>
            Toi, ton parent rattaché et les administrateurs habilités de la plateforme. Les services statistiques du Ministère ne voient
            que des chiffres globaux, jamais les dossiers individuels.
          </p>
        </Question>
      </Bloc>

      <p className="text-sm text-bj-gray-500">
        Ta question n&apos;est pas dans la liste ? Consulte le <Link href="/guide" className="text-bj-green underline">guide</Link> ou la page{' '}
        <Link href="/contact" className="text-bj-green underline">
          Contact
        </Link>
        .
      </p>
    </>
  );
}
