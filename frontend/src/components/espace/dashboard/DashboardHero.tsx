import { ArrowRight } from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';
import { dateLisible, type ProfilApprenant } from '@/lib/apprenant';

interface DashboardHeroProps {
  profil: ProfilApprenant;
  /** Prénom du parent connecté — absent (et donc ignoré) côté élève. */
  prenomParent?: string;
  etatParcours: string;
  /** Date de dernière mise à jour du profil de découverte, si un profil existe — jamais une fausse « dernière connexion » : cette donnée n'existe pas dans le dossier. */
  profilMisAJourLe?: string;
  action: { titre: string; href: string };
}

/**
 * Premier bloc de la page : salutation posée (pas de « Bienvenue » redondant avec CadreEspace, qui
 * affiche déjà l'identité structurelle), état du parcours en une phrase, et une action principale
 * compacte — la version détaillée, justifiée, vit dans NextActionCard juste en dessous.
 */
export function DashboardHero({ profil, prenomParent, etatParcours, profilMisAJourLe, action }: DashboardHeroProps) {
  const salutation = prenomParent ? `Bonjour ${prenomParent}` : `Bonjour ${profil.prenom}`;
  return (
    <section className="flex flex-col md:flex-row md:items-end md:justify-between gap-5v" aria-label="Résumé du parcours">
      <div className="min-w-0">
        <h2 className="text-xl md:text-2xl font-bold mb-1v">{salutation}</h2>
        <p className="text-text-secondary">{etatParcours}</p>
        {profilMisAJourLe && <p className="text-xs text-text-muted mt-1v">Profil de découverte mis à jour le {dateLisible(profilMisAJourLe)}</p>}
      </div>
      <ButtonLink href={action.href} variant="secondary" iconRight={<ArrowRight size={16} aria-hidden="true" />} className="shrink-0">
        {action.titre}
      </ButtonLink>
    </section>
  );
}
