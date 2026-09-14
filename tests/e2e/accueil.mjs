// Page d'accueil : contenus exacts, recherche, raccourcis vers le catalogue filtré, boutons selon la connexion, mobile.
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { lancerNavigateur, rapporteur } from './cdp.mjs';

const BASE = process.env.FRONT_URL ?? 'http://localhost:3000';
const OUT = process.argv[2] ?? fileURLToPath(new URL('./captures', import.meta.url));
mkdirSync(OUT, { recursive: true });

const nav = await lancerNavigateur();
const r = rapporteur();
const dansMain = (t) => `document.querySelector('main').textContent.includes(${JSON.stringify(t)})`;
const series = "document.querySelectorAll('main a[href*=\"serie=\"]')";
const domaines = "document.querySelectorAll('main a[href^=\"/catalogue?domaine=\"]')";

async function connecter(identifiant, cible) {
  await nav.aller(`${BASE}/connexion`);
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
const accueil = async () => {
  await nav.aller(`${BASE}/`);
  await nav.attendre(`${series}.length === 14 && ${domaines}.length === 14`);
};
// Fait défiler toute la page par paliers (déclenche les apparitions), puis revient en haut
const defiler = () =>
  nav.evaluer(`(async () => {
    for (let y = 0; y <= document.documentElement.scrollHeight; y += innerHeight / 2) {
      scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
    scrollTo(0, 0);
    return true;
  })()`);
const tousApparus = "document.querySelectorAll('[data-apparition]:not([data-apparu])').length === 0";
// data-apparu est posé au début de l'animation : attendre la fin des transitions (délai le plus long + durée) avant une capture
const finAnimations = () => nav.evaluer('new Promise((r) => setTimeout(() => r(true), 2000))');
const opaciteDomaine = "getComputedStyle(document.querySelector('main a[href=\"/catalogue?domaine=NUMERIQUE\"]').closest('li')).opacity";

try {
  await nav.taille(1280, 900);
  await accueil();
  r.verifier(
    'Contenus exacts : ni « 100 filières », ni langues non disponibles, ni lien Statistiques',
    await nav.evaluer(`!${dansMain('100 filières')} && !${dansMain('Bariba')} && !${dansMain('Yoruba')} && !document.querySelector('main a[href="/stats"]')`),
  );
  // Phrase fixe, lue par les lecteurs d'écran : le compteur visible part de 0 et ne défile qu'au scroll
  const phraseFixe =
    "([...document.querySelectorAll('main p')].find((e) => e.textContent.includes('formations recensées'))?.querySelector('.sr-only')?.textContent ?? '')";
  r.verifier(
    'Chiffres lus dans le catalogue',
    await nav.evaluer(`/^[1-9]\\d* formations recensées dans 14 domaines/.test(${phraseFixe})`),
    await nav.evaluer(phraseFixe),
  );
  r.verifier('Visiteur : « Se connecter » et « Créer un compte »', await nav.evaluer(`${dansMain('Se connecter')} && !!document.querySelector('main a[href="/inscription"]')`));
  r.verifier('Exemple du conseiller marqué en fongbé (lang="fon")', await nav.evaluer(`!!document.querySelector('main [lang="fon"]')`));

  // Animations au défilement
  r.verifier(
    'Animations actives ; hors de l’écran, les tuiles de domaine attendent le défilement',
    await nav.evaluer(`document.documentElement.hasAttribute('data-animations') && ${opaciteDomaine} === '0'`),
  );
  await defiler();
  await nav.attendre(tousApparus, 10000);
  await nav.attendre(`${opaciteDomaine} === '1'`, 5000);
  await finAnimations();
  r.verifier(
    'Au défilement, tous les blocs apparaissent et le compteur atteint le total',
    await nav.evaluer(
      "(() => { const p = [...document.querySelectorAll('main p')].find((e) => e.textContent.includes('formations recensées')); return p.querySelector('[aria-hidden] .tabular-nums').textContent === p.querySelector('.sr-only').textContent.split(' ')[0]; })()",
    ),
  );
  await nav.capture(`${OUT}/a1-accueil.png`);

  // Préférence système « réduire les animations » : rien n'est masqué ni animé
  await nav.media('', [{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await accueil();
  r.verifier(
    'Animations réduites : tout est visible d’emblée',
    await nav.evaluer(`!document.documentElement.hasAttribute('data-animations') && ${opaciteDomaine} === '1'`),
  );
  await nav.media('');

  await nav.saisir('#recherche-accueil', 'medecine');
  await nav.cliquer('form[role=search] button[type=submit]');
  await nav.attendre(`location.pathname === '/catalogue' && location.search.includes('q=medecine') && document.body.textContent.includes('Médecine générale')`);
  r.verifier('Recherche de l’accueil → catalogue filtré', true);

  await accueil();
  await nav.cliquer('main a[aria-label^="Bac D "]');
  await nav.attendre(`location.pathname === '/catalogue' && location.search.includes('serie=D') && document.body.textContent.includes('accessibles avec un bac D')`);
  r.verifier('Pastille « D » → formations accessibles avec un bac D', true);

  await accueil();
  await nav.cliquer('main a[href="/catalogue?domaine=NUMERIQUE"]');
  await nav.attendre(`location.search.includes('domaine=NUMERIQUE') && document.body.textContent.includes('7 filière(s) trouvée(s)')`);
  r.verifier('Tuile Numérique → 7 formations', true);

  await connecter('DEMO-TLE-0001', '/espace-apprenant');
  await accueil();
  await nav.attendre(`!!document.querySelector('main a[href="/espace-apprenant"]') && ${dansMain('Bonjour Koffi')}`);
  r.verifier('Élève connecté : « Mon espace » à la place de « Se connecter »', await nav.evaluer(`!${dansMain('Se connecter')}`));
  await deconnecter();

  await connecter('dges.demo@monorientation.bj', '/stats');
  await accueil();
  await nav.attendre(`!!document.querySelector('main a[href="/stats"]') && ${dansMain('Tableau de bord')}`);
  r.verifier('DGES connecté : « Tableau de bord »', true);
  await deconnecter();

  await nav.taille(390, 844, true);
  await accueil();
  r.verifier('Mobile : pas de débordement horizontal', await nav.evaluer('innerWidth === 390 && document.documentElement.scrollWidth <= 390'));
  await defiler();
  await nav.attendre(tousApparus, 10000);
  await finAnimations();
  await nav.capture(`${OUT}/a2-accueil-mobile.png`);
  r.verifier('Aucune erreur d’hydratation', !nav.erreursConsole.some((e) => /hydrat|did not match/i.test(e)));
} catch (e) {
  r.verifier('Scénario interrompu', false, e.message);
  await nav.capture(`${OUT}/a-echec.png`).catch(() => {});
} finally {
  if (nav.erreursConsole.length) console.log('Erreurs console :', nav.erreursConsole.slice(0, 6));
  console.log(`RÉSULTAT : ${r.bilan}`);
  await nav.fermer();
  process.exit(r.succes ? 0 : 1);
}
