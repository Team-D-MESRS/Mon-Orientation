'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ConnexionPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [identifiant, setIdentifiant] = useState('');
  const [motDePasse, setMotDePasse] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: API call
    console.log('Login:', { identifiant, motDePasse });
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-8v">
      <div className="bj-container max-w-md w-full">
        <div className="bj-card p-8v">
          <div className="text-center mb-8v">
            <div className="w-16 h-16 bg-bj-green rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4v">
              MO
            </div>
            <h1 className="text-2xl font-bold">
              {isLogin ? 'Connexion' : 'Inscription'}
            </h1>
            <p className="text-sm text-bj-gray-500 mt-2v">
              {isLogin
                ? 'Accédez à votre espace personnel'
                : 'Créez votre compte Mon Orientation'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4v">
            {!isLogin && (
              <>
                <div>
                  <label htmlFor="nom" className="block text-sm font-medium mb-1v">Nom</label>
                  <input
                    id="nom"
                    type="text"
                    className="w-full px-4v py-3v border border-bj-gray-850 rounded-bj-sm text-sm focus:outline-none focus:ring-2 focus:ring-bj-green"
                    placeholder="Votre nom"
                  />
                </div>
                <div>
                  <label htmlFor="prenom" className="block text-sm font-medium mb-1v">Prénom</label>
                  <input
                    id="prenom"
                    type="text"
                    className="w-full px-4v py-3v border border-bj-gray-850 rounded-bj-sm text-sm focus:outline-none focus:ring-2 focus:ring-bj-green"
                    placeholder="Votre prénom"
                  />
                </div>
              </>
            )}

            <div>
              <label htmlFor="identifiant" className="block text-sm font-medium mb-1v">
                {isLogin ? 'NIP ou Email' : 'NIP (numéro d\'identification)'}
              </label>
              <input
                id="identifiant"
                type="text"
                value={identifiant}
                onChange={(e) => setIdentifiant(e.target.value)}
                className="w-full px-4v py-3v border border-bj-gray-850 rounded-bj-sm text-sm focus:outline-none focus:ring-2 focus:ring-bj-green"
                placeholder={isLogin ? 'Votre NIP ou email' : 'Votre NIP'}
                inputMode="numeric"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1v">Mot de passe</label>
              <input
                id="password"
                type="password"
                value={motDePasse}
                onChange={(e) => setMotDePasse(e.target.value)}
                className="w-full px-4v py-3v border border-bj-gray-850 rounded-bj-sm text-sm focus:outline-none focus:ring-2 focus:ring-bj-green"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              className="w-full bj-btn bj-btn-primary justify-center"
            >
              {isLogin ? 'Se connecter' : 'Créer mon compte'}
            </button>
          </form>

          <div className="mt-6v text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-bj-green hover:underline"
            >
              {isLogin
                ? 'Pas encore de compte ? S\'inscrire'
                : 'Déjà un compte ? Se connecter'}
            </button>
          </div>

          {isLogin && (
            <div className="mt-4v text-center">
              <a href="#" className="text-sm text-bj-gray-500 hover:text-bj-green">
                Mot de passe oublié ?
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
