'use client';

import { noteLisible } from '@/lib/apprenant';
import { useProfil } from '@/components/espace/EspaceContext';

export default function NotesPage() {
  const { bilan } = useProfil();

  if (bilan.matieres.length === 0) {
    return <p className="text-bj-gray-500">Aucune note disponible pour l&apos;instant.</p>;
  }

  const trimestres = Array.from(new Set(bilan.matieres.flatMap((m) => m.notes.map((n) => n.trimestre)))).sort();

  return (
    <section className="bg-white rounded-bj-md border border-bj-gray-925">
      <div className="p-6v border-b border-bj-gray-925">
        <h2 className="text-xl font-bold">Notes {bilan.anneeScolaire}</h2>
        <p className="text-xs text-bj-gray-500 mt-1v">
          Moyennes sur 20, sans coefficients : ils seront appliqués avec les données EducMaster.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <caption className="sr-only">Notes par matière et par trimestre</caption>
          <thead>
            <tr className="text-left text-bj-gray-500 border-b border-bj-gray-925">
              <th scope="col" className="px-4v sm:px-6v py-3v font-medium">Matière</th>
              {trimestres.map((t) => (
                <th key={t} scope="col" className="hidden sm:table-cell px-4v py-3v font-medium text-right">
                  T{t}
                </th>
              ))}
              <th scope="col" className="px-4v sm:px-6v py-3v font-medium text-right">Moyenne</th>
            </tr>
          </thead>
          <tbody>
            {bilan.matieres.map((m) => (
              <tr key={m.matiere} className="border-b border-bj-gray-950 last:border-b-0">
                <th scope="row" className="px-4v sm:px-6v py-3v font-medium text-left sm:whitespace-nowrap">
                  {m.matiere}
                  {bilan.forces.includes(m.matiere) && (
                    <span className="ml-2v px-2v py-[2px] rounded-full text-xs font-medium bg-bj-green/10 text-bj-green">Point fort</span>
                  )}
                  {bilan.aAmeliorer.includes(m.matiere) && (
                    <span className="ml-2v px-2v py-[2px] rounded-full text-xs font-medium bg-bj-ochre/10 text-bj-ochre-fonce">À renforcer</span>
                  )}
                  {/* Sur mobile, les trimestres passent sous la matière plutôt qu'en colonnes */}
                  <span className="sm:hidden block mt-1v text-xs font-normal text-bj-gray-500 tabular-nums">
                    {m.notes.map((n) => `T${n.trimestre} ${noteLisible(n.note)}`).join(' · ')}
                  </span>
                </th>
                {trimestres.map((t) => {
                  const note = m.notes.find((n) => n.trimestre === t)?.note;
                  return (
                    <td key={t} className="hidden sm:table-cell px-4v py-3v text-right tabular-nums">
                      {note === undefined ? '—' : noteLisible(note)}
                    </td>
                  );
                })}
                <td className="px-4v sm:px-6v py-3v text-right font-semibold tabular-nums">{noteLisible(m.moyenne)}</td>
              </tr>
            ))}
          </tbody>
          {bilan.moyenneGenerale !== null && (
            <tfoot>
              <tr className="bg-bj-gray-975">
                <th scope="row" className="px-4v sm:px-6v py-3v text-left">
                  Moyenne générale
                </th>
                {trimestres.map((t) => (
                  <td key={t} className="hidden sm:table-cell" />
                ))}
                <td className="px-4v sm:px-6v py-3v text-right font-bold text-bj-green tabular-nums">{noteLisible(bilan.moyenneGenerale)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </section>
  );
}
