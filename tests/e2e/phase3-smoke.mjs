const base = process.env.FRONTEND_URL ?? 'http://127.0.0.1:3000';
const api = process.env.API_URL ?? 'http://127.0.0.1:8080';

const checks = [
  ['accueil frontend', `${base}/`],
  ['identification', `${base}/identification`],
  ['catalogue', `${base}/catalogue`],
  ['comparateur', `${base}/catalogue/comparer`],
  ['health API', `${api}/api/health`],
];

let failures = 0;
for (const [label, url] of checks) {
  try {
    const response = await fetch(url);
    const body = response.headers.get('content-type')?.includes('application/json') ? await response.json() : null;
    const expected = label === 'health API' ? response.ok && body?.status === 'ok' : response.ok;
    console.log(`${expected ? 'OK' : 'FAIL'} ${label} ${response.status} ${url}`);
    if (!expected) failures += 1;
  } catch (error) {
    failures += 1;
    console.error(`FAIL ${label} ${url}`, error.message);
  }
}

if (failures > 0) process.exit(1);
