// Conseiller pédagogique dans le navigateur : page de présentation, onglet de l'espace, suggestions,
// comportement sans clé API (message explicite, question conservée) ou avec clé (réponse et liens internes).
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { lancerNavigateur, rapporteur } from './cdp.mjs';

const BASE = process.env.FRONT_URL ?? 'http://localhost:3000';
const OUT = process.argv[2] ?? fileURLToPath(new URL('./captures', import.meta.url));
mkdirSync(OUT, { recursive: true });
const nav = await lancerNavigateur();
const r = rapporteur();
const contient = (t) => `document.body.textContent.includes(${JSON.stringify(t)})`;
const QUESTION = 'Pourquoi le moteur me propose ces formations ?';

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

  await nav.aller(`${BASE}/conseiller`);
  await nav.attendre(contient("S'identifier pour échanger avec Guido"));
  r.verifier("Visiteur : présentation de Guido et invitation à s'identifier", true);

  await connecter('DEMO-3E-0001', '/espace-apprenant');
  await nav.aller(`${BASE}/conseiller`);
  await nav.attendre("location.pathname === '/espace-apprenant/conseiller'");
  await nav.attendre(contient('Pose tes questions sur ton orientation'));
  r.verifier(
    "Élève : /conseiller mène à l'onglet Guido de son espace",
    // nav[aria-label="Espace apprenant"] précisément : le lien « Mon espace » de l'en-tête porte lui aussi
    // aria-current="page" sur toute sous-route de /espace-apprenant (correspondance par préfixe), un
    // sélecteur nav[aria-label] générique aurait pu le retrouver en premier au lieu de l'onglet Guido.
    await nav.evaluer("document.querySelector('nav[aria-label=\"Espace apprenant\"] a[aria-current=page]')?.textContent.includes('Guido') === true"),
  );
  r.verifier('Suggestions de questions proposées', await nav.evaluer(`[...document.querySelectorAll('section button')].filter((b) => b.textContent.includes('?')).length >= 3`));
  r.verifier(
    'Bouton note vocale présent (fon, yoruba, mina…)',
    await nav.evaluer("!!document.querySelector('button[aria-label*=\"note vocale\"]')"),
  );

  // Langue des réponses : choix retenu par l'appareil (sans question envoyée, pour ménager le quota du modèle)
  const langueActive = "document.querySelector('[aria-label=\"Langue des réponses\"] button[aria-pressed=\"true\"]')?.textContent";
  r.verifier('Langue des réponses : français par défaut', await nav.evaluer(`${langueActive} === 'Français'`));
  await nav.cliquerTexte('Fɔ̀ngbè', '[aria-label="Langue des réponses"] button');
  await nav.attendre(`${langueActive} === 'Fɔ̀ngbè' && ${contient('en fongbé sont rédigées automatiquement')}`);
  await nav.aller(`${BASE}/espace-apprenant/conseiller`);
  await nav.attendre(`${langueActive} === 'Fɔ̀ngbè'`);
  r.verifier('Fongbé choisi, avec avertissement, et retenu après rechargement', true);
  await nav.cliquerTexte('Français', '[aria-label="Langue des réponses"] button');
  await nav.attendre(`${langueActive} === 'Français'`);

  await nav.cliquerTexte(QUESTION, 'section button');
  await nav.attendre(`${contient('pas encore configuré')} || !!document.querySelector('[role=alert]') || (document.querySelectorAll('.bubble-assistant').length > 0 && !${contient('Guido réfléchit')})`, 150000);
  const alerte = await nav.evaluer("document.querySelector('[role=alert]')?.textContent ?? ''");
  if (alerte && !alerte.includes('pas encore configuré')) {
    r.verifier('Réponse du conseiller', false, `erreur affichée (quota ou surcharge du modèle ?) : ${alerte}`);
  } else if (await nav.evaluer(contient('pas encore configuré'))) {
    r.verifier(
      'Sans clé API : message explicite et question remise dans le champ',
      await nav.evaluer(`document.querySelector('#question').value === ${JSON.stringify(QUESTION)} && document.querySelectorAll('.bubble-user').length === 0`),
    );
  } else {
    r.verifier(
      'Avec clé API : réponse affichée, liens vers les fiches du catalogue',
      await nav.evaluer("document.querySelectorAll('.bubble-assistant a[href^=\"/catalogue/\"]').length > 0"),
      await nav.evaluer("document.querySelector('.bubble-assistant')?.textContent.slice(0, 160)"),
    );
  }
  await nav.capture(`${OUT}/conseiller-eleve-1280.png`, false);
  await nav.taille(390, 844, true);
  await nav.capture(`${OUT}/conseiller-eleve-390.png`, false);
  r.verifier('Mobile 390 px : pas de défilement horizontal', await nav.evaluer('document.documentElement.scrollWidth <= window.innerWidth'));
  await nav.taille(1280, 900);
  await deconnecter();

  await connecter('parent.demo@monorientation.bj', '/espace-apprenant');
  await nav.aller(`${BASE}/espace-apprenant/conseiller`);
  await nav.attendre(contient("Posez vos questions sur l'orientation de Fatou"));
  r.verifier('Parent : vouvoiement et suggestions pour les parents', await nav.evaluer(contient('Que veut dire DTM ?')));
  await deconnecter();
} catch (e) {
  r.verifier('Scénario interrompu', false, e.message);
} finally {
  if (nav.erreursConsole.length) console.log('Erreurs console :', nav.erreursConsole.slice(0, 5));
  console.log(`RÉSULTAT : ${r.bilan}`);
  await nav.fermer();
  process.exit(r.succes ? 0 : 1);
}
