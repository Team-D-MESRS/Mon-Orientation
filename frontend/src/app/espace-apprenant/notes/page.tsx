'use client';

import { useEffect, useState } from 'react';
import { apprenantApi } from '@/lib/api';
import { noteLisible, type EntreeHistorique } from '@/lib/apprenant';
import { useProfil } from '@/components/espace/EspaceContext';
import { Card, EmptyState, LoadingState, SectionHeader, Tabs } from '@/components/ui';

const ID_BASE = 'notes';

export default function NotesPage() {
  const profil = useProfil();
  const [historique, setHistorique] = useState<EntreeHistorique[] | null | undefined>(undefined);
  const [ongletActif, setOngletActif] = useState<string | null>(null);

  useEffect(() => {
    let annule = false;
    setHistorique(undefined);
    apprenantApi
      .getHistoriqueNotes(profil.nip)
      .then(({ data }) => {
        if (annule) return;
        setHistorique(data);
        // Par défaut : le dernier onglet, qui correspond au palier actuel de l'élève.
        setOngletActif(data[data.length - 1]?.cle ?? null);
      })
      .catch(() => {
        if (!annule) setHistorique(null);
      });
    return () => {
      annule = true;
    };
  }, [profil.nip]);

  if (historique === undefined) return <LoadingState text="Chargement des notes…" />;

  if (historique === null) {
    return <EmptyState title="Impossible de charger les notes pour le moment." description="Réessaie dans un instant." />;
  }

  if (historique.length === 0) {
    return <EmptyState title="Aucune note disponible pour l'instant." description="Les notes apparaîtront ici dès qu'elles seront transmises par l'établissement." />;
  }

  const entree = historique.find((e) => e.cle === ongletActif) ?? historique[historique.length - 1];

  return (
    <section>
      <SectionHeader
        title="Notes"
        subtitle="Moyennes sur 20, sans coefficients : ils seront appliqués avec les données EducMaster."
        className="mb-4v"
      />

      <Tabs
        items={historique.map((e) => ({ cle: e.cle, label: e.titre }))}
        actif={entree.cle}
        onChange={setOngletActif}
        idBase={ID_BASE}
        className="mb-4v"
      />

      <div id={`${ID_BASE}-${entree.cle}`} role="tabpanel" aria-labelledby={`${ID_BASE}-${entree.cle}-onglet`}>
        <Card padding="none">
          {entree.matieres.length === 0 ? (
            <p className="p-6v text-text-secondary">
              {entree.type === 'examen'
                ? `Résultats du ${entree.titre} pas encore transmis par l'établissement.`
                : `Aucune note transmise pour cette année (${entree.anneeScolaire ?? entree.titre}).`}
            </p>
          ) : entree.type === 'examen' ? (
            <TableauExamen entree={entree} />
          ) : (
            // Points forts / à renforcer : calculés sur tout l'historique (voir bilan-notes.ts) mais
            // affichés uniquement sur l'année en cours, pour ne pas relabelliser une année passée avec
            // une évaluation qui porte sur la situation d'aujourd'hui.
            <TableauAnnee
              entree={entree}
              forces={entree.anneeScolaire === profil.bilan.anneeScolaire ? profil.bilan.forces : []}
              aAmeliorer={entree.anneeScolaire === profil.bilan.anneeScolaire ? profil.bilan.aAmeliorer : []}
            />
          )}
        </Card>
      </div>
    </section>
  );
}

/** Une ligne par matière, une colonne par période (2 semestres ou 3 trimestres selon ce que
 * l'établissement a transmis — jamais supposé fixe), plus la moyenne de l'année. */
