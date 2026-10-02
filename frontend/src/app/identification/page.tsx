'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { authApi } from '@/lib/api';
import { messageErreur } from '@/lib/erreurs';
import { cheminDeRetour } from '@/lib/redirection';
import { accueilDuRole, useAuthStore } from '@/stores/authStore';
import { Alerte, CHAMP } from '@/components/espace/ui';
import { Button } from '@/components/ui/Button';

export default function IdentificationPage() {
  const router = useRouter();
  const { user, pret, login } = useAuthStore();
  const [identifiant, setIdentifiant] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [motDePasseVisible, setMotDePasseVisible] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);

  useEffect(() => {
    if (pret && user) {
      const retour = cheminDeRetour();
      const destination =
        user.role === 'APPRENANT' || user.role === 'PARENT'
          ? retour === '/conseiller' ? retour : '/espace-apprenant'
          : retour ?? accueilDuRole(user.role);
      router.replace(destination);
    }
  }, [pret, user, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErreur(null);
    setEnvoi(true);
    try {
      const { data } = await authApi.identification(identifiant.trim(), motDePasse);
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
            <h1 className="text-2xl font-bold">S&apos;identifier</h1>
            <p className="text-sm text-text-secondary mt-2v">
              Avec les identifiants que tu utilises déjà sur EducMaster. Il n&apos;y a pas de compte à créer.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4v" noValidate>
            <div>
              <label htmlFor="identifiant" className="block text-sm font-medium mb-1v">
                NIP ou numéro EducMaster
              </label>
              <input
                id="identifiant"
                type="text"
                autoComplete="username"
                required
                value={identifiant}
                onChange={(e) => setIdentifiant(e.target.value)}
                className={CHAMP}
                placeholder="Ton NIP ou ton numéro EducMaster"
              />
              <p className="text-xs text-text-secondary mt-1v">
                Parent : saisis l&apos;adresse de ton compte EducMaster.
              </p>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1v">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={motDePasseVisible ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={motDePasse}
                  onChange={(e) => setMotDePasse(e.target.value)}
                  className={`${CHAMP} pr-10`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setMotDePasseVisible(!motDePasseVisible)}
                  aria-label={motDePasseVisible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  aria-pressed={motDePasseVisible}
                  className="absolute right-3v top-1/2 -translate-y-1/2 text-text-secondary hover:text-text"
                >
                  {motDePasseVisible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                </button>
              </div>
            </div>

            {erreur && <Alerte ton="erreur">{erreur}</Alerte>}

            <Button type="submit" fullWidth loading={envoi} disabled={!identifiant.trim() || !motDePasse}>
              {envoi ? 'Identification…' : "S'identifier"}
            </Button>
          </form>

          <p className="mt-6v text-center text-xs text-text-secondary">
            Identifiants oubliés ? Rapproche-toi de ton établissement, qui gère ton dossier dans EducMaster.
          </p>
        </div>
      </div>
    </div>
  );
}
