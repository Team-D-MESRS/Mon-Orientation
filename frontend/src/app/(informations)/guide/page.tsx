import type { Metadata } from 'next';
import Link from 'next/link';
import { Bloc, EnTete } from '@/components/informations/ui';
import { SITE } from '@/lib/site';

export const metadata: Metadata = { title: "Guide d'utilisation — Mon Orientation" };

const ETAPES = [
  { id: 'compte', titre: 'Créer ton compte' },
  { id: 'catalogue', titre: 'Explorer le catalogue' },
  { id: 'resultats', titre: 'Suivre tes résultats' },
  { id: 'pistes', titre: 'Découvrir tes pistes' },
  { id: 'voeux', titre: 'Saisir tes vœux' },
  { id: 'parent', titre: 'La validation par le parent' },
  { id: 'conseiller', titre: 'Poser tes questions au conseiller' },
];

export default function GuidePage() {
  return (
    <>
      <EnTete
        titre="Guide d'utilisation"
        intro="Mon Orientation t'accompagne de la 4e à la Terminale : découvrir les formations, comprendre tes résultats et préparer tes vœux d'orientation."
        miseAJour={SITE.miseAJour}
      />

      <nav aria-label="Sommaire du guide" className="mb-8v p-4v rounded-bj-md bg-white border border-bj-gray-925 print:hidden">
        <p className="text-sm font-bold mb-2v">Sommaire</p>
        <ol className="list-decimal pl-6v space-y-1v text-sm">
          {ETAPES.map((e) => (
            <li key={e.id}>
              <a href={`#${e.id}`} className="text-bj-green hover:underline">
                {e.titre}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <Bloc id="compte" titre="1. Créer ton compte">
        <p>
          <strong>Élève</strong> : sur la page <Link href="/inscription">Inscription</Link>, choisis « Élève », puis saisis ton NIP
          (numéro d&apos;identification personnel) et ta date de naissance. Ils doivent correspondre à ton dossier scolaire : ton
          établissement peut te communiquer ton NIP. Choisis ensuite ton mot de passe.
        </p>
        <p>
          <strong>Parent</strong> : choisissez « Parent / tuteur » et inscrivez-vous avec votre adresse e-mail. Le dossier de votre enfant est ensuite rattaché à votre compte
          par son établissement ; vous pourrez alors suivre ses résultats et valider ses vœux.
        </p>
        <p>
          Pour te <Link href="/connexion">connecter</Link>, utilise ton NIP (élève) ou ton adresse e-mail (parent), avec ton mot de passe.
        </p>
      </Bloc>

      <Bloc id="catalogue" titre="2. Explorer le catalogue">
        <p>
          Le <Link href="/catalogue">catalogue</Link> présente les formations accessibles après le BEPC et après le baccalauréat. Il est
          ouvert à tous, même sans compte.
        </p>
        <ul>
          <li>Recherche une formation, un métier ou une ville, avec ou sans accents.</li>
          <li>Filtre par niveau, type de formation, domaine, bourses ou source officielle.</li>
          <li>
            Choisis ta série de bac pour voir les formations du supérieur qui l&apos;acceptent. Sur la fiche d&apos;un bac, la rubrique
            « Et après ce bac ? » les liste aussi.
          </li>
          <li>Compare jusqu&apos;à 3 formations côte à côte avec le bouton « Comparer ».</li>
          <li>Une fois connecté, appuie sur le cœur pour mettre une formation de côté : tu la retrouveras en saisissant tes vœux.</li>
          <li>Partage une fiche sur WhatsApp ou imprime-la pour en parler en famille.</li>
        </ul>
        <p>
          Chaque fiche indique ses sources. La mention « À confirmer » signale une information qui doit encore être validée par le
          Ministère.
        </p>
      </Bloc>

      <Bloc id="resultats" titre="3. Suivre tes résultats">
        <p>
          Dans <Link href="/espace-apprenant">Mon espace</Link>, l&apos;onglet Notes présente tes notes par matière et par trimestre. Le
          tableau de bord résume ta moyenne générale, tes points forts et les matières à renforcer. Les notes proviennent de ton dossier
          scolaire (EducMaster).
        </p>
      </Bloc>

      <Bloc id="pistes" titre="4. Découvrir tes pistes">
        <p>
          L&apos;onglet Recommandations propose des formations adaptées à tes résultats, à tes vœux et à ta série. Chaque piste reçoit une
          note de compatibilité sur 100, expliquée critère par critère : matières clés, vœux, conditions d&apos;accès, série.
        </p>
        <p>
          Ces pistes sont une aide à la réflexion : la plateforme propose, elle ne décide pas à ta place.
        </p>
      </Bloc>

      <Bloc id="voeux" titre="5. Saisir tes vœux">
        <p>
          En 3e (formations après le BEPC) et en Terminale (formations après le bac), l&apos;onglet Vœux te guide en 3 étapes : choisis
          jusqu&apos;à 3 formations, par ordre de préférence. Chaque choix est enregistré aussitôt, et les formations que tu as mises de
          côté apparaissent en premier. Tu peux ajouter quelques mots pour expliquer tes choix.
        </p>
        <p>En 4e et en 1re, commence par explorer le catalogue et les pistes proposées.</p>
      </Bloc>

      <Bloc id="parent" titre="6. La validation par le parent">
        <p>
          Une fois les vœux saisis, le parent rattaché les retrouve dans son espace et les valide, après en avoir parlé avec son enfant.
          Si l&apos;élève modifie ensuite ses vœux, une nouvelle validation est nécessaire.
        </p>
      </Bloc>

      <Bloc id="conseiller" titre="7. Poser tes questions au conseiller">
        <p>
          Dans ton espace, l&apos;onglet Conseiller répond à tes questions sur les formations, les métiers et tes pistes, en
          s&apos;appuyant sur le catalogue et sur ton dossier. Les parents peuvent aussi l&apos;utiliser.
        </p>
        <p>
          Le conseiller explique, il ne décide pas : vérifie toujours les informations sur les fiches, et parles-en avec tes parents, tes
          enseignants ou le conseiller d&apos;orientation de ton établissement. N&apos;écris pas d&apos;informations personnelles (nom,
          adresse, téléphone) dans tes questions.
        </p>
      </Bloc>

      <Bloc titre="Besoin d'aide ?">
        <p>
          Consulte les <Link href="/faq">questions fréquentes</Link> ou la page <Link href="/contact">Contact</Link>.
        </p>
      </Bloc>
    </>
  );
}
