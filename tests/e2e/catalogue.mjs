import { execSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { lancerNavigateur, rapporteur } from './cdp.mjs';

const BASE = process.env.FRONT_URL ?? 'http://localhost:3000';
const API = process.env.API_URL ?? 'http://localhost:8080/api';
const OUT = process.argv[2] ?? fileURLToPath(new URL('./captures', import.meta.url));
mkdirSync(OUT, { recursive: true });

const sql = (requete) =>
  execSync(`docker exec -i ${process.env.PG_CONTAINER ?? 'mo-postgres'} psql -U mo_user -d mon_orientation -q`, { input: requete });
const reinitialiser = () =>
  sql("delete from favoris where apprenant_nip like 'DEMO-%'; delete from preferences where apprenant_nip = 'DEMO-TLE-0001';");
const idDe = async (code) => (await (await fetch(`${API}/filiere?search=${code}`)).json()).items.find((f) => f.code === code).id;

const nav = await lancerNavigateur();
const r = rapporteur();
const contient = (t) => `document.body.textContent.includes(${JSON.stringify(t)})`;
const nbCartes = "document.querySelectorAll('main article').length";
const barre = "document.querySelector('[aria-label=\"Comparateur de formations\"]')";
const favorisDuTableauDeBord = "document.querySelectorAll('section[aria-labelledby=\"titre-favoris\"] ul li').length";
// En émulation mobile, un contenu trop large élargit la fenêtre (innerWidth > 390) : on compare à la largeur de l'écran
const sansDebordement = (largeur) => `innerWidth === ${largeur} && document.documentElement.scrollWidth <= ${largeur}`;
const js = JSON.stringify;

/** Clique le bouton (texte ou nom accessible) de la carte dont le texte contient `carte`. */
const cliquerDansCarte = (carte, bouton) =>
  nav.evaluer(`(() => {
    const c = [...document.querySelectorAll('main article')].find((a) => a.textContent.includes(${js(carte)}));
    if (!c) throw new Error('carte introuvable : ' + ${js(carte)});
    const b = [...c.querySelectorAll('button')].find((b) => b.textContent.includes(${js(bouton)}));
    if (!b) throw new Error('bouton introuvable : ' + ${js(bouton)});
    b.click();
    return true;
  })()`);
const etatDansCarte = (carte, bouton) =>
  `[...document.querySelectorAll('main article')].find((a) => a.textContent.includes(${js(carte)}))?.querySelector('button[aria-pressed]' + ${js(bouton === 'cœur' ? '[title]' : ':not([title])')})?.getAttribute('aria-pressed')`;

async function connecter(identifiant) {
  await nav.aller(`${BASE}/connexion`);
  await nav.attendre("!!document.querySelector('#identifiant')");
  await nav.saisir('#identifiant', identifiant);
  await nav.saisir('#password', 'Demo2026!');
  await nav.cliquer('button[type=submit]');
  await nav.attendre("location.pathname === '/espace-apprenant'");
}
async function deconnecter() {
  await nav.cliquerTexte('Déconnexion', 'header button');
  await nav.attendre("location.pathname === '/' && !localStorage.getItem('refreshToken')");
}

try {
  reinitialiser();
  await nav.taille(1280, 900);

  // ── Visiteur : recherche et filtres
  await nav.aller(`${BASE}/catalogue`);
  await nav.attendre(`${nbCartes} > 0 && ${contient('67 filière(s) trouvée(s)')}`);
  r.verifier(
    'Visiteur : 67 fiches, pas de cœur (réservé aux élèves)',
    await nav.evaluer("[...document.querySelectorAll('main article button')].every((b) => b.textContent.includes('Comparer'))"),
  );

  await nav.saisir('#recherche', 'electricite');
  await nav.attendre(`location.search.includes('q=electricite') && ${contient('Électricité et systèmes énergétiques')} && !${contient('67 filière(s)')}`);
  r.verifier('Recherche sans accent : « electricite » trouve le DTM Électricité', true, await nav.evaluer(`${nbCartes} + ' fiche(s)'`));

  await nav.cliquerTexte('Effacer les filtres', 'button');
  await nav.attendre(`${contient('67 filière(s) trouvée(s)')} && document.querySelector('#recherche').value === ''`);
  await nav.saisir('#filtre-domaine', 'NUMERIQUE');
  await nav.attendre(`location.search.includes('domaine=NUMERIQUE') && ${contient('7 filière(s) trouvée(s)')}`);
  r.verifier('Filtre domaine : Numérique (7)', await nav.evaluer(`${nbCartes} === 7`));
  await nav.cliquerTexte('Effacer les filtres', 'button');
  await nav.attendre(contient('67 filière(s) trouvée(s)'));
  await nav.cliquerTexte('Avec bourses', 'label');
  await nav.attendre(`location.search.includes('bourses=true') && ${contient('20 filière(s) trouvée(s)')}`);
  r.verifier('Filtre bourses (20)', true);

  // Lien partageable : les filtres sont dans l'adresse
  await nav.aller(`${BASE}/catalogue?serie=D`);
  await nav.attendre(`${contient('Formations du supérieur accessibles avec un bac D')} && ${nbCartes} > 0`);
  r.verifier(
    'Lien « ?serie=D » : médecine admise, droit sous conditions, pas de lettres',
    await nav.evaluer(
      `document.querySelector('#filtre-serie').value === 'D' && ${contient('Médecine générale')} && ${contient('Admise sous conditions')} && !${contient('Lettres, langues et philosophie')}`,
    ),
    await nav.evaluer(`${nbCartes} + ' fiches'`),
  );
  await nav.capture(`${OUT}/c1-catalogue-bac-d.png`, false);

  // ── Comparateur
  await cliquerDansCarte('Médecine générale', 'Comparer');
  await cliquerDansCarte('Pharmacie', 'Comparer');
  await nav.attendre(`${barre}?.textContent.includes('2 formations à comparer')`);
  r.verifier('Comparateur : 2 formations choisies, boutons enfoncés', await nav.evaluer(`${etatDansCarte('Médecine générale', 'comparer')} === 'true'`));
  await cliquerDansCarte('Chirurgie dentaire', 'Comparer');
  await cliquerDansCarte('Informatique — IFRI', 'Comparer');
  await nav.attendre(`${barre}?.textContent.includes('3 formations au maximum')`);
  r.verifier('Comparateur : 4e formation refusée (3 au maximum)', await nav.evaluer(`${barre}.textContent.includes('3 formations à comparer') && ${etatDansCarte('Informatique — IFRI', 'comparer')} === 'false'`));

  await nav.cliquerTexte('Comparer →', `[aria-label="Comparateur de formations"] a`);
  await nav.attendre("location.pathname === '/catalogue/comparer' && document.querySelectorAll('main thead th').length === 4");
  r.verifier('Tableau : 3 colonnes, 11 critères', await nav.evaluer("document.querySelectorAll('main tbody tr').length === 11"));
  r.verifier(
    'Partage WhatsApp : le message contient le lien de la comparaison',
    await nav.evaluer("new URL(document.querySelector('a[href^=\"https://wa.me/\"]').href).searchParams.get('text').includes(location.href)"),
  );
  await nav.capture(`${OUT}/c2-comparateur.png`);

  // La largeur émulée ne s'applique qu'au chargement suivant
  await nav.taille(390, 844, true);
  await nav.aller(await nav.evaluer('location.href'));
  await nav.attendre("document.querySelectorAll('main thead th').length === 4");
  r.verifier(
    'Comparateur mobile : le tableau défile, pas la page',
    await nav.evaluer(`${sansDebordement(390)} && (() => { const t = document.querySelector('main .overflow-x-auto'); return t.scrollWidth > t.clientWidth; })()`),
    await nav.evaluer("`page ${document.documentElement.scrollWidth}/${innerWidth}`"),
  );
  await nav.capture(`${OUT}/c3-comparateur-mobile.png`, false);
  await nav.taille(1280, 900);

  await nav.cliquerTexte('Retirer', 'main thead button');
  await nav.attendre("document.querySelectorAll('main thead th').length === 3 && location.search.split(',').length === 2");
  r.verifier('Retirer une colonne met à jour le lien', true);
  await nav.aller(`${BASE}/catalogue/comparer`);
  await nav.attendre("location.search.includes('ids=') && document.querySelectorAll('main thead th').length === 3");
  r.verifier('Sans lien : la sélection du catalogue est reprise', true);

  await nav.aller(`${BASE}/catalogue`);
  await nav.attendre(`${barre}?.textContent.includes('2 formations à comparer')`);
  await nav.cliquerTexte('Vider', '[aria-label="Comparateur de formations"] button');
  await nav.attendre(`!${barre}`);
  r.verifier('Vider la sélection masque la barre', true);

  // ── Fiche d'un bac : « Et après ? », partage, impression
  await nav.aller(`${BASE}/catalogue/${await idDe('BAC-D')}`);
  await nav.attendre("!!document.querySelector('#poursuites a')");
  r.verifier(
    'Fiche bac D : « Et après ce bac ? » avec médecine et droit sous conditions',
    await nav.evaluer(
      `${contient('Et après ce bac ?')} && [...document.querySelectorAll('#poursuites a')].some((a) => a.textContent.includes('Médecine générale')) && document.querySelector('#poursuites').textContent.includes('Sous conditions')`,
    ),
  );
  r.verifier(
    'Fiche : domaine cliquable, partage et impression proposés',
    await nav.evaluer(
      `!!document.querySelector('a[href="/catalogue?domaine=SCIENCES"]') && ${contient('WhatsApp')} && ${contient('Copier le lien')} && ${contient('Imprimer')} && !${contient('Mettre de côté')}`,
    ),
  );
  await nav.cliquerTexte('Copier le lien', 'button');
  await nav.attendre(`${contient('Lien copié')} || ${contient('Copie impossible')}`);
  r.verifier('Copier le lien : retour affiché', true, (await nav.evaluer(contient('Lien copié'))) ? 'copié' : 'copie refusée par le navigateur');
  await nav.capture(`${OUT}/c4-fiche-bac-d.png`);
  await nav.media('print');
  r.verifier(
    'Impression : en-tête, pied de page et boutons masqués',
    await nav.evaluer(
      "getComputedStyle(document.querySelector('header')).display === 'none' && getComputedStyle(document.querySelector('footer')).display === 'none' && getComputedStyle(document.querySelector('[aria-label=\"Partager\"]').parentElement).display === 'none'",
    ),
  );
  await nav.capture(`${OUT}/c5-fiche-impression.png`);
  await nav.media('');

  // ── Élève de Terminale D : formations mises de côté
  await connecter('DEMO-TLE-0001');
  await nav.attendre(contient('Aucune pour l’instant'));
  r.verifier('Koffi : aucune formation mise de côté au départ', true);

  await nav.aller(`${BASE}/catalogue`);
  await nav.attendre(`${contient('Que faire avec mon bac D ?')} && !!document.querySelector('main article button[title]:not([disabled])')`);
  await nav.cliquerTexte('Que faire avec mon bac D ?', 'button');
  await nav.attendre(`location.search.includes('serie=D') && ${contient('accessibles avec un bac D')} && ${contient('Médecine générale')}`);
  r.verifier('Raccourci « Que faire avec mon bac D ? »', true);
  await cliquerDansCarte('Médecine générale', 'Mettre de côté');
  await cliquerDansCarte('Informatique — IFRI', 'Mettre de côté');
  await nav.attendre(`${etatDansCarte('Médecine générale', 'cœur')} === 'true' && ${etatDansCarte('Informatique — IFRI', 'cœur')} === 'true'`);
  await nav.aller(`${BASE}/catalogue?q=${encodeURIComponent('série C')}`);
  await nav.attendre(`${contient('Baccalauréat série C')} && !!document.querySelector('main article button[title]:not([disabled])')`);
  await cliquerDansCarte('Baccalauréat série C', 'Mettre de côté');
  await nav.attendre(`${etatDansCarte('Baccalauréat série C', 'cœur')} === 'true'`);
  await nav.aller(`${BASE}/catalogue?serie=D`);
  await nav.attendre(`${etatDansCarte('Médecine générale', 'cœur')} === 'true'`);
  r.verifier('Cœurs enregistrés côté serveur (retrouvés après rechargement)', true);
  await nav.capture(`${OUT}/c6-catalogue-eleve.png`, false);

  await nav.aller(`${BASE}/espace-apprenant`);
  await nav.attendre(`${favorisDuTableauDeBord} === 3`);
  r.verifier('Tableau de bord : 3 formations mises de côté', true);

  await nav.aller(`${BASE}/espace-apprenant/preferences`);
  await nav.attendre(`${contient('Étape 1 sur 3')} && ${contient('Seulement mes formations mises de côté (2)')}`);
  r.verifier(
    'Vœux : mises de côté proposées en premier, la série C signalée hors niveau',
    await nav.evaluer(`document.querySelector('fieldset label').textContent.includes('Mise de côté') && ${contient('Une autre formation mise de côté ne se choisit pas après le bac')}`),
  );
  await nav.cliquerTexte('Seulement mes formations mises de côté', 'button');
  await nav.attendre("document.querySelectorAll('fieldset label').length === 2");
  r.verifier('Vœux : filtre « seulement mes formations mises de côté »', true);
  await nav.capture(`${OUT}/c7-voeux-favoris.png`, false);
  await nav.cliquerTexte('Seulement mes formations mises de côté', 'button');
  await nav.saisir('#recherche-voeu', 'medecin');
  await nav.attendre("[...document.querySelectorAll('fieldset label')].some((l) => l.textContent.includes('Médecine générale'))");
  await nav.saisir('#recherche-voeu', 'pharmacien');
  await nav.attendre("[...document.querySelectorAll('fieldset label')].some((l) => l.textContent.includes('Pharmacie'))");
  r.verifier('Vœux : recherche sans accent et par métier (« pharmacien » → Pharmacie)', true);

  await nav.aller(`${BASE}/catalogue/${await idDe('UNIV-FSS-MEDECINE')}`);
  await nav.attendre("document.querySelector('main button[aria-pressed][title]:not([disabled])')?.getAttribute('aria-pressed') === 'true'");
  await nav.cliquerTexte('Mettre de côté', 'main button');
  await nav.attendre("document.querySelector('main button[aria-pressed][title]').getAttribute('aria-pressed') === 'false'");
  await nav.aller(`${BASE}/espace-apprenant`);
  await nav.attendre(`${favorisDuTableauDeBord} === 2`);
  r.verifier('Retirée depuis la fiche : plus que 2 sur le tableau de bord', true);
  await deconnecter();

  // ── Parent : consultation
  await connecter('parent.demo@monorientation.bj');
  await nav.attendre(contient("Fatou n'a pas encore mis de formation de côté"));
  r.verifier('Parent : section « Formations mises de côté » de Fatou', true);
  await deconnecter();

  // ── Mobile
  await nav.taille(390, 844, true);
  await nav.aller(`${BASE}/catalogue?serie=D`);
  await nav.attendre(`${nbCartes} > 0`);
  r.verifier(
    'Catalogue mobile sans débordement horizontal',
    await nav.evaluer(sansDebordement(390)),
    await nav.evaluer("`page ${document.documentElement.scrollWidth}/${innerWidth}`"),
  );
  await nav.capture(`${OUT}/c8-catalogue-mobile.png`, false);

  r.verifier('Aucune erreur d’hydratation', !nav.erreursConsole.some((e) => /hydrat|did not match/i.test(e)));
} catch (e) {
  r.verifier('Scénario interrompu', false, e.message);
  await nav.capture(`${OUT}/c-echec.png`).catch(() => {});
} finally {
  reinitialiser();
  if (nav.erreursConsole.length) console.log('Erreurs console :', nav.erreursConsole.slice(0, 6));
  console.log(`RÉSULTAT : ${r.bilan}`);
  await nav.fermer();
  process.exit(r.succes ? 0 : 1);
}