function TableauAnnee({ entree, forces, aAmeliorer }: { entree: EntreeHistorique; forces: string[]; aAmeliorer: string[] }) {
  const periodes = Array.from({ length: entree.nombrePeriodes }, (_, i) => i + 1);
  const libellePeriode = entree.nombrePeriodes === 2 ? 'Semestre' : 'Trimestre';

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <caption className="sr-only">Notes par matière et par {libellePeriode.toLowerCase()}, {entree.titre}</caption>
        <thead>
          <tr className="text-left text-text-secondary border-b border-border">
            <th scope="col" className="px-4v sm:px-6v py-3v font-medium">Matière</th>
            {periodes.map((p) => (
              <th key={p} scope="col" className="hidden sm:table-cell px-4v py-3v font-medium text-right">
                {libellePeriode[0]}
                {p}
              </th>
            ))}
            <th scope="col" className="px-4v sm:px-6v py-3v font-medium text-right">Moyenne</th>
          </tr>
        </thead>
        <tbody>
          {entree.matieres.map((m) => (
            <tr key={m.matiere} className="border-b border-border-strong last:border-b-0">
              <th scope="row" className="px-4v sm:px-6v py-3v font-medium text-left sm:whitespace-nowrap">
                {m.matiere}
                {forces.includes(m.matiere) && (
                  <span className="ml-2v px-2v py-[2px] rounded-full text-xs font-medium bg-primary-soft text-primary">Point fort</span>
                )}
                {aAmeliorer.includes(m.matiere) && (
                  <span className="ml-2v px-2v py-[2px] rounded-full text-xs font-medium bg-terre-soft text-terre-strong">À renforcer</span>
                )}
                {/* Sur mobile, les périodes passent sous la matière plutôt qu'en colonnes */}
                <span className="sm:hidden block mt-1v text-xs font-normal text-text-secondary tabular-nums">
                  {m.notes.map((n) => `${libellePeriode[0]}${n.periode} ${noteLisible(n.note)}`).join(' · ')}
                </span>
              </th>
              {periodes.map((p) => {
                const note = m.notes.find((n) => n.periode === p)?.note;
                return (
                  <td key={p} className="hidden sm:table-cell px-4v py-3v text-right tabular-nums">
                    {note === undefined ? '—' : noteLisible(note)}
                  </td>
                );
              })}
              <td className="px-4v sm:px-6v py-3v text-right font-semibold tabular-nums">{noteLisible(m.moyenne)}</td>
            </tr>
          ))}
        </tbody>
        {entree.moyenneGenerale !== null && (
          <tfoot>
            <tr className="bg-surface-sunken">
              <th scope="row" className="px-4v sm:px-6v py-3v text-left">
                Moyenne générale
              </th>
              {periodes.map((p) => (
                <td key={p} className="hidden sm:table-cell" />
              ))}
              <td className="px-4v sm:px-6v py-3v text-right font-bold text-primary tabular-nums">{noteLisible(entree.moyenneGenerale)}</td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}

/** Notes d'examen (BEPC/BAC) : une note par matière, pas de période — distinct des notes de salle. */
function TableauExamen({ entree }: { entree: EntreeHistorique }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <caption className="sr-only">Notes obtenues au {entree.titre}, par matière</caption>
        <thead>
          <tr className="text-left text-text-secondary border-b border-border">
            <th scope="col" className="px-4v sm:px-6v py-3v font-medium">Matière</th>
            <th scope="col" className="px-4v sm:px-6v py-3v font-medium text-right">Note</th>
          </tr>
        </thead>
        <tbody>
          {entree.matieres.map((m) => (
            <tr key={m.matiere} className="border-b border-border-strong last:border-b-0">
              <th scope="row" className="px-4v sm:px-6v py-3v font-medium text-left">
                {m.matiere}
              </th>
              <td className="px-4v sm:px-6v py-3v text-right font-semibold tabular-nums">{noteLisible(m.moyenne)}</td>
            </tr>
          ))}
        </tbody>
        {entree.moyenneGenerale !== null && (
          <tfoot>
            <tr className="bg-surface-sunken">
              <th scope="row" className="px-4v sm:px-6v py-3v text-left">
                Moyenne générale
              </th>
              <td className="px-4v sm:px-6v py-3v text-right font-bold text-primary tabular-nums">{noteLisible(entree.moyenneGenerale)}</td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
