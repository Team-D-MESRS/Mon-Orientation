import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { lancerNavigateur, rapporteur } from './cdp.mjs';

const BASE = process.env.FRONT_URL ?? 'http://localhost:3000';
const OUT = process.argv[2] ?? fileURLToPath(new URL('./captures', import.meta.url));
mkdirSync(OUT, { recursive: true });

const PAGES = [
  ['/guide', "Guide d'utilisation"],
  ['/faq', 'Questions fréquentes'],
  ['/contact', 'Contact'],
  ['/mentions-legales', 'Mentions légales'],
  ['/donnees-personnelles', 'Données personnelles'],
  ['/accessibilite', 'Accessibilité'],
];
const statut = async (chemin) => (await fetch(`${BASE}${chemin}`)).status;

const nav = await lancerNavigateur();
const r = rapporteur();
const contient = (t) => `document.body.textContent.includes(${JSON.stringify(t)})`;
const liensDuPied = "[...document.querySelectorAll('footer a')].map((a) => a.getAttribute('href'))";
// Pied de page en bas : il termine la page, et la page occupe au moins toute la hauteur de l'écran
const piedEnBas = `(() => {
  const bas = document.querySelector('footer').getBoundingClientRect().bottom + scrollY;
  return Math.abs(bas - Math.max(document.documentElement.scrollHeight, innerHeight)) <= 1;
})()`;
// Hauteur réelle du contenu : main s'étire (flex-1), on additionne donc ses enfants
const hauteurs = `(() => {
  const contenu = [...document.querySelector('main').children].reduce((s, e) => s + e.offsetHeight, 0);
  return { contenu, entete: document.querySelector('header').offsetHeight, pied: document.querySelector('footer').offsetHeight, ecran: innerHeight };
})()`;
const pageCourte = `(() => { const h = ${hauteurs}; return h.contenu + h.entete + h.pied < h.ecran; })()`;

try {
  // ── Routes
  for (const [chemin] of PAGES) r.verifier(`${chemin} répond`, (await statut(chemin)) === 200);
  r.verifier('Page inconnue : 404', (await statut('/page-inexistante')) === 404);

  // ── Pied de page d'un visiteur
  await nav.taille(1280, 900);
  await nav.aller(`${BASE}/`);
  await nav.attendre("!!document.querySelector('footer nav')");
  r.verifier('Aucun lien mort (href="#") sur la page', await nav.evaluer(`document.querySelectorAll('a[href="#"]').length === 0`));
  const internes = (await nav.evaluer(liensDuPied)).filter((h) => h.startsWith('/'));
  const statuts = await Promise.all(internes.map(async (h) => [h, await statut(h)]));
  r.verifier(
    `Les ${internes.length} liens internes du pied de page répondent`,
    statuts.every(([, s]) => s === 200),
    statuts.filter(([, s]) => s !== 200).map(([h, s]) => `${h} → ${s}`).join(', '),
  );
  r.verifier(
    'Liens externes : nouvel onglet, sans accès à la page d’origine',
    await nav.evaluer(
      "[...document.querySelectorAll('footer a[href^=\"http\"]')].every((a) => a.target === '_blank' && a.rel.includes('noopener')) && document.querySelectorAll('footer a[href^=\"http\"]').length === 4",
    ),
  );
  r.verifier(
    'Visiteur : pas de lien Statistiques (en-tête et pied de page)',
    await nav.evaluer("![...document.querySelectorAll('header a, footer a')].some((a) => a.textContent.includes('Statistiques'))"),
  );
  r.verifier('Pied de page en bas de l’accueil', await nav.evaluer(piedEnBas));

  // ── Pages d'information
  await nav.taille(1280, 1800);
  for (const [chemin, titre] of PAGES) {
    await nav.aller(`${BASE}${chemin}`);
    await nav.attendre(`document.querySelector('main h1')?.textContent === ${JSON.stringify(titre)}`);
    const ok = await nav.evaluer(
      `document.querySelector('nav[aria-label="Pages d\\'information"] a[aria-current="page"]')?.getAttribute('href') === ${JSON.stringify(chemin)} && ${piedEnBas}`,
    );
    r.verifier(`${titre} : titre, onglet actif, pied de page en bas`, ok, (await nav.evaluer(pageCourte)) ? 'page courte' : 'page longue');
  }
  await nav.aller(`${BASE}/contact`);
  await nav.attendre(contient('Contacter l'));
  r.verifier('Contact : coordonnées manquantes signalées, pas inventées', await nav.evaluer(contient('à communiquer par le Ministère')));
  await nav.capture(`${OUT}/p1-contact.png`, false);

  await nav.aller(`${BASE}/page-inexistante`);
  await nav.attendre(contient('Page introuvable'));
  r.verifier(
    '404 en français, pied de page en bas d’une page courte',
    await nav.evaluer(`${pageCourte} && ${piedEnBas}`),
    JSON.stringify(await nav.evaluer(`(() => ({ ...${hauteurs}, piedBas: Math.round(document.querySelector('footer').getBoundingClientRect().bottom) }))()`)),
  );
  await nav.capture(`${OUT}/p2-404.png`, false);

  await nav.taille(1280, 900);
  await nav.aller(`${BASE}/faq`);
  await nav.attendre("!!document.querySelector('details summary')");
  await nav.cliquer('details summary');
  await nav.attendre("document.querySelector('details').open");
  r.verifier('FAQ : une question se déplie', true);
  await nav.capture(`${OUT}/p3-faq.png`, false);

  // ── DGES : lien Statistiques
  await nav.aller(`${BASE}/connexion`);
  await nav.attendre("!!document.querySelector('#identifiant')");
  await nav.saisir('#identifiant', 'dges.demo@monorientation.bj');
  await nav.saisir('#password', 'Demo2026!');
  await nav.cliquer('button[type=submit]');
  await nav.attendre("location.pathname === '/stats'");
  await nav.attendre("[...document.querySelectorAll('footer a')].some((a) => a.textContent.includes('Statistiques'))");
  r.verifier('DGES : lien Statistiques dans le pied de page', true);
  await nav.cliquerTexte('Déconnexion', 'header button');
  await nav.attendre("location.pathname === '/' && !localStorage.getItem('refreshToken')");

  // ── Mobile
  await nav.taille(390, 844, true);
  const debordements = [];
  for (const [chemin] of [...PAGES, ['/'], ['/page-inexistante']]) {
    await nav.aller(`${BASE}${chemin}`);
    await nav.attendre("!!document.querySelector('footer nav')");
    if (!(await nav.evaluer('innerWidth === 390 && document.documentElement.scrollWidth <= 390'))) debordements.push(chemin);
  }
  r.verifier('Mobile : aucune de ces pages ne déborde', debordements.length === 0, debordements.join(', '));
  await nav.aller(`${BASE}/guide`);
  await nav.attendre("!!document.querySelector('main h1')");
  await nav.capture(`${OUT}/p4-guide-mobile.png`, false);
} catch (e) {
  r.verifier('Scénario interrompu', false, e.message);
  await nav.capture(`${OUT}/p-echec.png`).catch(() => {});
} finally {
  if (nav.erreursConsole.length) console.log('Erreurs console :', nav.erreursConsole.slice(0, 6));
  console.log(`RÉSULTAT : ${r.bilan}`);
  await nav.fermer();
  process.exit(r.succes ? 0 : 1);
}
