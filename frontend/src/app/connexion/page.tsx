'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { messageErreur } from '@/lib/erreurs';
import { cheminDeRetour } from '@/lib/redirection';
import { accueilDuRole, useAuthStore } from '@/stores/authStore';

const CHAMP =
  'w-full px-4v py-3v border border-bj-gray-850 rounded-bj-sm text-sm focus:outline-none focus:ring-2 focus:ring-bj-green';

export default function ConnexionPage() {
  const router = useRouter();
  const { user, pret, login } = useAuthStore();
  const [identifiant, setIdentifiant] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);

  useEffect(() => {
    if (pret && user) router.replace(cheminDeRetour() ?? accueilDuRole(user.role));
  }, [pret, user, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErreur(null);
    setEnvoi(true);
    try {
      const { data } = await authApi.login(identifiant.trim(), motDePasse);
      login(data.user, data.accessToken, data.refreshToken);
    } catch (err) {
      setErreur(messageErreur(err, { 401: 'Identifiant ou mot de passe incorrect.' }));
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-8v">
      <div className="bj-container max-w-md w-full">
        <div className="bj-card p-8v">
          <div className="text-center mb-8v">
            <div className="w-16 h-16 bg-bj-green rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4v">
              MO
            </div>
            <h1 className="text-2xl font-bold">Connexion</h1>
            <p className="text-sm text-bj-gray-500 mt-2v">Accède à ton espace personnel</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4v" noValidate>
            <div>
              <label htmlFor="identifiant" className="block text-sm font-medium mb-1v">
                NIP ou email
              </label>
              <input
                id="identifiant"
                type="text"
                autoComplete="username"
                required
                value={identifiant}
                onChange={(e) => setIdentifiant(e.target.value)}
                className={CHAMP}
                placeholder="Ton NIP ou ton email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1v">
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={motDePasse}
                onChange={(e) => setMotDePasse(e.target.value)}
                className={CHAMP}
                placeholder="••••••••"
              />
            </div>

            {erreur && (
              <p role="alert" className="text-sm p-3v rounded-bj-sm border border-bj-red/40 bg-bj-red/5 text-bj-red">
                {erreur}
              </p>
            )}

            <button
              type="submit"
              disabled={envoi || !identifiant.trim() || !motDePasse}
              className="w-full bj-btn bj-btn-primary justify-center disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {envoi ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>

          <div className="mt-6v text-center space-y-3v">
            <Link href="/inscription" className="block text-sm text-bj-green hover:underline">
              Pas encore de compte ? Créer un compte
            </Link>
            <p className="text-xs text-bj-gray-500">
              Mot de passe oublié ? Rapproche-toi de ton établissement.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
