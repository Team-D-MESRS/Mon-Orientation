import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { lancerNavigateur, rapporteur } from './cdp.mjs';

const BASE = process.env.FRONT_URL ?? 'http://localhost:3000';
const BASE_URL_CAPTURES = new URL('./captures', import.meta.url);
const OUT = process.argv[2] ?? fileURLToPath(BASE_URL_CAPTURES);
mkdirSync(OUT, { recursive: true });
const nav = await lancerNavigateur();
const r = rapporteur();
const texte = (sel) => `(document.querySelector(${JSON.stringify(sel)})?.textContent ?? '')`;
const contient = (t) => `document.body.textContent.includes(${JSON.stringify(t)})`;

// Mot de passe par défaut : celui des comptes de démonstration déjà créés (Fatou, Koffi, parent, DGES).
// Adama n'a pas encore de compte après une réinitialisation : sa 1re identification prend sa date de
// naissance comme mot de passe fictif, qui devient ensuite son mot de passe réel.
async function connecter(identifiant, cible, motDePasse = 'Demo2026!') {
  await nav.aller(`${BASE}/identification`);
  await nav.attendre("!!document.querySelector('#identifiant')");
  await nav.saisir('#identifiant', identifiant);
  await nav.saisir('#password', motDePasse);
  await nav.cliquer('button[type=submit]');
  await nav.attendre(`location.pathname === ${JSON.stringify(cible)}`);
}
async function deconnecter() {
  await nav.cliquerTexte('Déconnexion', 'header button');
  await nav.attendre("location.pathname === '/' && !localStorage.getItem('refreshToken')");
}
async function choisirVoeu(recherche, libelle) {
  await nav.attendre("!!document.querySelector('#recherche-voeu')");
  await nav.saisir('#recherche-voeu', recherche);
  await nav.attendre(`[...document.querySelectorAll('fieldset label')].some((l) => l.textContent.includes(${JSON.stringify(libelle)}))`);
  await nav.cliquerTexte(libelle, 'fieldset label');
  await nav.cliquerTexte('Enregistrer et continuer', 'button');
}
// Dernière étape en 3e (fiche unique d'inscription) : un établissement, pas un 3e choix de spécialité — pas de recherche.
async function choisirEtablissement(libelle) {
  await nav.attendre(`[...document.querySelectorAll('fieldset label')].some((l) => l.textContent.includes(${JSON.stringify(libelle)}))`);
  await nav.cliquerTexte(libelle, 'fieldset label');
  await nav.cliquerTexte('Enregistrer et continuer', 'button');
}
// Test RIASEC (18 questions par étape) : répond à la même valeur (1 à 5) pour toutes les questions
// visibles sur l'étape courante, pour ne pas dépendre du texte exact de chaque question.
async function repondreQuestionsVisibles(valeur) {
  await nav.evaluer(`(() => {
    document.querySelectorAll('[data-id-question]').forEach((groupe) => {
      const bouton = [...groupe.querySelectorAll('button[aria-label]')].find((b) => b.getAttribute('aria-label').startsWith(${JSON.stringify(String(valeur))}));
      if (bouton) bouton.click();
    });
    return true;
  })()`);
}

