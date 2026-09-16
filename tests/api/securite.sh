#!/bin/bash
source "$(dirname "$0")/../lib.sh"
nettoyer() { $PSQL <<SQL
delete from utilisateurs where nip like 'TEST-B1-%' or email like '%@test-b1.bj';
delete from apprenants where nip like 'TEST-B1-%';
SQL
}

curl -s -o /dev/null --retry 30 --retry-all-errors --retry-delay 1 --max-time 3 $A/docs
nettoyer
$PSQL <<SQL
insert into apprenants (nip, numero_educmaster, nom, prenom, date_naissance, sexe, departement, commune, updated_at) values
 ('TEST-B1-A','EM-TEST-B1-A','Test','Alice','2011-04-15','F','Littoral','Cotonou', now()),
 ('TEST-B1-B','EM-TEST-B1-B','Test','Bob','2010-02-01','M','Borgou','Parakou', now());
SQL

echo "── Identification (EducMaster, sans inscription)"
check "élève, date de naissance incorrecte → 401" 401 $(req POST /auth/identification "" '{"identifiant":"TEST-B1-A","motDePasse":"2011-04-16"}')
check "élève inconnu → 401" 401 $(req POST /auth/identification "" '{"identifiant":"TEST-B1-ZZZ","motDePasse":"2011-04-15"}')
check "élève, sans mot de passe → 400" 400 $(req POST /auth/identification "" '{"identifiant":"TEST-B1-A"}')
check "élève, 1re identification → 200 (le compte est créé)" 200 $(req POST /auth/identification "" '{"identifiant":"TEST-B1-A","motDePasse":"2011-04-15"}')
TA=$(jget j.accessToken); RA=$(jget j.refreshToken)
check "  son dossier est rattaché au compte créé" TEST-B1-A "$(req GET /auth/moi "$TA" >/dev/null; jget 'j.apprenant?.nip')"
check "élève, identification suivante → 200" 200 $(req POST /auth/identification "" '{"identifiant":"TEST-B1-A","motDePasse":"2011-04-15"}')
check "élève, par son numéro EducMaster → 200" 200 $(req POST /auth/identification "" '{"identifiant":"EM-TEST-B1-B","motDePasse":"2010-02-01"}')
check "personnel refusé sur l'identification EducMaster → 401" 401 $(req POST /auth/identification "" '{"identifiant":"admin@monorientation.bj","motDePasse":"admin123"}')
check "élève refusé sur l'accès des personnels → 401" 401 $(req POST /auth/personnel "" '{"identifiant":"TEST-B1-A","motDePasse":"2011-04-15"}')
check "parent, par l'adresse de son compte → 200" 200 $(req POST /auth/identification "" '{"identifiant":"parent.demo@monorientation.bj","motDePasse":"Demo2026!"}')
TP=$(jget j.accessToken); PID=$(jget j.user.id)

echo "── Accès élève"
check "élève → son dossier" 200 $(req GET /apprenant/TEST-B1-A "$TA")
check "élève → dossier d'un autre → 403" 403 $(req GET /apprenant/TEST-B1-B "$TA")
check "élève → notes d'un autre → 403" 403 $(req GET /apprenant/TEST-B1-B/notes "$TA")
check "élève → recommandations d'un autre → 403" 403 $(req GET /orientation/TEST-B1-B/recommandations "$TA")
check "élève → chat d'un autre → 403" 403 $(req POST /conseiller/TEST-B1-B/chat "$TA" '{"message":"bonjour"}')
check "élève → stats nationales → 403" 403 $(req GET /stats/national "$TA")
check "élève → explication inexistante/étrangère → 404" 404 $(req GET /orientation/TEST-B1-A/explain/00000000-0000-0000-0000-000000000000 "$TA")
check "chat message vide → 400" 400 $(req POST /conseiller/TEST-B1-A/chat "$TA" '{"message":""}')
check "chat : conversation inconnue → 404 (sans appeler le modèle)" 404 $(req POST /conseiller/TEST-B1-A/chat "$TA" '{"message":"bonjour","conversationId":"3f1c2b9a-6d4e-4f8a-9b7c-1a2b3c4d5e6f"}')
check "sans jeton → 401" 401 $(req GET /apprenant/TEST-B1-A "")
check "/auth/moi élève → dossier rattaché" 200 $(req GET /auth/moi "$TA"); check "  moi.apprenant.nip" TEST-B1-A "$(jget j.apprenant?.nip)"

echo "── Accès parent"
check "parent non rattaché → 403" 403 $(req GET /apprenant/TEST-B1-A "$TP")
$PSQL -c "insert into parent_apprenant (id, parent_user_id, apprenant_nip, relation) values (gen_random_uuid(), '$PID', 'TEST-B1-A', 'Père');"
check "parent rattaché → dossier de l'enfant" 200 $(req GET /apprenant/TEST-B1-A "$TP")
check "parent → autre élève → 403" 403 $(req GET /apprenant/TEST-B1-B "$TP")
check "/auth/moi parent → enfants" 200 $(req GET /auth/moi "$TP"); check "  moi.enfants contient TEST-B1-A" true "$(js 'return (j.enfants||[]).some(e=>e.nip==="TEST-B1-A")')"

echo "── Accès admin"
check "admin connexion" 200 $(req POST /auth/personnel "" '{"identifiant":"admin@monorientation.bj","motDePasse":"admin123"}'); TADM=$(jget j.accessToken)
check "admin → dossier élève" 200 $(req GET /apprenant/TEST-B1-B "$TADM")
check "admin → NIP inexistant → 404" 404 $(req GET /apprenant/INCONNU-B1 "$TADM")
check "admin → stats" 200 $(req GET /stats/national "$TADM")

echo "── Jetons"
check "refresh → nouvelle paire" 200 $(req POST /auth/refresh "" "{\"refreshToken\":\"$RA\"}"); RA2=$(jget j.refreshToken)
check "réutiliser l'ancien refresh → 401 (rotation)" 401 $(req POST /auth/refresh "" "{\"refreshToken\":\"$RA\"}")
check "déconnexion sans jeton → 401" 401 $(req POST /auth/deconnexion "")
check "déconnexion élève" 200 $(req POST /auth/deconnexion "$TA")
check "refresh après déconnexion → 401" 401 $(req POST /auth/refresh "" "{\"refreshToken\":\"$RA2\"}")

echo "── Limitation des tentatives"
for i in 1 2 3 4 5; do req POST /auth/identification "" '{"identifiant":"throttle@test-b1.bj","motDePasse":"x"}' >/dev/null; done
check "6e échec pour le même identifiant → 429" 429 $(req POST /auth/identification "" '{"identifiant":"throttle@test-b1.bj","motDePasse":"x"}')
check "autre identifiant, même IP → 401 (pas bloqué)" 401 $(req POST /auth/identification "" '{"identifiant":"autre@test-b1.bj","motDePasse":"x"}')

echo "── En-têtes de sécurité"
check "helmet X-Content-Type-Options" nosniff "$(curl -sI $A/filiere | grep -i '^x-content-type-options' | awk '{print $2}' | tr -d '\r')"

nettoyer
bilan
