#!/bin/bash
source "$(dirname "$0")/../lib.sh"
jeton() { req POST /auth/connexion "" "{\"identifiant\":\"$1\",\"motDePasse\":\"Demo2026!\"}" >/dev/null; js 'return j.accessToken'; }
id_filiere() { curl -s "$A/filiere?search=$1" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).items[0].id))'; }
reinitialiser() { $PSQL <<SQL
delete from preferences where apprenant_nip like 'DEMO-%';
delete from recommandations where apprenant_nip like 'DEMO-%';
delete from utilisateurs where nip = 'DEMO-4E-0001';
SQL
}

curl -s -o /dev/null --retry 30 --retry-all-errors --retry-delay 1 --max-time 3 $A/docs
reinitialiser
TF=$(jeton DEMO-3E-0001); TK=$(jeton DEMO-TLE-0001); TP=$(jeton parent.demo@monorientation.bj); TD=$(jeton dges.demo@monorientation.bj)
C=$(id_filiere BAC-C); D=$(id_filiere BAC-D); ELEC=$(id_filiere DTM-LTP-ELEC); MED=$(id_filiere UNIV-FSS-MEDECINE)
echo "jetons: F=${TF:0:8}… K=${TK:0:8}… P=${TP:0:8}… D=${TD:0:8}… | filières C=${C:0:8} D=${D:0:8} ELEC=${ELEC:0:8} MED=${MED:0:8}"

echo "── Profil et bilan"
check "Fatou → son profil" 200 $(req GET /apprenant/DEMO-3E-0001 "$TF")
check "  classe" TROISIEME "$(js 'return j.palier')"
check "  moyenne générale" 13.24 "$(js 'return j.bilan.moyenneGenerale')"
check "  point fort Mathématiques" true "$(js 'return j.bilan.forces.includes("Mathématiques")')"
check "  notes brutes non exposées dans le profil" true "$(js 'return j.notes===undefined && j.utilisateurId===undefined')"
check "parent → /auth/moi enfant avec classe" 200 $(req GET /auth/moi "$TP"); check "  enfants[0].palier" TROISIEME "$(js 'return j.enfants[0]?.palier')"

echo "── Moteur (3e)"
check "Fatou → calcul" 201 $(req POST /orientation/DEMO-3E-0001/calcul "$TF")
check "  5 pistes" 5 "$(js 'return j.length')"
check "  toutes accessibles après le BEPC" true "$(js 'return j.every(r=>r.filiere.niveauAcces==="APRES_BEPC")')"
check "  au plus 2 par type" true "$(js 'const c={};j.forEach(r=>c[r.filiere.type]=(c[r.filiere.type]||0)+1);return Object.values(c).every(n=>n<=2)')"
check "  chaque piste est expliquée" true "$(js 'return j.every(r=>Array.isArray(r.criteres)&&r.criteres.length>0)')"
echo "  → $(js 'return j.map(r=>r.filiere.code+" "+r.score).join(" | ")')"

echo "── Moteur (Terminale D)"
check "Koffi → calcul" 201 $(req POST /orientation/DEMO-TLE-0001/calcul "$TK")
check "  toutes accessibles après le bac" true "$(js 'return j.every(r=>r.filiere.niveauAcces==="APRES_BAC")')"
check "  aucune filière réservée aux séries A (FLASH)" true "$(js 'return !j.some(r=>r.filiere.code.startsWith("UNIV-FLASH"))')"
check "  aucune filière réservée aux bacs techniques (INSTI)" true "$(js 'return !j.some(r=>r.filiere.code.startsWith("UNIV-INSTI"))')"
echo "  → $(js 'return j.map(r=>r.filiere.code+" "+r.score).join(" | ")')"

