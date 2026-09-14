import type { Metadata } from 'next';
import Link from 'next/link';
import { ACompleter, Bloc, EnTete, LienExterne, Provisoire } from '@/components/informations/ui';
import { LIENS_EXTERNES, SITE } from '@/lib/site';

export const metadata: Metadata = { title: 'Données personnelles — Mon Orientation' };

export default function DonneesPersonnellesPage() {
  return (
    <>
      <EnTete
        titre="Données personnelles"
        intro="Quelles données la plateforme utilise, pourquoi, qui peut les voir, et comment exercer vos droits."
        miseAJour={SITE.miseAJour}
      />
      <Provisoire>
        Document provisoire, à valider par le Ministère et son délégué à la protection des données avant la mise en ligne.
      </Provisoire>

      <Bloc titre="Responsable du traitement">
        <p>{SITE.editeur}.</p>
        <p>
          <strong>Délégué à la protection des données</strong> : {SITE.delegueDonnees ?? <ACompleter />}
        </p>
        <p>
          Les traitements relèvent de la loi n° 2017-20 du 20 avril 2018 portant code du numérique en République du Bénin (livre V,
          protection des données à caractère personnel), sous le contrôle de l&apos;Autorité de protection des données à caractère
          personnel (APDP).
        </p>
      </Bloc>

      <Bloc titre="Données utilisées">
        <ul>
          <li>
            <strong>Dossier scolaire</strong>, issu d&apos;EducMaster : NIP, nom, prénom, date de naissance, sexe, département, commune,
            classe, série et notes.
          </li>
          <li>
            <strong>Compte</strong> : NIP ou adresse e-mail, nom, prénom, mot de passe (enregistré sous forme hachée, jamais en clair),
            date de dernière connexion.
          </li>
          <li>
            <strong>Lien familial</strong> : rattachement d&apos;un parent ou tuteur au dossier de l&apos;enfant.
          </li>
          <li>
            <strong>Orientation</strong> : vœux et motivation, validation par le parent, formations mises de côté, pistes proposées et
            leur explication.
          </li>
          <li>
            <strong>Conseiller IA</strong> : questions posées et réponses reçues.
          </li>
        </ul>
      </Bloc>

      <Bloc titre="Pourquoi">
        <ul>
          <li>Accompagner l&apos;élève dans son orientation : résultats, pistes, vœux, réponses du conseiller.</li>
          <li>Permettre au parent de suivre son enfant et de valider ses vœux.</li>
          <li>Produire des statistiques globales pour le pilotage de l&apos;orientation, sans identifier les élèves.</li>
        </ul>
      </Bloc>

      <Bloc titre="Qui peut voir un dossier">
        <ul>
          <li>l&apos;élève lui-même ;</li>
          <li>le parent ou tuteur rattaché à son dossier ;</li>
          <li>les administrateurs habilités de la plateforme.</li>
        </ul>
        <p>Les services statistiques du Ministère n&apos;accèdent qu&apos;à des chiffres globaux, jamais aux dossiers individuels.</p>
      </Bloc>

      <Bloc titre="Le conseiller IA">
        <p>
          Pour répondre, le conseiller transmet la question à un service d&apos;intelligence artificielle, accompagnée de la classe, de
          la série, du bilan des notes, des vœux et des pistes proposées. Il ne transmet ni le nom, ni le NIP, ni la date de naissance, ni
          la commune de l&apos;élève. N&apos;écrivez pas d&apos;informations personnelles dans vos questions : elles seraient transmises
          telles quelles.
        </p>
        <p>
          <ACompleter>Prestataire et lieu de traitement du service d&apos;intelligence artificielle à préciser avant la mise en service.</ACompleter>
        </p>
      </Bloc>

      <Bloc titre="Durée de conservation">
        <p>{SITE.dureeConservation ?? <ACompleter />}</p>
      </Bloc>

      <Bloc titre="Sécurité">
        <ul>
          <li>mots de passe hachés, jamais stockés en clair ;</li>
          <li>accès aux dossiers limité selon le rôle (élève, parent rattaché, administrateur) ;</li>
          <li>sessions à durée limitée, révoquées à la déconnexion ;</li>
          <li>nombre de tentatives de connexion limité.</li>
        </ul>
      </Bloc>

      <Bloc titre="Stockage dans votre navigateur">
        <p>
          La plateforme n&apos;utilise ni cookie publicitaire ni outil de mesure d&apos;audience. Le navigateur conserve seulement la
          session de connexion et la sélection du comparateur de formations. Les polices de caractères sont chargées depuis Google Fonts,
          qui reçoit à cette occasion l&apos;adresse IP du visiteur.
        </p>
      </Bloc>

      <Bloc titre="Vos droits">
        <p>
          Vous pouvez demander l&apos;accès à vos données, leur rectification, leur effacement ou vous opposer à leur traitement. Pour un
          élève mineur, ses parents ou tuteurs peuvent exercer ces droits. Les notes et l&apos;identité scolaire se corrigent auprès de
          l&apos;établissement, qui les gère dans EducMaster.
        </p>
        <p>
          Pour exercer vos droits : voir la page <Link href="/contact">Contact</Link>. En cas de désaccord, vous pouvez saisir
          l&apos;APDP : <LienExterne href={LIENS_EXTERNES.apdp}>apdp.bj</LienExterne>.
        </p>
      </Bloc>
    </>
  );
}
