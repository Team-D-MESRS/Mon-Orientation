'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi, type DonneesInscription } from '@/lib/api';
import { messageErreur } from '@/lib/erreurs';
import { accueilDuRole, useAuthStore } from '@/stores/authStore';

const CHAMP =
  'w-full px-4v py-3v border border-bj-gray-850 rounded-bj-sm text-sm focus:outline-none focus:ring-2 focus:ring-bj-green';

type Profil = DonneesInscription['role'];

export default function InscriptionPage() {
  const router = useRouter();
  const { user, pret, login } = useAuthStore();
  const [role, setRole] = useState<Profil>('APPRENANT');
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [nip, setNip] = useState('');
  const [dateNaissance, setDateNaissance] = useState('');
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);

  useEffect(() => {
    if (pret && user) router.replace(accueilDuRole(user.role));
  }, [pret, user, router]);

  const estEleve = role === 'APPRENANT';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErreur(null);
    if (motDePasse.length < 8) {
      setErreur('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (motDePasse !== confirmation) {
      setErreur('Les deux mots de passe ne correspondent pas.');
      return;
    }

    const donnees: DonneesInscription = {
      role,
      nom: nom.trim(),
      prenom: prenom.trim(),
      motDePasse,
      ...(estEleve ? { nip: nip.trim(), dateNaissance } : {}),
      ...(email.trim() ? { email: email.trim() } : {}),
    };

    setEnvoi(true);
    try {
      const { data } = await authApi.register(donnees);
      login(data.user, data.accessToken, data.refreshToken);
    } catch (err) {
      setErreur(messageErreur(err, { 409: 'Un compte existe déjà avec ce NIP ou cet email.' }));
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
            <h1 className="text-2xl font-bold">Inscription</h1>
            <p className="text-sm text-bj-gray-500 mt-2v">Crée ton compte Mon Orientation</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4v" noValidate>
            <fieldset>
              <legend className="block text-sm font-medium mb-2v">Je suis</legend>
              <div className="grid grid-cols-2 gap-3v">
                {(
                  [
                    ['APPRENANT', 'Élève'],
                    ['PARENT', 'Parent / tuteur'],
                  ] as [Profil, string][]
                ).map(([valeur, libelle]) => (
                  <label
                    key={valeur}
                    className={`flex items-center justify-center gap-2v px-3v py-3v rounded-bj-sm border text-sm font-medium cursor-pointer ${
                      role === valeur ? 'border-bj-green bg-bj-green/10 text-bj-green' : 'border-bj-gray-850'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={valeur}
                      checked={role === valeur}
                      onChange={() => setRole(valeur)}
                      className="sr-only"
                    />
                    {libelle}
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="grid grid-cols-2 gap-4v">
              <div>
                <label htmlFor="nom" className="block text-sm font-medium mb-1v">Nom</label>
                <input id="nom" type="text" autoComplete="family-name" required value={nom} onChange={(e) => setNom(e.target.value)} className={CHAMP} />
              </div>
              <div>
                <label htmlFor="prenom" className="block text-sm font-medium mb-1v">Prénom</label>
                <input id="prenom" type="text" autoComplete="given-name" required value={prenom} onChange={(e) => setPrenom(e.target.value)} className={CHAMP} />
              </div>
            </div>

            {estEleve ? (
              <>
                <div>
                  <label htmlFor="nip" className="block text-sm font-medium mb-1v">NIP</label>
                  <input id="nip" type="text" required value={nip} onChange={(e) => setNip(e.target.value)} className={CHAMP} aria-describedby="aide-nip" />
                  <p id="aide-nip" className="text-xs text-bj-gray-500 mt-1v">
                    Ton numéro d&apos;identification personnel t&apos;est communiqué par ton établissement.
                  </p>
                </div>
                <div>
                  <label htmlFor="date-naissance" className="block text-sm font-medium mb-1v">Date de naissance</label>
                  <input id="date-naissance" type="date" required value={dateNaissance} onChange={(e) => setDateNaissance(e.target.value)} className={CHAMP} aria-describedby="aide-naissance" />
                  <p id="aide-naissance" className="text-xs text-bj-gray-500 mt-1v">
                    Elle permet de vérifier que ce NIP est bien le tien.
                  </p>
                </div>
              </>
            ) : (
              <p className="text-xs text-bj-gray-500">
                Après ton inscription, ton établissement rattachera ton compte au dossier de ton enfant.
              </p>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1v">
                Email {estEleve && <span className="font-normal text-bj-gray-500">(facultatif)</span>}
              </label>
              <input id="email" type="email" autoComplete="email" required={!estEleve} value={email} onChange={(e) => setEmail(e.target.value)} className={CHAMP} />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1v">Mot de passe</label>
              <input id="password" type="password" autoComplete="new-password" required value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} className={CHAMP} aria-describedby="aide-mdp" />
              <p id="aide-mdp" className="text-xs text-bj-gray-500 mt-1v">Au moins 8 caractères</p>
            </div>

            <div>
              <label htmlFor="confirmation" className="block text-sm font-medium mb-1v">Confirmer le mot de passe</label>
              <input id="confirmation" type="password" autoComplete="new-password" required value={confirmation} onChange={(e) => setConfirmation(e.target.value)} className={CHAMP} />
            </div>

            {erreur && (
              <p role="alert" className="text-sm p-3v rounded-bj-sm border border-bj-red/40 bg-bj-red/5 text-bj-red">
                {erreur}
              </p>
            )}

            <button
              type="submit"
              disabled={envoi}
              className="w-full bj-btn bj-btn-primary justify-center disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {envoi ? 'Création du compte…' : 'Créer mon compte'}
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
