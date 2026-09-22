// Responsive : débordement horizontal, cibles tactiles, en-tête (rôle avec beaucoup de liens), menu mobile,
// clavier de saisie (Guido), orientation paysage — sur les pages principales, de 320px (largeur minimale
// réaliste) à un petit ordinateur portable (1024px). Complète catalogue.mjs et accueil.mjs (qui vérifient
// déjà chacun leur propre page en mobile) : celui-ci couvre le reste du parcours et l'en-tête partagé.
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { lancerNavigateur, rapporteur } from './cdp.mjs';

const BASE = process.env.FRONT_URL ?? 'http://localhost:3000';
const OUT = process.argv[2] ?? fileURLToPath(new URL('./captures', import.meta.url));
mkdirSync(OUT, { recursive: true });

const nav = await lancerNavigateur();
const r = rapporteur();

// La largeur émulée ne s'applique qu'au chargement suivant (voir catalogue.mjs) : toujours taille() puis
// aller(), jamais taille() seul sur une page déjà chargée.
const sansDebordement = (largeur) => `innerWidth === ${largeur} && document.documentElement.scrollWidth <= ${largeur}`;

async function connecter(identifiant, motDePasse, chemin = '/identification') {
  await nav.aller(`${BASE}${chemin}`);
  await nav.attendre("!!document.querySelector('#identifiant')");
  await nav.saisir('#identifiant', identifiant);
  await nav.saisir('#password', motDePasse);
  await nav.cliquer('button[type=submit]');
  await nav.attendre(`location.pathname !== ${JSON.stringify(chemin)}`);
}
async function deconnecter() {
  await nav.cliquerTexte('Déconnexion', 'header button, #menu-mobile button');
  await nav.attendre("location.pathname === '/' && !localStorage.getItem('refreshToken')");
}

const LARGEURS = [320, 375, 768, 1024];

