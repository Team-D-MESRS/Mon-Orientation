#!/bin/bash
# Guido externe : droits, validation, filet déterministe et limitation. Aucun appel au service LLM distant.
# La compatibilité HTTP est couverte séparément par `npm run test:guido-api` avec un mock local.
source "$(dirname "$0")/../lib.sh"
DEBUT=$(date -u +'%Y-%m-%d %H:%M:%S')
nettoyer() { $PSQL -c "delete from conversations_ia where apprenant_nip in ('DEMO-3E-0001','DEMO-TLE-0001') and date_debut >= '$DEBUT';"; }
connexion() { req POST /auth/identification "" "{\"identifiant\":\"$1\",\"motDePasse\":\"$2\"}" >/dev/null; jget j.accessToken; }
personnel() { req POST /auth/personnel "" "{\"identifiant\":\"$1\",\"motDePasse\":\"$2\"}" >/dev/null; jget j.accessToken; }

curl -s -o /dev/null --retry 30 --retry-all-errors --retry-delay 1 --max-time 3 "$A/docs"
TF=$(connexion DEMO-3E-0001 'Demo2026!')
TP=$(connexion parent.demo@monorientation.bj 'Demo2026!')
TD=$(personnel dges.demo@monorientation.bj 'Demo2026!')
TADM=$(personnel admin@monorientation.bj admin123)
[ -n "$TF" ] && [ -n "$TP" ] || { echo "Comptes de démonstration absents : lancer npm run prisma:seed:demo"; exit 1; }

echo "── Droits d'accès"
check "élève → conseiller d'un autre élève → 403" 403 $(req POST /conseiller/DEMO-TLE-0001/chat "$TF" '{"message":"bonjour"}')
check "admin → conseiller → 403 (réservé élèves et parents)" 403 $(req POST /conseiller/DEMO-3E-0001/chat "$TADM" '{"message":"bonjour"}')
check "DGES → dossier individuel → 403" 403 $(req POST /conseiller/DEMO-3E-0001/chat "$TD" '{"message":"bonjour"}')
check "admin → historique (supervision) → 200" 200 $(req GET /conseiller/DEMO-3E-0001/historique "$TADM")

echo "── Validation du contrat texte"
check "message absent → 400" 400 $(req POST /conseiller/DEMO-3E-0001/chat "$TF" '{}')
check "message vide → 400" 400 $(req POST /conseiller/DEMO-3E-0001/chat "$TF" '{"message":""}')
LONG=$(printf 'a%.0s' $(seq 1 2001))
check "message de plus de 2000 caractères → 400" 400 $(req POST /conseiller/DEMO-3E-0001/chat "$TF" "{\"message\":\"$LONG\"}")
check "audio non pris en charge → 400" 400 $(req POST /conseiller/DEMO-3E-0001/chat "$TF" '{"message":"bonjour","audio":{"data":"YWJj","mimeType":"audio/webm"}}')
check "champ langue non pris en charge → 400" 400 $(req POST /conseiller/DEMO-3E-0001/chat "$TF" '{"message":"bonjour","langue":"fon"}')
check "conversationId mal formé → 400" 400 $(req POST /conseiller/DEMO-3E-0001/chat "$TF" '{"message":"bonjour","conversationId":"abc"}')
AUTRE=$($PSQL -tA -c "insert into conversations_ia (id, apprenant_nip, messages, langue, palier) values (gen_random_uuid(), 'DEMO-TLE-0001', '[]', 'fr', 'TERMINALE') returning id;" | head -1)
check "conversation d'un autre élève → 404" 404 $(req POST /conseiller/DEMO-3E-0001/chat "$TF" "{\"message\":\"bonjour\",\"conversationId\":\"$AUTRE\"}")

echo "── Réponse locale de protection, sans transmission externe"
CODE=$(req POST /conseiller/DEMO-3E-0001/chat "$TF" '{"message":"Un camarade me harcèle tous les jours en classe"}')
check "signal de harcèlement → réponse locale, 201" 201 "$CODE"
check "  redirige vers un adulte de confiance" oui "$(js "return /adulte de confiance/.test(j.reponse) ? 'oui' : 'non'")"
check "  aucun outil externe déclaré" 0 "$(js 'return j.outilsUtilises.length')"
CONV=$(jget j.conversationId)
check "  conversation enregistrée localement (2 messages)" 2 "$($PSQL -tA -c "select jsonb_array_length(messages) from conversations_ia where id = '$CONV';")"

echo "── Limitation (10 requêtes par minute et par compte)"
for i in $(seq 1 10); do req POST /conseiller/DEMO-3E-0001/chat "$TP" '{"message":""}' >/dev/null; done
check "11e message du parent dans la minute → 429" 429 $(req POST /conseiller/DEMO-3E-0001/chat "$TP" '{"message":""}')

$PSQL -c "delete from conversations_ia where id = '$AUTRE';"
nettoyer
bilan
