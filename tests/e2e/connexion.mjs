import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { lancerNavigateur, rapporteur } from './cdp.mjs';

const BASE = process.env.FRONT_URL ?? 'http://localhost:3000';
const BASE_URL_CAPTURES = new URL('./captures', import.meta.url);
const OUT = process.argv[2] ?? fileURLToPath(BASE_URL_CAPTURES);
mkdirSync(OUT, { recursive: true });
const nav = await lancerNavigateur();
const r = rapporteur();
const texteEntete = "[...document.querySelectorAll('header button, header a')].map((e) => e.textContent.trim()).join(' | ')";

try {
  await nav.taille(1280, 900);

  await nav.aller(`${BASE}/espace-apprenant`);
  await nav.attendre("location.pathname === '/connexion'");
  r.verifier('Visiteur sur /espace-apprenant → /connexion', true, await nav.evaluer('location.pathname + location.search'));

  await nav.saisir('#identifiant', 'admin@monorientation.bj');
  await nav.saisir('#password', 'mauvais-mdp');
  await nav.cliquer('button[type=submit]');
  await nav.attendre("!!document.querySelector('[role=alert]')");
  r.verifier('Mauvais mot de passe → message', true, await nav.evaluer("document.querySelector('[role=alert]').textContent"));

  await nav.saisir('#password', 'admin123');
  await nav.cliquer('button[type=submit]');
  await nav.attendre("location.pathname === '/espace-apprenant'");
  r.verifier('Connexion → retour à la page demandée', true, await nav.evaluer('location.pathname'));
  await nav.attendre(`${texteEntete}.includes('Déconnexion')`);
  r.verifier('En-tête connecté (Statistiques + Déconnexion)', await nav.evaluer(`${texteEntete}.includes('Statistiques')`), await nav.evaluer(texteEntete));
  await nav.capture(`${OUT}/b1-connecte.png`, false);

  await nav.aller(`${BASE}/stats`);
  await nav.attendre("!!document.querySelector('main h1')");
  r.verifier('Rechargement : session conservée, /stats accessible à l\'admin', !(await nav.evaluer("document.body.textContent.includes('Accès réservé')")), await nav.evaluer("document.querySelector('main h1').textContent"));

  await nav.cliquerTexte('Déconnexion', 'header button');
  await nav.attendre("location.pathname === '/' && !localStorage.getItem('refreshToken')");
  r.verifier('Déconnexion → accueil et jetons effacés', true, await nav.evaluer(texteEntete));

  await nav.aller(`${BASE}/inscription`);
  await nav.attendre("!!document.querySelector('#nip') && !!document.querySelector('#date-naissance')");
  r.verifier('Inscription élève : NIP + date de naissance', true);
  await nav.cliquerTexte('Parent', 'label');
  await nav.attendre("!document.querySelector('#nip')");
  r.verifier('Inscription parent : champ NIP masqué', true);
  await nav.capture(`${OUT}/b1-inscription-parent.png`);
} catch (e) {
  r.verifier('Scénario interrompu', false, e.message);
} finally {
  if (nav.erreursConsole.length) console.log('Erreurs console :', nav.erreursConsole.slice(0, 5));
  console.log(`RÉSULTAT : ${r.bilan}`);
  await nav.fermer();
  process.exit(r.succes ? 0 : 1);
}
