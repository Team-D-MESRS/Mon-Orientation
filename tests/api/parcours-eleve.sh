#!/bin/bash
source "$(dirname "$0")/../lib.sh"
# Élèves et parents : identifiants EducMaster. Personnels du ministère : compte interne.
jeton() { req POST /auth/identification "" "{\"identifiant\":\"$1\",\"motDePasse\":\"${2:-Demo2026!}\"}" >/dev/null; js 'return j.accessToken'; }
personnel() { req POST /auth/personnel "" "{\"identifiant\":\"$1\",\"motDePasse\":\"${2:-Demo2026!}\"}" >/dev/null; js 'return j.accessToken'; }
id_filiere() { curl -s "$A/filiere?search=$1" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const j=JSON.parse(s);console.log((j.items.find(f=>f.code===process.argv[1])||j.items[0]).id)})' "$1"; }
# Fiche masquée (série générale) : absente des listes, son id vient des filtres du catalogue
id_serie() { curl -s "$A/filiere/filtres" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).series.find(x=>x.serie===process.argv[1]).filiereId))' "$1"; }
reinitialiser() { $PSQL <<SQL
delete from preferences where apprenant_nip like 'DEMO-%';
delete from recommandations where apprenant_nip like 'DEMO-%';
delete from utilisateurs where nip = 'DEMO-4E-0001';
SQL
}

curl -s -o /dev/null --retry 30 --retry-all-errors --retry-delay 1 --max-time 3 $A/docs
reinitialiser
TF=$(jeton DEMO-3E-0001); TK=$(jeton DEMO-TLE-0001); TP=$(jeton parent.demo@monorientation.bj); TD=$(personnel dges.demo@monorientation.bj)
F3=$(id_filiere BAC-F3); G2=$(id_filiere BAC-G2); ELEC=$(id_filiere DTM-LTP-ELEC); MED=$(id_filiere UNIV-FSS-MEDECINE); MASQUEE=$(id_serie D)
echo "jetons: F=${TF:0:8}… K=${TK:0:8}… P=${TP:0:8}… D=${TD:0:8}… | filières F3=${F3:0:8} G2=${G2:0:8} ELEC=${ELEC:0:8} MED=${MED:0:8}"

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
check "  toutes admettent la série D (séries officielles du guide du MESRS)" true "$(js 'return j.every(r=>(r.filiere.seriesAdmises||[]).includes("D")||(r.filiere.seriesAdmises||[]).includes("Toutes séries"))')"
check "  au plus 2 par établissement" true "$(js 'const c={};j.forEach(r=>c[r.filiere.etablissementId]=(c[r.filiere.etablissementId]||0)+1);return Object.values(c).every(n=>n<=2)')"
echo "  → $(js 'return j.map(r=>r.filiere.code+" "+r.score).join(" | ")')"

echo "── Condition officielle par matière (lot 4 : paire, pas une moyenne)"
$PSQL <<SQL
delete from recommandations where apprenant_nip like 'TEST-LOT4-%';
delete from notes where apprenant_nip like 'TEST-LOT4-%';
delete from utilisateurs where nip like 'TEST-LOT4-%';
delete from apprenants where nip like 'TEST-LOT4-%';
insert into apprenants (nip, nom, prenom, date_naissance, sexe, departement, commune, palier, updated_at) values
 ('TEST-LOT4-A','Test','Paire échouée','2011-01-01','F','Littoral','Cotonou','TROISIEME', now()),
 ('TEST-LOT4-B','Test','Paire remplie','2011-01-01','M','Littoral','Cotonou','TROISIEME', now());
insert into notes (id, apprenant_nip, matiere, note, bareme, trimestre, annee_scolaire) values
 (gen_random_uuid(),'TEST-LOT4-A','Mathématiques',14,20,1,'2025-2026'), (gen_random_uuid(),'TEST-LOT4-A','PCT',7,20,1,'2025-2026'),
 (gen_random_uuid(),'TEST-LOT4-B','Mathématiques',14,20,1,'2025-2026'), (gen_random_uuid(),'TEST-LOT4-B','PCT',12,20,1,'2025-2026');
SQL
TA=$(jeton TEST-LOT4-A 2011-01-01); TB=$(jeton TEST-LOT4-B 2011-01-01)
check "14 en Maths, 7 en PCT (moyenne 10,5 ≥ 10) → calcul" 201 $(req POST /orientation/TEST-LOT4-A/calcul "$TA")
check "  aucun DTM ou bac industriel (paire Maths+PCT non remplie sur PCT)" true "$(js 'return !j.some(r=>/^(DTM-LTP-|BAC-F)/.test(r.filiere.code)&&!r.filiere.code.startsWith("DTM-LTP-ACCUEIL"))')"
check "14 en Maths, 12 en PCT (paire remplie) → calcul" 201 $(req POST /orientation/TEST-LOT4-B/calcul "$TB")
check "  un DTM ou bac industriel proposé, condition confirmée" true "$(js 'return j.some(r=>/^(DTM-LTP-|BAC-F)/.test(r.filiere.code)&&!r.filiere.code.startsWith("DTM-LTP-ACCUEIL")&&r.criteres.some(c=>c.critere==="condition"&&!c.alerte&&c.detail.includes("PCT")))')"
$PSQL <<SQL
delete from recommandations where apprenant_nip like 'TEST-LOT4-%';
delete from notes where apprenant_nip like 'TEST-LOT4-%';
delete from utilisateurs where nip like 'TEST-LOT4-%';
delete from apprenants where nip like 'TEST-LOT4-%';
SQL

