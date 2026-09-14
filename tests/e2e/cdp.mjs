// Pilotage minimal de Chrome headless via le protocole DevTools (WebSocket natif de Node 22), sans dépendance.
// Navigateur : variable CHROME (par défaut /usr/bin/google-chrome).
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const PORT = 9333;
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

export async function lancerNavigateur() {
  const dossierProfil = mkdtempSync(join(tmpdir(), 'mo-e2e-'));
  const chrome = spawn(process.env.CHROME ?? '/usr/bin/google-chrome', ['--headless=new', '--disable-gpu', '--no-sandbox', '--no-first-run', `--remote-debugging-port=${PORT}`, `--user-data-dir=${dossierProfil}`, 'about:blank'], { stdio: 'ignore' });
  let cibles = [];
  for (let i = 0; i < 60 && !cibles.find((c) => c.type === 'page'); i++) {
    try { cibles = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); } catch { /* pas encore prêt */ }
    await pause(200);
  }
  const ws = new WebSocket(cibles.find((c) => c.type === 'page').webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });

  let id = 0;
  const attente = new Map();
  const erreursConsole = [];
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && attente.has(msg.id)) {
      const { res, rej } = attente.get(msg.id);
      attente.delete(msg.id);
      msg.error ? rej(new Error(msg.error.message)) : res(msg.result);
    } else if (msg.method === 'Runtime.exceptionThrown') {
      erreursConsole.push(msg.params.exceptionDetails.exception?.description ?? msg.params.exceptionDetails.text);
    } else if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      erreursConsole.push(msg.params.args.map((a) => a.value ?? a.description).join(' ').slice(0, 300));
    }
  };
  const envoyer = (method, params = {}) => new Promise((res, rej) => { const i = ++id; attente.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
  await envoyer('Page.enable');
  await envoyer('Runtime.enable');

  const evaluer = async (expression) => {
    const r = await envoyer('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text);
    return r.result.value;
  };
  const attendre = async (expression, ms = 30000) => {
    const fin = Date.now() + ms;
    while (Date.now() < fin) {
      try { if (await evaluer(expression)) return true; } catch { /* page en cours de chargement */ }
      await pause(250);
    }
    throw new Error(`délai dépassé : ${expression}`);
  };

  return {
    evaluer, attendre, erreursConsole,
    async taille(largeur, hauteur, mobile = false) {
      await envoyer('Emulation.setDeviceMetricsOverride', { width: largeur, height: hauteur, deviceScaleFactor: 1, mobile });
    },
    /**
     * Média CSS émulé : 'print' pour vérifier l'impression, '' pour revenir à l'écran ; préférences système
     * éventuelles, ex. [{ name: 'prefers-reduced-motion', value: 'reduce' }]
     */
    async media(type, preferences = []) {
      await envoyer('Emulation.setEmulatedMedia', { media: type, features: preferences });
    },
    async aller(url) {
      await envoyer('Page.navigate', { url });
      await pause(300);
      await attendre("document.readyState === 'complete'");
    },
    async saisir(selecteur, valeur) {
      await evaluer(`(() => {
        const el = document.querySelector(${JSON.stringify(selecteur)});
        if (!el) throw new Error('introuvable : ' + ${JSON.stringify(selecteur)});
        const proto = el instanceof HTMLSelectElement ? HTMLSelectElement.prototype : el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
        Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, ${JSON.stringify(valeur)});
        el.dispatchEvent(new Event(el instanceof HTMLSelectElement ? 'change' : 'input', { bubbles: true }));
        return true;
      })()`);
    },
    async cliquer(selecteur) {
      await evaluer(`(() => { const el = document.querySelector(${JSON.stringify(selecteur)}); if (!el) throw new Error('introuvable : ' + ${JSON.stringify(selecteur)}); el.click(); return true; })()`);
    },
    async cliquerTexte(texte, selecteur = 'button, a, label') {
      await evaluer(`(() => { const el = [...document.querySelectorAll(${JSON.stringify(selecteur)})].find((e) => e.textContent.includes(${JSON.stringify(texte)})); if (!el) throw new Error('texte introuvable : ' + ${JSON.stringify(texte)}); el.click(); return true; })()`);
    },
    async capture(fichier, pleinePage = true) {
      const params = { format: 'png' };
      if (pleinePage) {
        const { cssContentSize, cssLayoutViewport } = await envoyer('Page.getLayoutMetrics');
        params.captureBeyondViewport = true;
        params.clip = { x: 0, y: 0, width: cssLayoutViewport.clientWidth, height: Math.min(cssContentSize.height, 5000), scale: 1 };
      }
      const { data } = await envoyer('Page.captureScreenshot', params);
      writeFileSync(fichier, Buffer.from(data, 'base64'));
    },
    async fermer() {
      ws.close();
      const arret = new Promise((r) => chrome.once('exit', r));
      chrome.kill();
      await arret;
      // Chrome peut encore écrire dans son profil juste après l'arrêt : un échec de nettoyage n'est pas une erreur de test
      try { rmSync(dossierProfil, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }); } catch { /* dossier temporaire */ }
    },
  };
}

export function rapporteur() {
  const resultats = [];
  return {
    verifier(nom, ok, detail = '') { resultats.push(ok); console.log(`${ok ? '✔' : '✘'} ${nom}${detail ? ' — ' + detail : ''}`); },
    get succes() { return resultats.every(Boolean); },
    get bilan() { return `${resultats.filter(Boolean).length} OK / ${resultats.filter((r) => !r).length} échec(s)`; },
  };
}
