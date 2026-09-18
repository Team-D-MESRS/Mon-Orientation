import type { Metadata } from 'next';
import Link from 'next/link';
import { Bloc, EnTete } from '@/components/informations/ui';
import { SITE } from '@/lib/site';

export const metadata: Metadata = { title: "Guide d'utilisation — Mon Orientation" };

const ETAPES = [
  { id: 'compte', titre: "T'identifier" },
  { id: 'decouverte', titre: 'Répondre au questionnaire de découverte' },
  { id: 'catalogue', titre: 'Explorer le catalogue' },
  { id: 'resultats', titre: 'Suivre tes résultats' },
  { id: 'pistes', titre: 'Découvrir tes pistes' },
  { id: 'voeux', titre: 'Saisir tes vœux' },
  { id: 'parent', titre: 'La validation par le parent' },
  { id: 'conseiller', titre: 'Poser tes questions à Guido' },
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

      <Bloc id="compte" titre="1. T&apos;identifier">
        <p>
          Il n&apos;y a pas de compte à créer : tu utilises les identifiants que tu as déjà sur EducMaster, où ton
          établissement gère ton dossier scolaire.
        </p>
        <p>
          <strong>Élève</strong> : sur la page <Link href="/identification">S&apos;identifier</Link>, saisis ton NIP (numéro
          d&apos;identification personnel) ou ton numéro EducMaster, celui qui figure sur ta fiche d&apos;inscription, puis ton
          mot de passe. Si tu ne les connais pas, ton établissement peut te les communiquer.
        </p>
        <p>
          <strong>Parent</strong> : identifiez-vous avec l&apos;adresse de votre compte EducMaster. Le dossier de votre enfant y
          est rattaché ; vous pourrez alors suivre ses résultats et valider ses vœux.
        </p>
        <p>
          Les personnels du ministère disposent d&apos;un <Link href="/personnels">accès dédié</Link>.
        </p>
      </Bloc>

      <Bloc id="decouverte" titre="2. Répondre au questionnaire de découverte">
        <p>
          <strong>C&apos;est la première chose à faire après t&apos;être identifié.</strong> Dans <Link href="/espace-apprenant">Mon
          espace</Link>, l&apos;onglet Découverte te pose quelques questions sur ce qui te plaît, ce que tu envisages et tes ambitions —
          5 étapes, quelques minutes.
        </p>
        <p>
          Tant que tu n&apos;y as pas répondu, tu ne peux accéder à rien d&apos;autre sur la plateforme — ni ton espace, ni le catalogue :
          c&apos;est ce questionnaire qui permet à la plateforme de te proposer des pistes qui te ressemblent, pas seulement tes notes. Tu
          le remplis une fois, et tu peux le modifier ensuite si tu changes d&apos;avis.
        </p>
      </Bloc>

      <Bloc id="catalogue" titre="3. Explorer le catalogue">
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

      <Bloc id="resultats" titre="4. Suivre tes résultats">
        <p>
          Dans <Link href="/espace-apprenant">Mon espace</Link>, l&apos;onglet Notes présente tes notes par matière et par trimestre. Le
          tableau de bord résume ta moyenne générale, tes points forts et les matières à renforcer. Les notes proviennent de ton dossier
          scolaire (EducMaster).
        </p>
      </Bloc>

      <Bloc id="pistes" titre="5. Découvrir tes pistes">
        <p>
          L&apos;onglet Recommandations propose des formations adaptées à tes résultats, tes centres d&apos;intérêt (le questionnaire de
          découverte), tes vœux et ta série. Chaque piste reçoit une note de compatibilité sur 100, expliquée critère par critère :
          matières clés, intérêt, vœux, conditions d&apos;accès, série.
        </p>
        <p>
          Ces pistes sont une aide à la réflexion : la plateforme propose, elle ne décide pas à ta place.
        </p>
      </Bloc>

      <Bloc id="voeux" titre="6. Saisir tes vœux">
        <p>
          En 3e, l&apos;onglet Vœux te guide en 3 étapes : 2 choix de spécialité classés par ordre de préférence, puis
          l&apos;établissement qui les dispense tous les deux — c&apos;est la fiche unique d&apos;inscription du ministère. En
          Terminale, choisis jusqu&apos;à 3 formations du supérieur, par ordre de préférence. Chaque choix est enregistré aussitôt, et
          les formations que tu as mises de côté apparaissent en premier. Tu peux ajouter quelques mots pour expliquer tes choix.
        </p>
        <p>En 4e et en 1re, commence par explorer le catalogue et les pistes proposées.</p>
      </Bloc>

      <Bloc id="parent" titre="7. La validation par le parent">
        <p>
          Une fois les vœux saisis, le parent rattaché les retrouve dans son espace et les valide, après en avoir parlé avec son enfant.
          Si l&apos;élève modifie ensuite ses vœux, une nouvelle validation est nécessaire.
        </p>
      </Bloc>

      <Bloc id="conseiller" titre="8. Poser tes questions à Guido">
        <p>
          Dans ton espace, l&apos;onglet Guido répond à tes questions sur les formations, les métiers et tes pistes, en s&apos;appuyant
          sur le catalogue et sur ton dossier. Les parents peuvent aussi l&apos;utiliser.
        </p>
        <p>
          Tu peux lui écrire, ou lui parler en note vocale si tu préfères — en fon, en yoruba, en mina ou toute autre langue que tu
          parles : appuie sur le micro, dis ta question, puis envoie.
        </p>
        <p>
          Guido explique, il ne décide pas : vérifie toujours les informations sur les fiches, et parles-en avec tes parents, tes
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
