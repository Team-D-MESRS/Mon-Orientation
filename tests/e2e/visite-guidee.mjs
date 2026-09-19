import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { lancerNavigateur, rapporteur } from './cdp.mjs';

const BASE = process.env.FRONT_URL ?? 'http://localhost:3000';
const BASE_URL_CAPTURES = new URL('./captures', import.meta.url);
const OUT = process.argv[2] ?? fileURLToPath(BASE_URL_CAPTURES);
mkdirSync(OUT, { recursive: true });
const nav = await lancerNavigateur();
const r = rapporteur();
const contient = (t) => `document.body.textContent.includes(${JSON.stringify(t)})`;
// Pas de synthèse vocale vérifiable ici : Chrome headless n'expose généralement aucune voix
// (speechSynthesis.getVoices() vide). On vérifie le mécanisme (bouton, état, flag), pas le son.
const ONGLET_SURLIGNE =
  "(() => { const e = [...document.querySelectorAll('[data-tour]')].find((x) => x.className.includes('ring-2')); return e ? e.getAttribute('data-tour') : null; })()";

async function connecter(identifiant, motDePasse = 'Demo2026!') {
  await nav.aller(`${BASE}/identification`);
  await nav.attendre("!!document.querySelector('#identifiant')");
  await nav.saisir('#identifiant', identifiant);
  await nav.saisir('#password', motDePasse);
  await nav.cliquer('button[type=submit]');
  await nav.attendre("location.pathname === '/espace-apprenant'");
}
async function deconnecter() {
  await nav.cliquerTexte('Déconnexion', 'header button');
  await nav.attendre("location.pathname === '/' && !localStorage.getItem('refreshToken')");
}

try {
  // Chrome headless (profil neuf à chaque lancerNavigateur) : localStorage vide, la tournée doit
  // démarrer d'elle-même à la 1re visite de l'espace apprenant, sans action de l'élève.
  await connecter('DEMO-3E-0001');
  await nav.attendre(contient('Étape 1 sur 6'));
  r.verifier('Tournée démarrée automatiquement à la 1re visite', true);
  await nav.capture(`${OUT}/v-etape1.png`, false);

  await nav.cliquerTexte('Suivant', 'button');
  await nav.attendre(contient('Étape 2 sur 6'));
  const cibleEtape2 = await nav.evaluer(ONGLET_SURLIGNE);
  r.verifier('Étape 2 : onglet Découverte mis en évidence', cibleEtape2 === '/espace-apprenant/decouverte', cibleEtape2);

  await nav.cliquer('button[aria-label="Couper la lecture automatique"]');
  const pressionMicro = await nav.evaluer('document.querySelector(\'button[aria-pressed]\').getAttribute("aria-pressed")');
  r.verifier('Bouton son : coupe la lecture (aria-pressed devient true)', pressionMicro === 'true', pressionMicro);

  await nav.cliquerTexte('Passer la visite', 'button');
  await nav.attendre(`!(${contient('Étape')})`);
  const flagPose = await nav.evaluer("Object.keys(localStorage).some((k) => k.startsWith('visite-guidee:'))");
  r.verifier('Passer la visite : flag localStorage posé', flagPose === true);

  await nav.aller(`${BASE}/espace-apprenant`);
  await nav.attendre("document.readyState === 'complete'");
  const reapparait = await nav.evaluer(contient('Étape 1 sur 6'));
  r.verifier('Ne réapparaît pas après rechargement', reapparait === false, `réapparu = ${reapparait}`);

  await nav.cliquerTexte('Revoir la visite guidée', 'button');
  await nav.attendre(contient('Étape 1 sur 6'));
  r.verifier('« Revoir la visite guidée » (en-tête) relance depuis le début', true);

  // Échap ferme la tournée comme un dialogue classique (bubbles: true, sinon l'écouteur sur
  // `window` ne voit jamais l'évènement simulé — un vrai keydown navigateur, lui, bouillonne).
  await nav.evaluer("(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); return true; })()");
  await nav.attendre(`!(${contient('Étape')})`);
  r.verifier('Échap ferme la tournée', true);
  await deconnecter();

  // ── Mobile : la nav défile horizontalement, le dernier onglet (Guido) doit rester atteignable.
  // Koffi (déjà rempli) plutôt qu'un profil vide : sans découverte, le mur bloquerait tout avant
  // même que CadreEspace ne monte la tournée (décisions du 18-19/09).
  await nav.taille(390, 844);
  await connecter('DEMO-TLE-0001');
  await nav.attendre(contient('Étape 1 sur 6'));
  for (let i = 0; i < 5; i++) {
    await nav.cliquerTexte('Suivant', 'button');
    await nav.attendre(contient(`Étape ${i + 2} sur 6`));
  }
  const cibleEtape6 = await nav.evaluer(ONGLET_SURLIGNE);
  r.verifier('Mobile : dernière étape (Guido) atteinte, onglet correspondant mis en évidence', cibleEtape6 === '/espace-apprenant/conseiller', cibleEtape6);

  const debordement = await nav.evaluer('document.documentElement.scrollWidth - document.documentElement.clientWidth');
  r.verifier('Mobile : pas de débordement horizontal pendant la tournée', debordement === 0, `débordement = ${debordement}`);
  await nav.capture(`${OUT}/v-mobile-etape6.png`, false);

  await nav.cliquerTexte('Terminer', 'button');
  await nav.attendre(`!(${contient('Étape')})`);
  r.verifier('« Terminer » à la dernière étape ferme la tournée', true);
} catch (e) {
  r.verifier('Scénario interrompu', false, e.message);
  await nav.capture(`${OUT}/v-echec.png`).catch(() => {});
} finally {
  if (nav.erreursConsole.length) console.log('Erreurs console :', nav.erreursConsole.slice(0, 5));
  console.log(`RÉSULTAT : ${r.bilan}`);
  await nav.fermer();
  process.exit(r.succes ? 0 : 1);
}
