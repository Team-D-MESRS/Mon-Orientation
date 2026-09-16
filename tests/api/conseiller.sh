#!/bin/bash
# Conseiller pédagogique : droits, validation, conversations, limitation.
# Les appels réels au modèle (quota gratuit limité) ne sont faits qu'avec CONSEILLER_TEST_LLM=1 et une clé GEMINI_API_KEY.
# Prérequis : données de démonstration (npm run prisma:seed:demo).
source "$(dirname "$0")/../lib.sh"
pause() { node -e "setTimeout(()=>{}, $1)"; }
DEBUT=$(date -u +'%Y-%m-%d %H:%M:%S')
nettoyer() { $PSQL -c "delete from conversations_ia where apprenant_nip in ('DEMO-3E-0001','DEMO-TLE-0001') and date_debut >= '$DEBUT';"; }
# Élèves et parents : identifiants EducMaster. Personnels du ministère : compte interne.
connexion() { req POST /auth/identification "" "{\"identifiant\":\"$1\",\"motDePasse\":\"$2\"}" >/dev/null; jget j.accessToken; }
personnel() { req POST /auth/personnel "" "{\"identifiant\":\"$1\",\"motDePasse\":\"$2\"}" >/dev/null; jget j.accessToken; }

curl -s -o /dev/null --retry 30 --retry-all-errors --retry-delay 1 --max-time 3 $A/docs
TF=$(connexion DEMO-3E-0001 'Demo2026!')
TP=$(connexion parent.demo@monorientation.bj 'Demo2026!')
TD=$(personnel dges.demo@monorientation.bj 'Demo2026!')
TADM=$(personnel admin@monorientation.bj admin123)
[ -n "$TF" ] && [ -n "$TP" ] || { echo "Comptes de démonstration absents : lancer npm run prisma:seed:demo"; exit 1; }

echo "── Droits d'accès"
check "élève → conseiller d'un autre élève → 403" 403 $(req POST /conseiller/DEMO-TLE-0001/chat "$TF" '{"message":"bonjour"}')
check "admin → conversation pour un élève → 403 (réservé élèves et parents)" 403 $(req POST /conseiller/DEMO-3E-0001/chat "$TADM" '{"message":"bonjour"}')
check "DGES → dossier individuel → 403" 403 $(req POST /conseiller/DEMO-3E-0001/chat "$TD" '{"message":"bonjour"}')
check "admin → historique (supervision) → 200" 200 $(req GET /conseiller/DEMO-3E-0001/historique "$TADM")

echo "── Validation"
check "message vide → 400" 400 $(req POST /conseiller/DEMO-3E-0001/chat "$TF" '{"message":""}')
LONG=$(printf 'a%.0s' $(seq 1 2001))
check "message de plus de 2000 caractères → 400" 400 $(req POST /conseiller/DEMO-3E-0001/chat "$TF" "{\"message\":\"$LONG\"}")
check "conversationId mal formé → 400" 400 $(req POST /conseiller/DEMO-3E-0001/chat "$TF" '{"message":"bonjour","conversationId":"abc"}')
check "langue inconnue → 400" 400 $(req POST /conseiller/DEMO-3E-0001/chat "$TF" '{"message":"bonjour","langue":"xx"}')
AUTRE=$($PSQL -tA -c "insert into conversations_ia (id, apprenant_nip, messages, langue, palier) values (gen_random_uuid(), 'DEMO-TLE-0001', '[]', 'fr', 'TERMINALE') returning id;" | head -1)
check "conversation d'un autre élève → 404" 404 $(req POST /conseiller/DEMO-3E-0001/chat "$TF" "{\"message\":\"bonjour\",\"conversationId\":\"$AUTRE\"}")

echo "── Réponse du conseiller"
CODE=$(req POST /conseiller/DEMO-3E-0001/chat "$TF" '{"message":"Bonjour"}')
if [ "$CODE" = 503 ] && [ "$(js "return /pas encore configuré/.test(j.message) ? 1 : 0")" = 1 ]; then
  check "sans clé API : 503 avec un message explicite" "non configuré" "non configuré"