echo "── Vœux"
check "vœux avec une filière du supérieur (3e) → 400" 400 $(req POST /apprenant/DEMO-3E-0001/preferences "$TF" "{\"filiereId1\":\"$MED\"}")
check "vœux en double → 400" 400 $(req POST /apprenant/DEMO-3E-0001/preferences "$TF" "{\"filiereId1\":\"$C\",\"filiereId2\":\"$C\"}")
check "3e vœu sans 2e → 400" 400 $(req POST /apprenant/DEMO-3E-0001/preferences "$TF" "{\"filiereId1\":\"$C\",\"filiereId3\":\"$D\"}")
check "identifiant invalide → 400" 400 $(req POST /apprenant/DEMO-3E-0001/preferences "$TF" '{"filiereId1":"pas-un-uuid"}')
check "parent ne saisit pas les vœux → 403" 403 $(req POST /apprenant/DEMO-3E-0001/preferences "$TP" "{\"filiereId1\":\"$C\"}")
check "autre élève → 403" 403 $(req POST /apprenant/DEMO-3E-0001/preferences "$TK" "{\"filiereId1\":\"$C\"}")
check "Fatou enregistre 3 vœux" 201 $(req POST /apprenant/DEMO-3E-0001/preferences "$TF" "{\"filiereId1\":\"$C\",\"filiereId2\":\"$D\",\"filiereId3\":\"$ELEC\",\"motivation\":\"J'aime les maths\"}")
check "  non validés par le parent" false "$(js 'return j[0].valideParent')"
check "  1er vœu = série C" BAC-C "$(js 'return j[0].filiere1.code')"
check "recommandations recalculées : série C marquée 1er choix" true "$(req GET /orientation/DEMO-3E-0001/recommandations "$TF" >/dev/null; js 'return j.some(r=>r.filiere.code==="BAC-C"&&r.criteres.some(c=>c.critere==="preference"&&c.rang===1))')"
check "  le 3e vœu (DTM) est évalué même hors du top" true "$(js 'return j.some(r=>r.filiere.code==="DTM-LTP-ELEC-ENERGIE")')"

echo "── Validation parent"
check "Fatou ne valide pas elle-même → 403" 403 $(req POST /apprenant/DEMO-3E-0001/preferences/validation "$TF")
check "parent valide" 200 $(req POST /apprenant/DEMO-3E-0001/preferences/validation "$TP"); check "  validés" true "$(js 'return j.valideParent')"
check "même vœux ré-enregistrés → validation conservée" true "$(req POST /apprenant/DEMO-3E-0001/preferences "$TF" "{\"filiereId1\":\"$C\",\"filiereId2\":\"$D\",\"filiereId3\":\"$ELEC\",\"motivation\":\"J'aime les maths\"}" >/dev/null; js 'return j[0].valideParent')"
check "vœux modifiés → validation annulée" false "$(req POST /apprenant/DEMO-3E-0001/preferences "$TF" "{\"filiereId1\":\"$D\",\"filiereId2\":\"$C\"}" >/dev/null; js 'return j[0].valideParent')"

echo "── Élève de 4e (inscription puis pistes)"
check "Adama s'inscrit avec NIP + date de naissance" 201 $(req POST /auth/inscription "" '{"nip":"DEMO-4E-0001","dateNaissance":"2012-07-08","nom":"Hounkpatin","prenom":"Adama","motDePasse":"motdepasse4e"}')
TA=$(js 'return j.accessToken')
check "Adama → pistes (4e)" 201 $(req POST /orientation/DEMO-4E-0001/calcul "$TA")
check "  aucune piste « vœu » en 4e" true "$(js 'return j.every(r=>!r.criteres.some(c=>c.critere==="preference"))')"
check "Adama → vœux en 4e → 400" 400 $(req POST /apprenant/DEMO-4E-0001/preferences "$TA" "{\"filiereId1\":\"$C\"}")

echo "── DGES"
check "DGES → dossier individuel → 403" 403 $(req GET /apprenant/DEMO-3E-0001 "$TD")
check "DGES → stats nationales" 200 $(req GET /stats/national "$TD")

reinitialiser
bilan
