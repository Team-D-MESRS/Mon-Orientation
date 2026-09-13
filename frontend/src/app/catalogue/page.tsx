'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Filter } from 'lucide-react';

const filieres = [
  { id: '1', nom: 'Baccalauréat Général - Sciences', type: 'GENERALE', debouches: 'Médecine, Ingénierie', tauxInsertion: 65, description: 'Formation généraliste scientifique' },
  { id: '2', nom: 'Baccalauréat Général - Littéraire', type: 'GENERALE', debouches: 'Droit, Journalisme', tauxInsertion: 55, description: 'Formation littéraire et humaine' },
  { id: '3', nom: 'Baccalauréat Technique - Électrotechnique', type: 'TECHNIQUE', debouches: 'Technicien, Installateur', tauxInsertion: 78, description: 'Électricité et systèmes automatisés' },
  { id: '4', nom: 'Baccalauréat Technique - Génie Civil', type: 'TECHNIQUE', debouches: 'Technicien, Conducteur de travaux', tauxInsertion: 75, description: 'Construction et travaux publics' },
  { id: '5', nom: 'CAP Métallurgie', type: 'PROFESSIONNELLE', debouches: 'Soudeur, Métallier', tauxInsertion: 82, description: 'Travail des métaux' },
  { id: '6', nom: 'BEP Menuiserie-Ébénisterie', type: 'PROFESSIONNELLE', debouches: 'Menuisier, Ébéniste', tauxInsertion: 80, description: 'Menuiserie et bois' },
  { id: '7', nom: 'École de Métiers - Électricité', type: 'ECOLE_METIER', debouches: 'Électricien qualifié', tauxInsertion: 88, description: 'Installation électrique pratique' },
  { id: '8', nom: 'École de Métiers - Menuiserie', type: 'ECOLE_METIER', debouches: 'Menuisier, Fabricant', tauxInsertion: 85, description: 'Menuiserie pratique 2 ans' },
  { id: '9', nom: 'École de Métiers - Couture', type: 'ECOLE_METIER', debouches: 'Couturier, Modéliste', tauxInsertion: 78, description: 'Couture et confection' },
  { id: '10', nom: 'Baccalauréat Technique Agricole', type: 'TECHNIQUE_AGRICOLE', debouches: 'Agriculteur, Conseiller', tauxInsertion: 72, description: 'Agriculture moderne et élevage' },
];

const typeColors: Record<string, string> = {
  GENERALE: 'bg-blue-100 text-blue-800',
  TECHNIQUE: 'bg-purple-100 text-purple-800',
  PROFESSIONNELLE: 'bg-orange-100 text-orange-800',
  ECOLE_METIER: 'bg-green-100 text-green-800',
  TECHNIQUE_AGRICOLE: 'bg-yellow-100 text-yellow-800',
};

const typeLabels: Record<string, string> = {
  GENERALE: 'Général',
  TECHNIQUE: 'Technique',
  PROFESSIONNELLE: 'Professionnel',
  ECOLE_METIER: 'École de Métiers',
  TECHNIQUE_AGRICOLE: 'Technique Agricole',
};

export default function CataloguePage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [filtered, setFiltered] = useState(filieres);

  useEffect(() => {
    let result = filieres;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(f =>
        f.nom.toLowerCase().includes(q) ||
        f.debouches.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q)
      );
    }
    if (typeFilter) {
      result = result.filter(f => f.type === typeFilter);
    }
    setFiltered(result);
  }, [search, typeFilter]);

  return (
    <div className="py-8v">
      <div className="bj-container">
        <h1 className="text-3xl font-bold mb-2v">Catalogue des filières</h1>
        <p className="text-bj-gray-500 mb-8v">
          Explore les différentes formations disponibles au Bénin
        </p>

        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-4v mb-8v">
          <div className="flex-1 relative">
            <Search className="absolute left-3v top-1/2 -translate-y-1/2 text-bj-gray-500" size={20} />
            <input
              type="text"
              placeholder="Rechercher une filière, un métier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10v pr-4v py-3v border border-bj-gray-850 rounded-bj-sm text-sm focus:outline-none focus:ring-2 focus:ring-bj-green"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4v py-3v border border-bj-gray-850 rounded-bj-sm text-sm focus:outline-none focus:ring-2 focus:ring-bj-green"
          >
            <option value="">Tous les types</option>
            <option value="GENERALE">Général</option>
            <option value="TECHNIQUE">Technique</option>
            <option value="PROFESSIONNELLE">Professionnel</option>
            <option value="ECOLE_METIER">École de Métiers</option>
            <option value="TECHNIQUE_AGRICOLE">Technique Agricole</option>
          </select>
        </div>

        <p className="text-sm text-bj-gray-500 mb-6v">{filtered.length} filière(s) trouvée(s)</p>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6v">
          {filtered.map((filiere) => (
            <Link key={filiere.id} href={`/catalogue/${filiere.id}`} className="bj-card">
              <div className="p-6v">
                <div className="flex items-center justify-between mb-3v">
                  <span className={`px-3v py-1v rounded-full text-xs font-medium ${typeColors[filiere.type]}`}>
                    {typeLabels[filiere.type]}
                  </span>
                  <span className="text-sm font-semibold text-bj-green">
                    {filiere.tauxInsertion}% insertion
                  </span>
                </div>
                <h3 className="text-lg font-bold mb-2v">{filiere.nom}</h3>
                <p className="text-sm text-bj-gray-500 mb-3v">{filiere.description}</p>
                <div className="text-xs text-bj-gray-625">
                  <span className="font-medium">Débouchés :</span> {filiere.debouches}
                </div>
              </div>
              <div className="px-6v py-3v bg-bj-gray-975 border-t border-bj-gray-925">
                <span className="text-sm font-medium text-bj-green">Voir la fiche →</span>
              </div>
            </Link>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12v">
            <p className="text-bj-gray-500 text-lg">Aucune filière trouvée pour cette recherche.</p>
          </div>
        )}
      </div>
    </div>
  );
}
