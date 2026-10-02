// Guido dans le navigateur : page autonome depuis le header, accès élève/parent et interface texte du bot.
// Ce scénario ne soumet aucune question au service externe (aucune clé, donnée ou requête payante).
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { lancerNavigateur, rapporteur } from './cdp.mjs';

const BASE = process.env.FRONT_URL ?? 'http://localhost:3000';
const OUT = process.argv[2] ?? fileURLToPath(new URL('./captures', import.meta.url));
mkdirSync(OUT, { recursive: true });
const nav = await lancerNavigateur();
const r = rapporteur();
const contient = (t) => `document.body.textContent.includes(${JSON.stringify(t)})`;

async function connecter(identifiant, cible) {
  await nav.aller(`${BASE}/identification`);
  await nav.attendre("!!document.querySelector('#identifiant')");
  await nav.saisir('#identifiant', identifiant);
  await nav.saisir('#password', 'Demo2026!');
  await nav.cliquer('button[type=submit]');
  await nav.attendre(`location.pathname === ${JSON.stringify(cible)}`);
}
async function deconnecter() {
  await nav.cliquerTexte('Déconnexion', 'header button');
  await nav.attendre("location.pathname === '/' && !localStorage.getItem('refreshToken')");
}

try {
  await nav.taille(1280, 900);

  await nav.aller(`${BASE}/`);
  await nav.attendre("!!document.querySelector('button[aria-label=\"Ouvrir Guido\"]')");
  r.verifier('Bouton flottant Guido présent sur la page d’accueil', true);
  await nav.cliquer('button[aria-label="Ouvrir Guido"]');
  await nav.attendre("!!document.querySelector('[role=\"dialog\"] #guido-widget-title')");
  r.verifier('Le bouton ouvre le panneau de discussion Guido', await nav.evaluer("document.querySelector('[role=\"dialog\"] #guido-widget-title')?.textContent === 'Guido'"));
  await nav.cliquer('button[aria-label="Fermer Guido"]');
  await nav.attendre("!!document.querySelector('button[aria-label=\"Ouvrir Guido\"]')");

  await nav.aller(`${BASE}/conseiller`);
  await nav.attendre(contient("S'identifier pour échanger avec Guido"));
  r.verifier('Visiteur : présentation de Guido et invitation à s’identifier', true);
  r.verifier('La page décrit les métiers techniques', await nav.evaluer(contient('formations techniques')));
  await nav.cliquer('a[href*="redirect"]');
  await nav.attendre("location.pathname === '/identification'");
  await nav.attendre("!!document.querySelector('#identifiant')");
  await nav.saisir('#identifiant', 'DEMO-3E-0001');
  await nav.saisir('#password', 'Demo2026!');
  await nav.cliquer('button[type=submit]');
  await nav.attendre("location.pathname === '/conseiller'");
  await nav.attendre(contient('Pose tes questions sur les métiers et formations techniques'));
  r.verifier('Après connexion depuis sa page, l’élève revient directement à Guido', await nav.evaluer("location.pathname === '/conseiller'"));

  await nav.aller(`${BASE}/espace-apprenant`);
  await nav.attendre("!!document.querySelector('nav[aria-label=\"Espace apprenant\"]')");
  r.verifier('L’espace apprenant ne présente plus d’onglet Guido', await nav.evaluer("![...document.querySelectorAll('nav[aria-label=\"Espace apprenant\"] a')].some((a) => a.textContent.trim() === 'Guido')"));
  await nav.cliquer('header nav[aria-label="Navigation principale"] a[href="/conseiller"]');
  await nav.attendre("location.pathname === '/conseiller'");
  r.verifier('Le lien Guido du header ouvre la page autonome, sans navigation de l’espace apprenant', await nav.evaluer("location.pathname === '/conseiller' && !document.querySelector('nav[aria-label=\"Espace apprenant\"]')"));

  await nav.aller(`${BASE}/espace-apprenant/conseiller`);
  await nav.attendre("location.pathname === '/conseiller'");
  r.verifier('L’ancienne URL du chat redirige vers la page autonome', await nav.evaluer("location.pathname === '/conseiller'"));
  await nav.attendre("!!document.querySelector('#question')");
  r.verifier('Suggestions de métiers et formations techniques', await nav.evaluer("[...document.querySelectorAll('section button')].filter((b) => b.textContent.includes('?')).length >= 3"));
  r.verifier('Le micro et le sélecteur de langue non pris en charge sont absents', await nav.evaluer("!document.querySelector('button[aria-label*=" + JSON.stringify('note vocale') + "]') && !document.querySelector('[aria-label=\"Langue des réponses\"]')"));
  await nav.capture(`${OUT}/conseiller-eleve-1280.png`, false);
  await nav.taille(390, 844, true);
  await nav.capture(`${OUT}/conseiller-eleve-390.png`, false);
  r.verifier('Mobile 390 px : pas de défilement horizontal', await nav.evaluer('document.documentElement.scrollWidth <= window.innerWidth'));
  await nav.taille(1280, 900);
  await deconnecter();

  await connecter('parent.demo@monorientation.bj', '/espace-apprenant');
  await nav.aller(`${BASE}/conseiller`);
  await nav.attendre(contient('Posez vos questions sur les formations techniques pour Fatou'));
  r.verifier('Parent : chat autonome adapté et questions sur les formations techniques', await nav.evaluer(contient('Quels lycées techniques proposent une formation')));
  await deconnecter();
} catch (e) {
  r.verifier('Scénario interrompu', false, e.message);
} finally {
  if (nav.erreursConsole.length) console.log('Erreurs console :', nav.erreursConsole.slice(0, 5));
  console.log(`RÉSULTAT : ${r.bilan}`);
  await nav.fermer();
  process.exit(r.succes ? 0 : 1);
}
