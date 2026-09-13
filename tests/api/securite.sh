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
insert into apprenants (nip, nom, prenom, date_naissance, sexe, departement, commune, updated_at) values
 ('TEST-B1-A','Test','Alice','2011-04-15','F','Littoral','Cotonou', now()),
 ('TEST-B1-B','Test','Bob','2010-02-01','M','Borgou','Parakou', now());
SQL

echo "── Inscription"
check "apprenant, mauvaise date de naissance → 400" 400 $(req POST /auth/inscription "" '{"nip":"TEST-B1-A","dateNaissance":"2011-04-16","nom":"Test","prenom":"Alice","motDePasse":"motdepasse1"}')
check "apprenant, NIP inconnu → 400" 400 $(req POST /auth/inscription "" '{"nip":"TEST-B1-ZZZ","dateNaissance":"2011-04-15","nom":"X","prenom":"Y","motDePasse":"motdepasse1"}')
check "apprenant, sans date de naissance → 400" 400 $(req POST /auth/inscription "" '{"nip":"TEST-B1-A","nom":"Test","prenom":"Alice","motDePasse":"motdepasse1"}')
check "apprenant, NIP + bonne date → 201" 201 $(req POST /auth/inscription "" '{"nip":"TEST-B1-A","dateNaissance":"2011-04-15","nom":"Test","prenom":"Alice","motDePasse":"motdepasse1"}')
TA=$(jget j.accessToken); RA=$(jget j.refreshToken)
check "même NIP une 2e fois → 409" 409 $(req POST /auth/inscription "" '{"nip":"TEST-B1-A","dateNaissance":"2011-04-15","nom":"Test","prenom":"Alice","motDePasse":"motdepasse1"}')
check "parent sans NIP (email) → 201" 201 $(req POST /auth/inscription "" '{"role":"PARENT","email":"parent@test-b1.bj","nom":"Test","prenom":"Papa","motDePasse":"motdepasse1"}')
TP=$(jget j.accessToken); PID=$(jget j.user.id)
check "parent sans email → 400" 400 $(req POST /auth/inscription "" '{"role":"PARENT","nom":"Test","prenom":"Maman","motDePasse":"motdepasse1"}')
check "role ADMIN → 400" 400 $(req POST /auth/inscription "" '{"role":"ADMIN","email":"pirate@test-b1.bj","nom":"X","prenom":"Y","motDePasse":"motdepasse1"}')

echo "── Accès élève"
check "élève → son dossier" 200 $(req GET /apprenant/TEST-B1-A "$TA")
check "élève → dossier d'un autre → 403" 403 $(req GET /apprenant/TEST-B1-B "$TA")
check "élève → notes d'un autre → 403" 403 $(req GET /apprenant/TEST-B1-B/notes "$TA")
check "élève → recommandations d'un autre → 403" 403 $(req GET /orientation/TEST-B1-B/recommandations "$TA")
check "élève → chat d'un autre → 403" 403 $(req POST /conseiller/TEST-B1-B/chat "$TA" '{"message":"bonjour"}')
check "élève → stats nationales → 403" 403 $(req GET /stats/national "$TA")
check "élève → explication inexistante/étrangère → 404" 404 $(req GET /orientation/TEST-B1-A/explain/00000000-0000-0000-0000-000000000000 "$TA")
check "chat message vide → 400" 400 $(req POST /conseiller/TEST-B1-A/chat "$TA" '{"message":""}')
check "chat valide → 201" 201 $(req POST /conseiller/TEST-B1-A/chat "$TA" '{"message":"bonjour"}')
check "sans jeton → 401" 401 $(req GET /apprenant/TEST-B1-A "")
check "/auth/moi élève → dossier rattaché" 200 $(req GET /auth/moi "$TA"); check "  moi.apprenant.nip" TEST-B1-A "$(jget j.apprenant?.nip)"

echo "── Accès parent"
check "parent non rattaché → 403" 403 $(req GET /apprenant/TEST-B1-A "$TP")
$PSQL -c "insert into parent_apprenant (id, parent_user_id, apprenant_nip, relation) values (gen_random_uuid(), '$PID', 'TEST-B1-A', 'Père');"
check "parent rattaché → dossier de l'enfant" 200 $(req GET /apprenant/TEST-B1-A "$TP")
check "parent → autre élève → 403" 403 $(req GET /apprenant/TEST-B1-B "$TP")
check "/auth/moi parent → enfants" 200 $(req GET /auth/moi "$TP"); check "  moi.enfants[0].nip" TEST-B1-A "$(jget j.enfants?.[0]?.nip)"

echo "── Accès admin"
check "admin connexion" 200 $(req POST /auth/connexion "" '{"identifiant":"admin@monorientation.bj","motDePasse":"admin123"}'); TADM=$(jget j.accessToken)
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
for i in 1 2 3 4 5; do req POST /auth/connexion "" '{"identifiant":"throttle@test-b1.bj","motDePasse":"x"}' >/dev/null; done
check "6e échec pour le même identifiant → 429" 429 $(req POST /auth/connexion "" '{"identifiant":"throttle@test-b1.bj","motDePasse":"x"}')
check "autre identifiant, même IP → 401 (pas bloqué)" 401 $(req POST /auth/connexion "" '{"identifiant":"autre@test-b1.bj","motDePasse":"x"}')

echo "── En-têtes de sécurité"
check "helmet X-Content-Type-Options" nosniff "$(curl -sI $A/filiere | grep -i '^x-content-type-options' | awk '{print $2}' | tr -d '\r')"

nettoyer
bilan