try {
  await nav.taille(1280, 900);

  // Élève de 3e : tableau de bord
  await connecter('DEMO-3E-0001', '/espace-apprenant');
  await nav.attendre(contient('Moyenne générale'));
  r.verifier('Fatou : tableau de bord', await nav.evaluer(`${texte('main h1')} === 'Mon espace' && ${contient('Dossier de démonstration')} && ${contient('13,2')}`), await nav.evaluer(`${texte('main h1 + p')}`));
  // Identité, classe, département et NIP dans l'en-tête uniquement (plus de carte « Profil » qui les répétait)
  r.verifier(
    'En-tête avec le département, NIP affiché une seule fois',
    await nav.evaluer(`${texte('main h1 + p')}.includes('Littoral') && document.querySelector('main').textContent.split('DEMO-3E-0001').length === 2`),
  );
  await nav.attendre(contient('Saisir mes vœux'));
  r.verifier('Invitation à saisir ses vœux', true);
  await nav.capture(`${OUT}/b2-tableau-de-bord.png`);

  // Saisie des vœux en 3 étapes : 2 choix de spécialité classés + 1 établissement (fiche unique d'inscription)
  await nav.aller(`${BASE}/espace-apprenant/preferences`);
  await nav.attendre(contient('Étape 1 sur 3'));
  await nav.capture(`${OUT}/b2-voeux-etape1.png`, false);
  // Vœux techniques : les bacs généraux sont masqués du catalogue et ne sont plus proposés en 3e
  await choisirVoeu('série F3', 'Baccalauréat série F3');
  await nav.attendre(contient('Étape 2 sur 3'));
  await choisirVoeu('série G2', 'Baccalauréat série G2');
  await nav.attendre(contient('Étape 3 sur 3'));
  r.verifier("Dernière étape : choix d'un établissement, pas un 3e choix de spécialité", await nav.evaluer(contient('Ton établissement')));
  // LTP Coulibaly (Cotonou) dispense F3 et G2 : les deux spécialités choisies
  await choisirEtablissement('LTP Coulibaly');
  await nav.attendre(contient('Tes vœux pour la 3e'));
  r.verifier(
    'Vœux : récapitulatif des 2 choix et de l’établissement',
    await nav.evaluer(`document.querySelectorAll('main ol > li').length === 2 && ${contient('Baccalauréat série F3')} && ${contient('LTP Coulibaly')}`),
  );
  await nav.saisir('#motivation', "J'aime les mathématiques et la physique.");
  await nav.cliquerTexte('Enregistrer mes vœux', 'button');
  await nav.attendre(contient('Vœux enregistrés'));
  r.verifier('Vœux enregistrés, en attente du parent', await nav.evaluer(contient('en attente de validation')));
  await nav.capture(`${OUT}/b2-voeux-recap.png`);

  // Recommandations
  await nav.aller(`${BASE}/espace-apprenant/recommandations`);
  await nav.attendre("document.querySelectorAll('main ol > li').length > 0");
  r.verifier('Recommandations : 1er choix repéré et expliqué', await nav.evaluer(`${contient('Ton 1er choix')} && ${contient('matières clés')}`), `${await nav.evaluer("document.querySelectorAll('main ol > li').length")} pistes`);
  await nav.capture(`${OUT}/b2-recommandations.png`);

  // Mobile : notes et recommandations
  await nav.taille(390, 844, true);
  await nav.aller(`${BASE}/espace-apprenant/notes`);
  await nav.attendre("document.querySelectorAll('tbody tr').length > 0");
  // En émulation mobile, un contenu trop large élargit la fenêtre (innerWidth > 390) : on compare à la largeur de l'écran
  r.verifier('Notes : 7 matières, sans débordement horizontal de la page', await nav.evaluer("document.querySelectorAll('tbody tr').length === 7 && innerWidth === 390 && document.documentElement.scrollWidth <= 390"), await nav.evaluer("`scrollWidth ${document.documentElement.scrollWidth} / ${innerWidth}`"));
  await nav.capture(`${OUT}/b2-notes-mobile.png`);
  await nav.aller(`${BASE}/espace-apprenant/recommandations`);
  await nav.attendre("document.querySelectorAll('main ol > li').length > 0");
  r.verifier('Recommandations mobile sans débordement', await nav.evaluer('innerWidth === 390 && document.documentElement.scrollWidth <= 390'), await nav.evaluer("`scrollWidth ${document.documentElement.scrollWidth} / ${innerWidth}`"));
  await nav.capture(`${OUT}/b2-recommandations-mobile.png`);
  await nav.taille(1280, 900);
  await deconnecter();

  // Parent : validation
  await connecter('parent.demo@monorientation.bj', '/espace-apprenant');
  await nav.attendre(`${contient('Suivi de Fatou')} && ${contient('attendent ta validation')}`);
  r.verifier('Parent : suivi de Fatou, vœux à valider', true);
  await nav.aller(`${BASE}/espace-apprenant/preferences`);
  await nav.attendre(contient('Valider les vœux de Fatou'));
  await nav.cliquerTexte('Valider les vœux de Fatou', 'button');
  await nav.attendre(contient('Vœux validés le'));
  r.verifier('Parent : vœux validés', true);
  await nav.capture(`${OUT}/b2-parent-validation.png`);
  await deconnecter();

  // Terminale D : pistes du supérieur
  await connecter('DEMO-TLE-0001', '/espace-apprenant');
  await nav.aller(`${BASE}/espace-apprenant/recommandations`);
  await nav.attendre("document.querySelectorAll('main ol > li').length > 0");
  r.verifier('Koffi (Tle D) : pistes du supérieur compatibles avec sa série', await nav.evaluer(`${contient('Ta série (D) est admise')} && !${contient('ne fait pas partie des séries admises')}`), await nav.evaluer("[...document.querySelectorAll('main ol > li h3')].map((h) => h.textContent).join(' | ')"));
  await nav.capture(`${OUT}/b2-terminale.png`);
  await deconnecter();

  // Adama (4e) : questionnaire de découverte, du blocage à sa levée. Sans compte après une
  // réinitialisation : sa 1re identification prend sa date de naissance comme mot de passe (comme
  // dans tests/reinitialiser-demo.sh et le seed de démonstration). Le mur redirige dès la connexion,
  // avant même le tableau de bord — et bloque aussi le catalogue, pas seulement les recommandations
  // (décisions du 18/09 : le test devient le point d'entrée central du parcours).
  await connecter('DEMO-4E-0001', '/espace-apprenant/decouverte', '2012-07-08');
  await nav.attendre(contient('Étape 1 sur 5'));
  r.verifier("Mur dès la connexion : arrivée directe sur le questionnaire, pas le tableau de bord", true);
  await nav.capture(`${OUT}/b2-decouverte-bloque.png`, false);

  await nav.aller(`${BASE}/catalogue`);
  await nav.attendre("location.pathname === '/espace-apprenant/decouverte'");
  r.verifier('Le mur bloque aussi le catalogue tant que le questionnaire n’est pas rempli', true);
  await nav.attendre(contient('Étape 1 sur 5'));
  await nav.capture(`${OUT}/b2-decouverte-etape1.png`, false);

  // Étapes 1 et 2 : test RIASEC (18 questions chacune), répondu à « 4 - Assez » partout
  await repondreQuestionsVisibles(4);
  await nav.cliquerTexte('Suivant', 'button');
  await nav.attendre(contient('Étape 2 sur 5'));
  await repondreQuestionsVisibles(4);
  await nav.cliquerTexte('Suivant', 'button');
  await nav.attendre(contient('Étape 3 sur 5'));

  // Étape 3 : métier envisagé, le reste aux valeurs par défaut
  await nav.saisir('#metier-envisage', 'Mécanicien automobile');
  await nav.cliquerTexte('Suivant', 'button');
  await nav.attendre(contient('Étape 4 sur 5'));

  await nav.cliquerTexte('Suivant', 'button');
  await nav.attendre(contient('Étape 5 sur 5'));

  await nav.cliquerTexte('Enregistrer mes réponses', 'button');
  await nav.attendre(contient('Réponses enregistrées'));
  r.verifier('Questionnaire de découverte enregistré', true);
  await nav.capture(`${OUT}/b2-decouverte-enregistre.png`, false);

  await nav.cliquerTexte('Voir mes pistes', 'a');
  await nav.attendre("location.pathname === '/espace-apprenant/recommandations' && document.querySelectorAll('main ol > li').length > 0");
  r.verifier(
    'Pistes débloquées après le questionnaire : le critère intérêt a des données, plus jamais l’invitation à le remplir',
    await nav.evaluer(`!${contient('Remplis le questionnaire de découverte')}`),
    await nav.evaluer("[...document.querySelectorAll('main ol > li h3')].map((h) => h.textContent).join(' | ')"),
  );
  await nav.capture(`${OUT}/b2-decouverte-pistes.png`);
  await deconnecter();
} catch (e) {
  r.verifier('Scénario interrompu', false, e.message);
  await nav.capture(`${OUT}/b2-echec.png`).catch(() => {});
} finally {
  if (nav.erreursConsole.length) console.log('Erreurs console :', nav.erreursConsole.slice(0, 6));
  console.log(`RÉSULTAT : ${r.bilan}`);
  await nav.fermer();
  process.exit(r.succes ? 0 : 1);
}
