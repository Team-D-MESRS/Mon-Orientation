import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ACompleter, Bloc, EnTete, LienExterne } from '@/components/informations/ui';
import { LIENS_EXTERNES, SITE } from '@/lib/site';

export const metadata: Metadata = { title: 'Contact — Mon Orientation' };

export default function ContactPage() {
  const { email, telephone, adresse } = SITE.contact;
  const coordonnees: { libelle: string; valeur: ReactNode }[] = [];
  if (email) coordonnees.push({ libelle: 'E-mail', valeur: <a href={`mailto:${email}`}>{email}</a> });
  if (telephone) coordonnees.push({ libelle: 'Téléphone', valeur: <a href={`tel:${telephone.replace(/\s/g, '')}`}>{telephone}</a> });
  if (adresse) coordonnees.push({ libelle: 'Adresse', valeur: adresse });

  return (
    <>
      <EnTete titre="Contact" intro="Selon ta question, voici à qui t'adresser." />

      <Bloc titre="Une question sur ton dossier scolaire">
        <p>
          Ton NIP, tes notes et ta classe proviennent de ton dossier scolaire (EducMaster). Pour les faire corriger, adresse-toi à ton
          établissement.
        </p>
      </Bloc>

      <Bloc titre="Une question sur ton orientation">
        <p>
          Le conseiller d&apos;orientation et les enseignants de ton établissement sont tes premiers interlocuteurs. Tu peux aussi
          consulter le <Link href="/guide">guide d&apos;utilisation</Link>, les <Link href="/faq">questions fréquentes</Link>, ou poser ta
          question au conseiller IA depuis ton espace.
        </p>
      </Bloc>

      <Bloc titre="Contacter l'équipe de la plateforme">
        <p>Pour un problème technique, une erreur dans une fiche du catalogue ou une difficulté d&apos;accessibilité :</p>
        {coordonnees.length > 0 ? (
          <dl className="grid grid-cols-[auto_1fr] gap-x-6v gap-y-2v">
            {coordonnees.map((c) => (
              <div key={c.libelle} className="contents">
                <dt className="font-medium">{c.libelle}</dt>
                <dd>{c.valeur}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p>
            <ACompleter>Coordonnées de l&apos;assistance à communiquer par le Ministère.</ACompleter>
          </p>
        )}
        <p>
          Site du Ministère : <LienExterne href={LIENS_EXTERNES.mestfp}>enseignementsecondaire.gouv.bj</LienExterne>
        </p>
      </Bloc>

      <Bloc titre="Tu traverses une situation difficile ?">
        <p>
          Harcèlement, violence, découragement : n&apos;attends pas pour en parler à un adulte de confiance, un parent, un enseignant,
          l&apos;infirmerie ou le conseiller de ton établissement.
        </p>
      </Bloc>
    </>
  );
}
