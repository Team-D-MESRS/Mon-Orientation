'use client';

import { BarChart3, PieChart } from 'lucide-react';

const statsNationales = {
  totalApprenants: 1804826,
  totalEnseignants: 63305,
  totalEtablissements: 17330,
  repartitionType: [
    { type: 'Général', count: 450000, pourcentage: 25 },
    { type: 'Technique', count: 360000, pourcentage: 20 },
    { type: 'Professionnel', count: 270000, pourcentage: 15 },
    { type: 'École de Métiers', count: 180000, pourcentage: 10 },
    { type: 'Agricole', count: 120000, pourcentage: 7 },
  ],
};

const departements = [
  { nom: 'Alibori', apprenants: 125000, etablissements: 825 },
  { nom: 'Atacora', apprenants: 98000, etablissements: 710 },
  { nom: 'Atlantique', apprenants: 280000, etablissements: 2100 },
  { nom: 'Borgou', apprenants: 156000, etablissements: 1050 },
  { nom: 'Collines', apprenants: 89000, etablissements: 620 },
  { nom: 'Couffo', apprenants: 112000, etablissements: 780 },
  { nom: 'Donga', apprenants: 76000, etablissements: 520 },
  { nom: 'Littoral', apprenants: 320000, etablissements: 1800 },
  { nom: 'Mono', apprenants: 95000, etablissements: 680 },
  { nom: 'Ouémé', apprenants: 245000, etablissements: 1650 },
  { nom: 'Plateau', apprenants: 88000, etablissements: 610 },
  { nom: 'Zou', apprenants: 126000, etablissements: 985 },
];

export default function StatsPage() {
  return (
    <div className="py-8v">
      <div className="bj-container">
        <h1 className="text-3xl font-bold mb-2v">Statistiques nationales</h1>
        <p className="text-bj-gray-500 mb-8v">
          Indicateurs du système éducatif béninois
        </p>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6v mb-8v">
          <div className="bj-card p-6v">
            <div className="text-sm text-bj-gray-500 mb-1v">Apprenants inscrits</div>
            <div className="text-3xl font-bold text-bj-green">
              {statsNationales.totalApprenants.toLocaleString('fr-FR')}
            </div>
          </div>
          <div className="bj-card p-6v">
            <div className="text-sm text-bj-gray-500 mb-1v">Enseignants</div>
            <div className="text-3xl font-bold text-bj-blue">
              {statsNationales.totalEnseignants.toLocaleString('fr-FR')}
            </div>
          </div>
          <div className="bj-card p-6v">
            <div className="text-sm text-bj-gray-500 mb-1v">Établissements</div>
            <div className="text-3xl font-bold text-bj-ochre">
              {statsNationales.totalEtablissements.toLocaleString('fr-FR')}
            </div>
          </div>
        </div>

        {/* Répartition */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6v">
          <div className="bj-card p-6v">
            <h2 className="font-bold mb-6v flex items-center gap-2v">
              <PieChart size={18} /> Répartition par type de filière
            </h2>
            <div className="space-y-4v">
              {statsNationales.repartitionType.map((r) => (
                <div key={r.type}>
                  <div className="flex items-center justify-between text-sm mb-1v">
                    <span className="font-medium">{r.type}</span>
                    <span className="text-bj-gray-500">{r.pourcentage}%</span>
                  </div>
                  <div className="w-full bg-bj-gray-950 rounded-full h-3v">
                    <div
                      className="bg-bj-green h-3v rounded-full"
                      style={{ width: `${r.pourcentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bj-card p-6v">
            <h2 className="font-bold mb-6v flex items-center gap-2v">
              <BarChart3 size={18} /> Apprenants par département
            </h2>
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
                    <tr key={d.nom} className="border-b border-bj-gray-925">
                      <td className="py-2v font-medium">{d.nom}</td>
                      <td className="py-2v text-right">{d.apprenants.toLocaleString('fr-FR')}</td>
                      <td className="py-2v text-right">{d.etablissements}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
