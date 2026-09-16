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
const contient = (t) => `document.body.textContent.includes(${JSON.stringify(t)})`;

try {
  await nav.taille(1280, 900);

  // ── Élève : identification avec ses identifiants EducMaster, sans inscription
  await nav.aller(`${BASE}/espace-apprenant`);
  await nav.attendre("location.pathname === '/identification'");
  r.verifier('Visiteur sur /espace-apprenant → /identification', true, await nav.evaluer('location.pathname + location.search'));
  r.verifier(
    'La page annonce EducMaster et ne propose aucune création de compte',
    await nav.evaluer(`${contient('EducMaster')} && !${contient('Créer un compte')}`),
  );

  await nav.saisir('#identifiant', 'DEMO-3E-0001');
  await nav.saisir('#password', 'mauvais-mdp');
  await nav.cliquer('button[type=submit]');
  await nav.attendre("!!document.querySelector('[role=alert]')");
  r.verifier('Mauvais mot de passe → message', true, await nav.evaluer("document.querySelector('[role=alert]').textContent"));

  await nav.saisir('#password', 'Demo2026!');
  await nav.cliquer('button[type=submit]');
  await nav.attendre("location.pathname === '/espace-apprenant'");
  r.verifier('Identification → retour à la page demandée', true, await nav.evaluer('location.pathname'));
  await nav.capture(`${OUT}/b1-identifie.png`, false);
  await nav.cliquerTexte('Déconnexion', 'header button');
  await nav.attendre("location.pathname === '/' && !localStorage.getItem('refreshToken')");

  // ── Le numéro EducMaster vaut identifiant, au même titre que le NIP
  await nav.aller(`${BASE}/identification`);
  await nav.attendre("!!document.querySelector('#identifiant')");
  await nav.saisir('#identifiant', 'EM-2026-00031');
  await nav.saisir('#password', 'Demo2026!');
  await nav.cliquer('button[type=submit]');
  await nav.attendre("location.pathname === '/espace-apprenant'");
  r.verifier('Identification par le numéro EducMaster', true);
  await nav.cliquerTexte('Déconnexion', 'header button');
  await nav.attendre("location.pathname === '/'");

  // ── Personnels : accès dédié, séparé de l'identification des élèves
  await nav.aller(`${BASE}/personnels`);
  await nav.attendre("!!document.querySelector('#identifiant')");
  await nav.saisir('#identifiant', 'admin@monorientation.bj');
  await nav.saisir('#password', 'admin123');
  await nav.cliquer('button[type=submit]');
  await nav.attendre(`${texteEntete}.includes('Déconnexion')`);
  r.verifier('Personnel : accès dédié (Statistiques + Déconnexion)', await nav.evaluer(`${texteEntete}.includes('Statistiques')`), await nav.evaluer(texteEntete));
  await nav.capture(`${OUT}/b1-personnels.png`, false);

  await nav.aller(`${BASE}/stats`);
  await nav.attendre("!!document.querySelector('main h1')");
  r.verifier(
    'Rechargement : session conservée, /stats accessible à l’admin',
    !(await nav.evaluer("document.body.textContent.includes('Accès réservé')")),
    await nav.evaluer("document.querySelector('main h1').textContent"),
  );

  await nav.cliquerTexte('Déconnexion', 'header button');
  await nav.attendre("location.pathname === '/' && !localStorage.getItem('refreshToken')");
  r.verifier('Déconnexion → accueil et jetons effacés', true, await nav.evaluer(texteEntete));

  // ── Un élève n'entre pas par l'accès des personnels
  await nav.aller(`${BASE}/personnels`);
  await nav.attendre("!!document.querySelector('#identifiant')");
  await nav.saisir('#identifiant', 'DEMO-3E-0001');
  await nav.saisir('#password', 'Demo2026!');
  await nav.cliquer('button[type=submit]');
  await nav.attendre("!!document.querySelector('[role=alert]')");
  r.verifier('Élève refusé sur l’accès des personnels', true, await nav.evaluer("document.querySelector('[role=alert]').textContent"));
} catch (e) {
  r.verifier('Scénario interrompu', false, e.message);
} finally {
  if (nav.erreursConsole.length) console.log('Erreurs console :', nav.erreursConsole.slice(0, 5));
  console.log(`RÉSULTAT : ${r.bilan}`);
  await nav.fermer();
  process.exit(r.succes ? 0 : 1);
}
