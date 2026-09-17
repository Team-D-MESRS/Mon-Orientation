'use client';

import { useEffect, useState } from 'react';
import { BarChart3, PieChart } from 'lucide-react';
import { statsApi, type StatsDepartement, type StatsNationales } from '@/lib/api';
import { TYPE_LABELS, type TypeFiliere } from '@/lib/filiere';
import { messageErreur } from '@/lib/erreurs';
import { Alerte, Chargement } from '@/components/espace/ui';

export default function StatsPage() {
  const [nationales, setNationales] = useState<StatsNationales | undefined>(undefined);
  const [departements, setDepartements] = useState<StatsDepartement[]>([]);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([statsApi.getNationales(), statsApi.getDepartements()])
      .then(([{ data: n }, { data: d }]) => {
        setNationales(n);
        setDepartements(d);
      })
      .catch((err) => setErreur(messageErreur(err)));
  }, []);

  if (erreur) {
    return (
      <div className="py-8v">
        <div className="bj-container">
          <Alerte ton="erreur">{erreur}</Alerte>
        </div>
      </div>
    );
  }
  if (!nationales) {
    return (
      <div className="py-8v">
        <div className="bj-container">
          <Chargement />
        </div>
      </div>
    );
  }

  const totalFilieres = nationales.repartitionType.reduce((somme, r) => somme + r._count, 0);
  const repartitionTriee = [...nationales.repartitionType].sort((a, b) => b._count - a._count);

  return (
    <div className="py-8v">
      <div className="bj-container">
        <h1 className="text-3xl font-bold mb-2v">Statistiques nationales</h1>
        <p className="text-bj-gray-500 mb-4v">Indicateurs du système éducatif béninois</p>

        <Alerte ton="info">
          Le catalogue et les établissements sont le référentiel national réel. Les effectifs d&apos;apprenants,
          eux, ne reflètent pour l&apos;instant que les comptes créés sur la plateforme (comptes de
          démonstration) : ce chiffre grandira avec la connexion à EducMaster.
        </Alerte>

        {/* KPI */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6v mb-8v">
          <div className="bj-card p-6v">
            <div className="text-sm text-bj-gray-500 mb-1v">Apprenants suivis sur la plateforme</div>
            <div className="text-3xl font-bold text-bj-green">{nationales.totalApprenants.toLocaleString('fr-FR')}</div>
          </div>
          <div className="bj-card p-6v">
            <div className="text-sm text-bj-gray-500 mb-1v">Formations au catalogue</div>
            <div className="text-3xl font-bold text-bj-blue">{nationales.totalFiliere.toLocaleString('fr-FR')}</div>
          </div>
          <div className="bj-card p-6v">
            <div className="text-sm text-bj-gray-500 mb-1v">Établissements</div>
            <div className="text-3xl font-bold text-bj-ochre">{nationales.totalEtablissements.toLocaleString('fr-FR')}</div>
          </div>
        </div>

        {/* Répartition */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6v">
          <div className="bj-card p-6v">
            <h2 className="font-bold mb-6v flex items-center gap-2v">
              <PieChart size={18} aria-hidden="true" /> Répartition par type de formation
            </h2>
            <div className="space-y-4v">
              {repartitionTriee.map((r) => {
                const pourcentage = totalFilieres > 0 ? Math.round((r._count / totalFilieres) * 100) : 0;
                return (
                  <div key={r.type}>
                    <div className="flex items-center justify-between text-sm mb-1v">
                      <span className="font-medium">{TYPE_LABELS[r.type as TypeFiliere] ?? r.type}</span>
                      <span className="text-bj-gray-500">
                        {r._count} ({pourcentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-bj-gray-950 rounded-full h-3v">
                      <div className="bg-bj-green h-3v rounded-full" style={{ width: `${pourcentage}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bj-card p-6v">
            <h2 className="font-bold mb-6v flex items-center gap-2v">
              <BarChart3 size={18} aria-hidden="true" /> Par département
            </h2>
            {departements.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-bj-gray-925">
                      <th className="text-left py-2v font-medium text-bj-gray-500">Département</th>
                      <th className="text-right py-2v font-medium text-bj-gray-500">Apprenants</th>
                      <th className="text-right py-2v font-medium text-bj-gray-500">Établis.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {departements.map((d) => (
                      <tr key={d.departement} className="border-b border-bj-gray-925">
                        <td className="py-2v font-medium">{d.departement}</td>
                        <td className="py-2v text-right">{d.apprenants.toLocaleString('fr-FR')}</td>
                        <td className="py-2v text-right">{d.etablissements.toLocaleString('fr-FR')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-bj-gray-500">Aucune donnée pour l&apos;instant.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