elif [ "$CODE" = 503 ] || [ "$CODE" = 429 ]; then
  check "modèle joignable (sinon : surcharge ou quota Gemini, relancer plus tard)" 201 "$CODE"
elif [ "${CONSEILLER_TEST_LLM:-0}" != 1 ]; then
  check "clé configurée : réponse (relancer avec CONSEILLER_TEST_LLM=1 pour les vérifications détaillées)" 201 "$CODE"
else
  check "question simple → 201" 201 "$CODE"
  pause 20000   # quota gratuit de Gemini : espacer les questions
  CODE=$(req POST /conseiller/DEMO-3E-0001/chat "$TF" '{"message":"Pourquoi le moteur me propose ces formations ?"}')
  check "question sur les propositions → 201" 201 "$CODE"
  CONV=$(jget j.conversationId); REPONSE=$(jget j.reponse)
  check "  ni NIP ni nom de l'élève dans la réponse (pseudonymisation)" oui "$(REPONSE="$REPONSE" js "return /DEMO-3E|Dossou/.test(process.env.REPONSE) ? 'non' : 'oui'")"
  req GET /orientation/DEMO-3E-0001/recommandations "$TF" >/dev/null
  check "  la réponse renvoie vers des formations proposées par le moteur" oui "$(REPONSE="$REPONSE" js "return j.some((r) => process.env.REPONSE.includes('/catalogue/' + r.filiere.id)) ? 'oui' : 'non'")"
  pause 20000   # quota gratuit de Gemini : espacer les questions
  if [ -n "$CONV" ]; then
    # Formation hors des propositions de Fatou (profil scientifique) : le conseiller doit demander l'avis du moteur
    check "suite de la conversation (et si la série A1 ?) → 201" 201 $(req POST /conseiller/DEMO-3E-0001/chat "$TF" "{\"message\":\"Et si je choisissais plutôt la série A1, lettres et langues ?\",\"conversationId\":\"$CONV\"}")
    check "  même conversation" "$CONV" "$(jget j.conversationId)"
    check "  avis du moteur demandé (evaluer_filiere)" oui "$(js "return j.outilsUtilises.includes('evaluer_filiere') ? 'oui' : j.outilsUtilises.join(',') || 'aucun outil'")"
    check "  conversation enregistrée : 4 messages" 4 "$($PSQL -tA -c "select jsonb_array_length(messages) from conversations_ia where id = '$CONV';")"
  else
    check "suite de la conversation" "testée" "non testée (question précédente en échec)"
  fi
  pause 20000
  check "question hors sujet (politique) → réponse recentrée, 201" 201 $(req POST /conseiller/DEMO-3E-0001/chat "$TF" '{"message":"Pour qui faut-il voter aux prochaines élections ?"}')
  echo "   → $(jget j.reponse | head -c 300)"
  pause 20000
  check "question en français, réponse demandée en fongbé → 201" 201 $(req POST /conseiller/DEMO-3E-0001/chat "$TF" '{"message":"À quels métiers mène la série D ?","langue":"fon"}')
  check "  réponse en fongbé (lettres ɖ, ɛ ou ɔ)" oui "$(js "return /[ɖɛɔƐƆ]/.test(j.reponse) ? 'oui' : 'non'")"
  check "  langue enregistrée avec la conversation" fon "$($PSQL -tA -c "select langue from conversations_ia where id = '$(jget j.conversationId)';")"
  echo "   → $(jget j.reponse | head -c 300)"
fi

echo "── Limitation (10 messages par minute et par compte)"
for i in $(seq 1 10); do req POST /conseiller/DEMO-3E-0001/chat "$TP" '{"message":""}' >/dev/null; done
check "11e message du parent dans la minute → 429" 429 $(req POST /conseiller/DEMO-3E-0001/chat "$TP" '{"message":""}')

$PSQL -c "delete from conversations_ia where id = '$AUTRE';"
nettoyer
bilan
