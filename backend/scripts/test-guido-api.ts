import assert = require('node:assert/strict');
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { ConseillerService } from '../src/conseiller/conseiller.service';

interface RequeteCapturee {
  apiKey: string | undefined;
  corps: { conversation_id: string; question: string; historique: { question: string; reponse: string }[] };
}

async function lireJson(req: IncomingMessage) {
  let texte = '';
  for await (const morceau of req) texte += morceau.toString();
  return JSON.parse(texte) as RequeteCapturee['corps'];
}

async function main() {
  const requetes: RequeteCapturee[] = [];
  let statut = 200;
  const serveur = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    if (req.url !== '/api/chat' || req.method !== 'POST') {
      res.writeHead(404).end();
      return;
    }
    const corps = await lireJson(req);
    requetes.push({ apiKey: req.headers['x-api-key'] as string | undefined, corps });
    if (statut !== 200) {
      res.writeHead(statut, { 'Content-Type': 'application/json' }).end(JSON.stringify({ detail: 'mock error' }));
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({
      conversation_id: corps.conversation_id,
      question: corps.question,
      reponse: 'Réponse simulée du bot technique.',
    }));
  });

  await new Promise<void>((resolve) => serveur.listen(0, '127.0.0.1', resolve));
  try {
    const adresse = serveur.address();
    assert(adresse && typeof adresse !== 'string');
    const config = {
      get: (cle: string) => ({
        GUIDO_API_URL: `http://127.0.0.1:${adresse.port}`,
        GUIDO_API_KEY: 'cle-de-test-uniquement',
        GUIDO_ALLOW_INSECURE_HTTP: 'false',
      })[cle],
    };
    let conversation: any;
    const prisma: any = {
      conversationIA: {
        findFirst: async ({ where }: any) => conversation?.id === where.id && conversation?.apprenantNip === where.apprenantNip ? conversation : null,
        create: async ({ data }: any) => (conversation = data),
        update: async ({ data }: any) => (conversation = { ...conversation, ...data }),
        findMany: async () => [],
      },
      apprenant: { findUnique: async () => ({ palier: 'TROISIEME' }) },
    };
    const service = new ConseillerService(prisma, config as any);
    const utilisateur = { role: 'APPRENANT' } as any;

    const premiere = await service.chat('NIP-NE-DOIT-PAS-PARTIR', 'Quels métiers techniques après le BEPC ?', utilisateur);
    assert.equal(premiere.reponse, 'Réponse simulée du bot technique.');
    assert.equal(requetes.length, 1);
    assert.equal(requetes[0].apiKey, 'cle-de-test-uniquement');
    assert.deepEqual(Object.keys(requetes[0].corps).sort(), ['conversation_id', 'historique', 'question']);
    assert.deepEqual(requetes[0].corps.historique, []);
    assert.equal(requetes[0].corps.question, 'Quels métiers techniques après le BEPC ?');
    assert.equal(requetes[0].corps.conversation_id, premiere.conversationId);
    assert(!JSON.stringify(requetes[0].corps).includes('NIP-NE-DOIT-PAS-PARTIR'));

    const seconde = await service.chat('NIP-NE-DOIT-PAS-PARTIR', 'Et les débouchés ?', utilisateur, premiere.conversationId);
    assert.equal(seconde.conversationId, premiere.conversationId);
    assert.deepEqual(requetes[1].corps.historique, [{ question: 'Quels métiers techniques après le BEPC ?', reponse: 'Réponse simulée du bot technique.' }]);

    const nombreAvantSignal = requetes.length;
    const urgence = await service.chat('NIP-NE-DOIT-PAS-PARTIR', 'Un camarade me harcèle tous les jours.', utilisateur);
    assert(urgence.reponse.includes('adulte de confiance'));
    assert.equal(requetes.length, nombreAvantSignal, 'un signal de détresse ne doit pas être transmis au bot externe');

    statut = 401;
    await assert.rejects(
      service.chat('NIP-NE-DOIT-PAS-PARTIR', 'Question de test', utilisateur),
      (err: any) => err.status === 503,
    );
    assert.equal(requetes.at(-1)?.apiKey, 'cle-de-test-uniquement');

    const serviceHttpDistant = new ConseillerService(prisma, {
      get: (cle: string) => ({ GUIDO_API_URL: 'http://203.0.113.10:8010', GUIDO_API_KEY: 'test' })[cle],
    } as any);
    await assert.rejects(
      serviceHttpDistant.chat('NIP-NE-DOIT-PAS-PARTIR', 'Question', utilisateur),
      (err: any) => err.status === 503 && String(err.message).includes('HTTPS'),
    );

    console.log('OK — contrat du proxy Guido, clé serveur, historique, filet de sécurité et HTTPS vérifiés avec un faux serveur local.');
  } finally {
    await new Promise<void>((resolve, reject) => serveur.close((err) => err ? reject(err) : resolve()));
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