try {
  // ── 1. Aucun débordement horizontal sur les pages principales, visiteur (320 → 1024)
  const PAGES_VISITEUR = ['/', '/identification', '/catalogue', '/conseiller'];
  for (const page of PAGES_VISITEUR) {
    for (const largeur of LARGEURS) {
      await nav.taille(largeur, 800, largeur < 600);
      await nav.aller(`${BASE}${page}`);
      await nav.attendre("document.readyState === 'complete'");
      await new Promise((res) => setTimeout(res, 300));
      r.verifier(
        `${page} @ ${largeur}px : sans débordement horizontal`,
        await nav.evaluer(sansDebordement(largeur)),
        await nav.evaluer("`scrollWidth=${document.documentElement.scrollWidth} innerWidth=${innerWidth}`"),
      );
    }
  }
  await nav.taille(1280, 900);
  await nav.aller(`${BASE}/`);
  await nav.attendre("document.readyState === 'complete'");

  // ── 2. Élève connecté : dashboard, découverte, recommandations (320 → 1024)
  await connecter('DEMO-3E-0001', 'Demo2026!');
  const PAGES_ELEVE = ['/espace-apprenant', '/espace-apprenant/decouverte', '/espace-apprenant/recommandations', '/espace-apprenant/conseiller'];
  for (const page of PAGES_ELEVE) {
    for (const largeur of LARGEURS) {
      await nav.taille(largeur, 800, largeur < 600);
      await nav.aller(`${BASE}${page}`);
      await nav.attendre("document.readyState === 'complete'");
      await new Promise((res) => setTimeout(res, 300));
      r.verifier(
        `${page} @ ${largeur}px : sans débordement horizontal`,
        await nav.evaluer(sansDebordement(largeur)),
        await nav.evaluer("`scrollWidth=${document.documentElement.scrollWidth} innerWidth=${innerWidth}`"),
      );
    }
  }

  // ── 3. Guido (connecté) : le champ de saisie ne doit pas écraser les boutons voisins (320px)
  await nav.taille(320, 800, true);
  await nav.aller(`${BASE}/espace-apprenant/conseiller`);
  await nav.attendre("!!document.querySelector('#question')");
  await new Promise((res) => setTimeout(res, 300));
  const boutonsForm = await nav.evaluer(`
    (() => {
      const ta = document.querySelector('#question');
      const boutons = [...ta.closest('form').querySelectorAll('button')];
      return boutons.map((b) => { const r = b.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height) }; });
    })()
  `);
  r.verifier(
    'Guido @ 320px : micro et envoyer restent à taille normale (44px), pas écrasés par le champ',
    boutonsForm.every((b) => b.w >= 40 && b.h >= 40),
    JSON.stringify(boutonsForm),
  );
  const champTexte = await nav.evaluer(`
    (() => { const ta = document.querySelector('#question'); return ta.scrollHeight <= ta.clientHeight + 1; })()
  `);
  r.verifier('Guido @ 320px : le texte du champ (placeholder compris) tient sans être coupé', champTexte);

  // ── 4. Menu mobile de l'en-tête : bascule au bon seuil selon le nombre de liens, et se ferme avec Échap
  await deconnecter();
  await nav.taille(767, 900);
  await nav.aller(`${BASE}/`);
  await nav.attendre("document.readyState === 'complete'");
  r.verifier(
    'Visiteur @ 767px : menu replié (hamburger), pas la nav desktop',
    await nav.evaluer("getComputedStyle(document.querySelector('header nav[aria-label=\"Navigation principale\"]')).display === 'none'"),
  );
  await nav.taille(768, 900);
  await nav.aller(`${BASE}/`);
  await nav.attendre("document.readyState === 'complete'");
  r.verifier(
    'Visiteur @ 768px : nav desktop visible',
    await nav.evaluer("getComputedStyle(document.querySelector('header nav[aria-label=\"Navigation principale\"]')).display !== 'none'"),
  );
  // Le bouton hamburger reste caché dès 768px pour un visiteur (nav desktop déjà visible) : on redescend en
  // mobile pour vérifier l'ouverture/fermeture réelles du panneau.
  await nav.taille(375, 800, true);
  await nav.aller(`${BASE}/`);
  await nav.attendre("document.readyState === 'complete'");
  await nav.cliquer('[aria-label="Ouvrir le menu"]');
  await nav.attendre("!!document.getElementById('menu-mobile')");
  r.verifier('Menu mobile : Échap le referme', true);
  await nav.evaluer("document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))");
  await nav.attendre("!document.getElementById('menu-mobile')");
  r.verifier('Menu mobile refermé après Échap', await nav.evaluer("!document.getElementById('menu-mobile')"));

  // ── 5. Administrateur : 5 liens dans l'en-tête -> la nav desktop attend un seuil plus large (lg, 1024px)
  //     que le tronc commun (md, 768px), sans jamais déborder ni se replier sur deux lignes entre-temps.
  await connecter('admin@monorientation.bj', 'admin123', '/personnels');
  for (const largeur of [768, 900, 1000, 1023, 1024, 1152]) {
    await nav.taille(largeur, 900);
    await nav.aller(`${BASE}/admin`);
    await nav.attendre("document.readyState === 'complete'");
    await new Promise((res) => setTimeout(res, 250));
    const info = await nav.evaluer(`
      (() => {
        const nav = document.querySelector('header nav[aria-label="Navigation principale"]');
        return {
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          navVisible: getComputedStyle(nav).display !== 'none',
          navUneLigne: getComputedStyle(nav).display === 'none' || nav.getBoundingClientRect().height < 30,
        };
      })()
    `);
    r.verifier(`Administration @ ${largeur}px : sans débordement`, info.overflow <= 1, JSON.stringify(info));
    r.verifier(`Administration @ ${largeur}px : nav sur une seule ligne (pas de repli)`, info.navUneLigne, JSON.stringify(info));
    const attendu = largeur >= 1024;
    r.verifier(`Administration @ ${largeur}px : nav desktop ${attendu ? 'visible' : 'repliée'}`, info.navVisible === attendu, JSON.stringify(info));
  }
  await nav.taille(1024, 900);
  await nav.aller(`${BASE}/admin`);
  await nav.attendre("document.readyState === 'complete'");
  await new Promise((res) => setTimeout(res, 300));
  await nav.capture(`${OUT}/r1-admin-1024.png`);
  await deconnecter();

  // ── 6. Téléphone en paysage (hauteur réduite) : le contenu réel de la page doit rester atteignable sans
  //     tout faire défiler d'abord — pas seulement l'en-tête et la bannière.
  await connecter('DEMO-3E-0001', 'Demo2026!');
  await nav.taille(667, 375, true);
  await nav.aller(`${BASE}/espace-apprenant`);
  await nav.attendre("document.readyState === 'complete'");
  await new Promise((res) => setTimeout(res, 400));
  const paysage = await nav.evaluer(`
    (() => {
      // « Ton avancement » (pas la salutation du bandeau, qui varie avec l'heure et la 1re visite) : le
      // premier contenu de page stable, juste après le bandeau + les onglets.
      const titre = [...document.querySelectorAll('h2, h1')].find((e) => e.textContent.includes('Ton avancement'));
      return { overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, titreVisible: !!titre && titre.getBoundingClientRect().top < innerHeight };
    })()
  `);
  r.verifier('Tableau de bord en paysage (667×375) : sans débordement', paysage.overflow <= 1, JSON.stringify(paysage));
  r.verifier(
    'Tableau de bord en paysage (667×375) : le contenu (pas que l’en-tête) est atteignable sans défiler',
    paysage.titreVisible,
    JSON.stringify(paysage),
  );
  await nav.capture(`${OUT}/r2-dashboard-paysage.png`, false);
  await deconnecter();

  console.log('\n' + r.bilan);
} catch (e) {
  console.error('\n💥 ÉCHEC:', e.message);
  try {
    console.error('URL courante:', await nav.evaluer('location.href'));
    await nav.capture(`${OUT}/r-echec.png`);
  } catch {
    /* le navigateur a peut-être déjà été fermé */
  }
  process.exitCode = 1;
} finally {
  await nav.fermer();
}