echo "── Vœux"
check "vœux avec une filière du supérieur (3e) → 400" 400 $(req POST /apprenant/DEMO-3E-0001/preferences "$TF" "{\"filiereId1\":\"$MED\"}")
check "vœu sur une fiche masquée (bac général) → 400" 400 $(req POST /apprenant/DEMO-3E-0001/preferences "$TF" "{\"filiereId1\":\"$MASQUEE\"}")
check "vœux en double → 400" 400 $(req POST /apprenant/DEMO-3E-0001/preferences "$TF" "{\"filiereId1\":\"$F3\",\"filiereId2\":\"$F3\"}")
check "3e vœu sans 2e → 400" 400 $(req POST /apprenant/DEMO-3E-0001/preferences "$TF" "{\"filiereId1\":\"$F3\",\"filiereId3\":\"$G2\"}")
check "identifiant invalide → 400" 400 $(req POST /apprenant/DEMO-3E-0001/preferences "$TF" '{"filiereId1":"pas-un-uuid"}')
check "parent ne saisit pas les vœux → 403" 403 $(req POST /apprenant/DEMO-3E-0001/preferences "$TP" "{\"filiereId1\":\"$F3\"}")
check "autre élève → 403" 403 $(req POST /apprenant/DEMO-3E-0001/preferences "$TK" "{\"filiereId1\":\"$F3\"}")
check "Fatou enregistre 3 vœux" 201 $(req POST /apprenant/DEMO-3E-0001/preferences "$TF" "{\"filiereId1\":\"$F3\",\"filiereId2\":\"$G2\",\"filiereId3\":\"$ELEC\",\"motivation\":\"J'aime les maths\"}")
check "  non validés par le parent" false "$(js 'return j[0].valideParent')"
check "  1er vœu = série F3" BAC-F3 "$(js 'return j[0].filiere1.code')"
check "recommandations recalculées : série F3 marquée 1er choix" true "$(req GET /orientation/DEMO-3E-0001/recommandations "$TF" >/dev/null; js 'return j.some(r=>r.filiere.code==="BAC-F3"&&r.criteres.some(c=>c.critere==="preference"&&c.rang===1))')"
check "  le 3e vœu (DTM) est évalué même hors du top" true "$(js 'return j.some(r=>r.filiere.code==="DTM-LTP-ELEC-ENERGIE")')"

echo "── Validation parent"
check "Fatou ne valide pas elle-même → 403" 403 $(req POST /apprenant/DEMO-3E-0001/preferences/validation "$TF")
check "parent valide" 200 $(req POST /apprenant/DEMO-3E-0001/preferences/validation "$TP"); check "  validés" true "$(js 'return j.valideParent')"
check "même vœux ré-enregistrés → validation conservée" true "$(req POST /apprenant/DEMO-3E-0001/preferences "$TF" "{\"filiereId1\":\"$F3\",\"filiereId2\":\"$G2\",\"filiereId3\":\"$ELEC\",\"motivation\":\"J'aime les maths\"}" >/dev/null; js 'return j[0].valideParent')"
check "vœux modifiés → validation annulée" false "$(req POST /apprenant/DEMO-3E-0001/preferences "$TF" "{\"filiereId1\":\"$G2\",\"filiereId2\":\"$F3\"}" >/dev/null; js 'return j[0].valideParent')"

echo "── Élève de 4e (1re identification puis pistes)"
check "Adama s'identifie (1re fois : son compte est créé)" 200 $(req POST /auth/identification "" '{"identifiant":"DEMO-4E-0001","motDePasse":"2012-07-08"}')
TA=$(js 'return j.accessToken')
check "Adama → pistes (4e)" 201 $(req POST /orientation/DEMO-4E-0001/calcul "$TA")
check "  aucune piste « vœu » en 4e" true "$(js 'return j.every(r=>!r.criteres.some(c=>c.critere==="preference"))')"
check "Adama → vœux en 4e → 400" 400 $(req POST /apprenant/DEMO-4E-0001/preferences "$TA" "{\"filiereId1\":\"$F3\"}")

echo "── DGES"
check "DGES → dossier individuel → 403" 403 $(req GET /apprenant/DEMO-3E-0001 "$TD")
check "DGES → stats nationales" 200 $(req GET /stats/national "$TD")

reinitialiser
bilan
