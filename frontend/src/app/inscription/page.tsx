'use client';

import Link from 'next/link';

export default function InscriptionPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center py-8v">
      <div className="bj-container max-w-md w-full">
        <div className="bj-card p-8v">
          <div className="text-center mb-8v">
            <div className="w-16 h-16 bg-bj-green rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4v">
              MO
            </div>
            <h1 className="text-2xl font-bold">Inscription</h1>
            <p className="text-sm text-bj-gray-500 mt-2v">
              Créez votre compte Mon Orientation
            </p>
          </div>

          <form className="space-y-4v">
            <div className="grid grid-cols-2 gap-4v">
              <div>
                <label htmlFor="nom" className="block text-sm font-medium mb-1v">Nom</label>
                <input
                  id="nom"
                  type="text"
                  className="w-full px-4v py-3v border border-bj-gray-850 rounded-bj-sm text-sm focus:outline-none focus:ring-2 focus:ring-bj-green"
                  placeholder="Dupont"
                />
              </div>
              <div>
                <label htmlFor="prenom" className="block text-sm font-medium mb-1v">Prénom</label>
                <input
                  id="prenom"
                  type="text"
                  className="w-full px-4v py-3v border border-bj-gray-850 rounded-bj-sm text-sm focus:outline-none focus:ring-2 focus:ring-bj-green"
                  placeholder="Jean"
                />
              </div>
            </div>

            <div>
              <label htmlFor="nip" className="block text-sm font-medium mb-1v">NIP (numéro d&apos;identification)</label>
              <input
                id="nip"
                type="text"
                className="w-full px-4v py-3v border border-bj-gray-850 rounded-bj-sm text-sm focus:outline-none focus:ring-2 focus:ring-bj-green"
                placeholder="1234567890"
                inputMode="numeric"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1v">Email (optionnel)</label>
              <input
                id="email"
                type="email"
                className="w-full px-4v py-3v border border-bj-gray-850 rounded-bj-sm text-sm focus:outline-none focus:ring-2 focus:ring-bj-green"
                placeholder="jeune@email.com"
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium mb-1v">Je suis</label>
              <select
                id="role"
                className="w-full px-4v py-3v border border-bj-gray-850 rounded-bj-sm text-sm focus:outline-none focus:ring-2 focus:ring-bj-green"
              >
                <option value="APPRENANT">Élève / Apprenant</option>
                <option value="PARENT">Parent / Tuteur</option>
              </select>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1v">Mot de passe</label>
              <input
                id="password"
                type="password"
                className="w-full px-4v py-3v border border-bj-gray-850 rounded-bj-sm text-sm focus:outline-none focus:ring-2 focus:ring-bj-green"
                placeholder="••••••••"
              />
              <p className="text-xs text-bj-gray-500 mt-1v">Minimum 8 caractères</p>
            </div>

            <button
              type="submit"
              className="w-full bj-btn bj-btn-primary justify-center"
            >
              Créer mon compte
            </button>
          </form>

          <div className="mt-6v text-center">
            <Link href="/connexion" className="text-sm text-bj-green hover:underline">
              Déjà un compte ? Se connecter
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
