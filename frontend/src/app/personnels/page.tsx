'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { messageErreur } from '@/lib/erreurs';
import { cheminDeRetour } from '@/lib/redirection';
import { accueilDuRole, useAuthStore } from '@/stores/authStore';
import { Alerte, CHAMP } from '@/components/espace/ui';
import { Button } from '@/components/ui/Button';

/** Accès des personnels du ministère : compte interne, distinct de l'identification EducMaster. */
export default function PersonnelsPage() {
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
      const { data } = await authApi.personnel(identifiant.trim(), motDePasse);
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
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-text-on-primary font-bold text-xl mx-auto mb-4v">
              MO
            </div>
            <h1 className="text-2xl font-bold">Accès des personnels</h1>
            <p className="text-sm text-text-secondary mt-2v">
              Administration, DGES et établissements. Les élèves et leurs parents passent par{' '}
              <span className="whitespace-nowrap">l&apos;identification EducMaster</span>.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4v" noValidate>
            <div>
              <label htmlFor="identifiant" className="block text-sm font-medium mb-1v">
                Adresse professionnelle
              </label>
              <input
                id="identifiant"
                type="email"
                autoComplete="username"
                required
                value={identifiant}
                onChange={(e) => setIdentifiant(e.target.value)}
                className={CHAMP}
                placeholder="nom@monorientation.bj"
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

            {erreur && <Alerte ton="erreur">{erreur}</Alerte>}

            <Button type="submit" fullWidth loading={envoi} disabled={!identifiant.trim() || !motDePasse}>
              {envoi ? 'Connexion…' : 'Se connecter'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
