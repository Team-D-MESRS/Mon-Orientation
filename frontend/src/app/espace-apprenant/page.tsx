'use client';

import { useState } from 'react';
import Link from 'next/link';
import { User, BookOpen, Heart, Lightbulb, BarChart3 } from 'lucide-react';

const notes = [
  { matiere: 'Mathématiques', note: 15, bareme: 20 },
  { matiere: 'Français', note: 12, bareme: 20 },
  { matiere: 'Physique-Chimie', note: 14, bareme: 20 },
  { matiere: 'SVT', note: 13, bareme: 20 },
  { matiere: 'Histoire-Géographie', note: 11, bareme: 20 },
  { matiere: 'Anglais', note: 10, bareme: 20 },
];

export default function EspaceApprenantPage() {
  const [activeTab, setActiveTab] = useState<'profil' | 'notes' | 'preferences' | 'recommandations'>('profil');

  const moyenneGenerale = notes.reduce((sum, n) => sum + n.note, 0) / notes.length;

  return (
    <div className="py-8v">
      <div className="bj-container">
        <h1 className="text-3xl font-bold mb-2v">Mon espace</h1>
        <p className="text-bj-gray-500 mb-8v">Tableau de bord personnel</p>

        {/* Tabs */}
        <div className="flex gap-2v mb-8v overflow-x-auto">
          {[
            { id: 'profil', label: 'Profil', icon: User },
            { id: 'notes', label: 'Mes notes', icon: BookOpen },
            { id: 'preferences', label: 'Préférences', icon: Heart },
            { id: 'recommandations', label: 'Recommandations', icon: Lightbulb },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2v px-4v py-2v rounded-bj-sm text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-bj-green text-white'
                  : 'bg-bj-gray-975 text-bj-gray-500 hover:bg-bj-gray-950'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Profil */}
        {activeTab === 'profil' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6v">
            <div className="bj-card p-6v">
              <div className="flex items-center gap-3v mb-4v">
                <div className="w-12 h-12 bg-bj-green/10 rounded-full flex items-center justify-center">
                  <User className="text-bj-green" size={24} />
                </div>
                <div>
                  <h3 className="font-bold">Adama Kouassi</h3>
                  <p className="text-xs text-bj-gray-500">NIP: 1234567890</p>
                </div>
              </div>
              <div className="space-y-2v text-sm">
                <p><span className="text-bj-gray-500">Classe :</span> <span className="font-medium">3ème</span></p>
                <p><span className="text-bj-gray-500">Établissement :</span> <span className="font-medium">Collège de Porto-Novo</span></p>
                <p><span className="text-bj-gray-500">Département :</span> <span className="font-medium">Ouémé</span></p>
              </div>
            </div>

            <div className="bj-card p-6v">
              <h3 className="font-bold mb-4v flex items-center gap-2v">
                <BarChart3 size={18} /> Moyenne générale
              </h3>
              <div className="text-4xl font-bold text-bj-green mb-2v">
                {moyenneGenerale.toFixed(1)}/20
              </div>
              <div className="w-full bg-bj-gray-950 rounded-full h-3v">
                <div
                  className="bg-bj-green h-3v rounded-full transition-all"
                  style={{ width: `${(moyenneGenerale / 20) * 100}%` }}
                />
              </div>
            </div>

            <div className="bj-card p-6v">
              <h3 className="font-bold mb-4v">Palier actuel</h3>
              <div className="bg-bj-green/10 rounded-bj-md p-4v text-center">
                <div className="text-2xl font-bold text-bj-green">3ème</div>
                <p className="text-sm text-bj-gray-500 mt-1v">Saison d&apos;orientation</p>
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        {activeTab === 'notes' && (
          <div className="bj-card">
            <div className="p-6v border-b border-bj-gray-925">
              <h2 className="font-bold">Notes par matière</h2>
            </div>
            <div className="divide-y divide-bj-gray-925">
              {notes.map((n) => (
                <div key={n.matiere} className="flex items-center justify-between px-6v py-4v">
                  <div className="flex-1">
                    <span className="font-medium text-sm">{n.matiere}</span>
                  </div>
                  <div className="flex items-center gap-4v">
                    <div className="w-24 bg-bj-gray-950 rounded-full h-2v">
                      <div
                        className={`h-2v rounded-full ${n.note >= 14 ? 'bg-bj-green' : n.note >= 10 ? 'bg-bj-yellow' : 'bg-bj-red'}`}
                        style={{ width: `${(n.note / n.bareme) * 100}%` }}
                      />
                    </div>
                    <span className={`font-bold text-sm ${n.note >= 14 ? 'text-bj-green' : n.note >= 10 ? 'text-yellow-600' : 'text-bj-red'}`}>
                      {n.note}/{n.bareme}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Préférences */}
        {activeTab === 'preferences' && (
          <div className="bj-card p-6v">
            <h2 className="font-bold mb-6v">Mes préférences d&apos;orientation</h2>
            <p className="text-sm text-bj-gray-500 mb-6v">
              Sélectionne les filières qui t&apos;intéressent le plus pour ta future orientation.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4v mb-6v">
              {[
                { rank: 1, color: 'border-bj-green bg-bj-green/5' },
                { rank: 2, color: 'border-bj-blue bg-bj-blue/5' },
                { rank: 3, color: 'border-bj-ochre bg-bj-ochre/5' },
              ].map((pref) => (
                <div key={pref.rank} className={`border-2 rounded-bj-md p-4v ${pref.color}`}>
                  <div className="text-sm font-bold mb-2v">Choix n°{pref.rank}</div>
                  <select className="w-full px-3v py-2v border border-bj-gray-850 rounded-bj-sm text-sm">
                    <option>Sélectionner une filière</option>
                    <option>Bac Général - Sciences</option>
                    <option>Bac Général - Littéraire</option>
                    <option>Bac Technique - Électrotechnique</option>
                    <option>École de Métiers - Électricité</option>
                  </select>
                </div>
              ))}
            </div>
            <button className="bj-btn bj-btn-primary">
              Sauvegarder mes préférences
            </button>
          </div>
        )}

        {/* Recommandations */}
        {activeTab === 'recommandations' && (
          <div className="space-y-4v">
            <div className="bj-card p-6v">
              <div className="flex items-center justify-between mb-4v">
                <h3 className="font-bold text-lg">École de Métiers - Électricité</h3>
                <span className="text-2xl font-bold text-bj-green">88%</span>
              </div>
              <p className="text-sm text-bj-gray-500 mb-3v">
                Formation pratique de 2 ans en installation électrique. Taux d&apos;insertion élevé.
              </p>
              <div className="bg-bj-green/5 rounded-bj-sm p-3v text-sm">
                <strong>Caractéristiques :</strong> Tes forces en Mathématiques et Physique-Chimie correspondent bien à cette filière.
              </div>
            </div>

            <div className="bj-card p-6v">
              <div className="flex items-center justify-between mb-4v">
                <h3 className="font-bold text-lg">CAP Métallurgie</h3>
                <span className="text-2xl font-bold text-bj-green">82%</span>
              </div>
              <p className="text-sm text-bj-gray-500 mb-3v">
                Certificat d&apos;aptitude professionnelle en travail des métaux.
              </p>
              <div className="bg-bj-green/5 rounded-bj-sm p-3v text-sm">
                <strong>Caractéristiques :</strong> Bon taux d&apos;insertion, métier recherché au Bénin.
              </div>
            </div>

            <div className="bj-card p-6v">
              <div className="flex items-center justify-between mb-4v">
                <h3 className="font-bold text-lg">Bac Technique - Électrotechnique</h3>
                <span className="text-2xl font-bold text-bj-blue">78%</span>
              </div>
              <p className="text-sm text-bj-gray-500 mb-3v">
                Formation technique spécialisée en électricité et systèmes automatisés.
              </p>
              <div className="bg-bj-blue/5 rounded-bj-sm p-3v text-sm">
                <strong>Caractéristiques :</strong> Permet de poursuivre en école d&apos;ingénieur après le bac.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
