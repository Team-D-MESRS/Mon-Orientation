#!/bin/bash
# Catalogue : recherche sans accents, filtres (série du bac, domaine, bourses, sources) et formations mises de côté.
source "$(dirname "$0")/../lib.sh"
jeton() { req POST /auth/connexion "" "{\"identifiant\":\"$1\",\"motDePasse\":\"${2:-Demo2026!}\"}" >/dev/null; js 'return j.accessToken'; }
enc() { node -e 'console.log(encodeURIComponent(process.argv[1]))' "$1"; }
# liste <paramètres> : GET /filiere (100 résultats au plus), corps de réponse dans $BODY
liste() { req GET "/filiere?limit=100&$1"; }
contient() { js "return j.items.some(f=>f.code===\"$1\")"; }
codes() { js 'return j.items.map(f=>f.code).join(" ")'; }
id_code() { liste "search=$(enc "$1")" >/dev/null; js "return j.items.find(f=>f.code===\"$1\")?.id"; }
sql() { $PSQL -At -c "$1"; }
nettoyer() { sql "delete from favoris where apprenant_nip like 'DEMO-%'"; }

curl -s -o /dev/null --retry 30 --retry-all-errors --retry-delay 1 --max-time 3 $A/docs
nettoyer

echo "── Recherche"
check "« electricite » sans accent" 200 $(liste "search=electricite")
N1=$(jget 'j.total')
check "  trouve le DTM Électricité" true "$(contient DTM-LTP-ELEC-ENERGIE)"
check "  même résultat avec les accents" "$N1" "$(liste "search=$(enc électricité)" >/dev/null; jget 'j.total')"
check "  et en majuscules" "$N1" "$(liste "search=ELECTRICITE" >/dev/null; jget 'j.total')"
check "par métier : installateur solaire → DTM Énergies renouvelables" true "$(liste "search=$(enc 'installateur solaire')" >/dev/null; contient DTM-LTP-ENR)"
check "« oeuvre » trouve « gros œuvre »" true "$(liste "search=oeuvre" >/dev/null; contient DTM-LTP-GROS-OEUVRE)"
check "par lieu de formation : Parakou → EFMS" true "$(liste "search=Parakou" >/dev/null; contient EFMS-HYGIENISTE-SALLES)"
check "apostrophe typographique : « l’eau »" true "$(liste "search=$(enc 'l’eau')" >/dev/null; contient DT-QUALITE-EAU)"
check "pertinence : Médecine en tête pour « medecine »" UNIV-FSS-MEDECINE "$(liste "search=medecine" >/dev/null; jget 'j.items[0].code')"
check "pertinence : les noms contenant « informatique » d'abord" true "$(liste "search=informatique" >/dev/null; js 'const n=s=>s.normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase();const k=j.items.map(f=>n(f.nom).includes("informatique"));return k[0]&&(k.indexOf(false)===-1||k.lastIndexOf(true)<k.indexOf(false))')"
echo "  → $(codes)"
check "« % » n'est pas un joker" 0 "$(liste "search=%25" >/dev/null; jget 'j.total')"
check "injection SQL sans effet" 0 "$(liste "search=$(enc "' OR 1=1 --")" >/dev/null; jget 'j.total')"
check "paramètre répété → 400" 400 $(req GET "/filiere?search=a&search=b")
P1=$(req GET "/filiere?search=dtm&limit=10&page=1" >/dev/null; js 'return j.items.map(f=>f.id).join(",")')
check "recherche paginée : 19 DTM" 19 "$(jget 'j.total')"
P2=$(req GET "/filiere?search=dtm&limit=10&page=2" >/dev/null; js 'return j.items.map(f=>f.id).join(",")')
check "  page 2 : les 9 suivants, sans doublon" true "$(node -e 'const [a,b]=process.argv.slice(1).map(s=>s.split(","));console.log(b.length===9&&!b.some(x=>a.includes(x)))' "$P1" "$P2")"
check "recherche + type : 10 DTM agricoles" 10 "$(liste "search=dtm&type=TECHNIQUE_AGRICOLE" >/dev/null; jget 'j.total')"

echo "── Séries du bac"
check "bac D" 200 $(liste "serie=D")
ND=$(jget 'j.total')
check "  médecine admise" ADMISE "$(js 'return j.items.find(f=>f.code==="UNIV-FSS-MEDECINE")?.accesSerie')"
check "  droit sous conditions" SOUS_CONDITIONS "$(js 'return j.items.find(f=>f.code==="UNIV-FADESP-DROIT")?.accesSerie')"
check "  ni lettres (séries A) ni INSTI (bacs techniques)" true "$(js 'return !j.items.some(f=>/^UNIV-(FLASH|INSTI)/.test(f.code))')"
check "  uniquement des formations du supérieur" true "$(js 'return j.items.every(f=>f.niveauAcces==="APRES_BAC")')"
echo "  → $ND formations : $(codes)"
check "  « d » en minuscule" "$ND" "$(liste "serie=d" >/dev/null; jget 'j.total')"
check "bac A1 : lettres, droit, économie ; pas médecine" true "$(liste "serie=A1" >/dev/null; js 'const c=j.items.map(f=>f.code);return c.includes("UNIV-FLASH-LETTRES")&&c.includes("UNIV-FADESP-DROIT")&&c.includes("UNIV-FASEG-ECONOMIE")&&!c.includes("UNIV-FSS-MEDECINE")')"
check "bac F3 : INSTI et classes prépa ; pas médecine" true "$(liste "serie=F3" >/dev/null; js 'const c=j.items.map(f=>f.code);return c.includes("UNIV-INSTI-MAINT-INDUSTRIELLE")&&c.includes("UNIV-IMSP-PREPA")&&!c.includes("UNIV-FSS-MEDECINE")')"
check "série inconnue → 400" 400 $(liste "serie=ZZ")
check "série + après le BEPC → aucune" 0 "$(liste "serie=D&niveau=APRES_BEPC" >/dev/null; jget 'j.total')"
check "série + recherche" UNIV-FSS-MEDECINE "$(liste "serie=D&search=medecine" >/dev/null; codes)"

echo "── Domaines, bourses, sources"
check "valeurs des filtres" 200 $(req GET /filiere/filtres)
check "  14 domaines, tous représentés" true "$(js 'return j.domaines.length===14&&j.domaines.every(d=>d.total>0)')"
check "  14 séries du bac" 14 "$(js 'return j.series.length')"
check "  série D reliée à sa fiche" true "$(js 'const d=j.series.find(s=>s.serie==="D");return !!d&&!!d.filiereId&&d.libelle==="Biologie – Géologie"')"
NNUM=$(js 'return j.domaines.find(d=>d.code==="NUMERIQUE").total')
check "domaine Numérique" "$NNUM" "$(liste "domaine=NUMERIQUE" >/dev/null; jget 'j.total')"
check "  toutes classées Numérique" true "$(js 'return j.items.every(f=>f.domaines.includes("NUMERIQUE"))')"
check "domaine inconnu → 400" 400 $(liste "domaine=CUISINE")
liste "" >/dev/null
NT=$(jget 'j.total')
check "chaque filière a au moins un domaine" true "$(js 'return j.total===j.items.length&&j.items.every(f=>f.domaines.length>0)')"
check "avec bourses" true "$(liste "bourses=true" >/dev/null; js 'return j.total>0&&j.items.every(f=>f.bourses===true)')"
check "bourses=peut-etre → 400" 400 $(liste "bourses=peut-etre")
liste "officielle=true" >/dev/null
NO=$(jget 'j.total')
check "source officielle" true "$(js 'return j.total>0&&j.items.every(f=>f.sources.some(s=>s.officielle))')"
liste "officielle=false" >/dev/null
check "à confirmer : aucune source officielle" true "$(js 'return j.total>0&&j.items.every(f=>!f.sources?.some(s=>s.officielle))')"
check "  officielles + à confirmer = tout le catalogue ($NT)" "$NT" "$((NO + $(jget 'j.total')))"

echo "── Formations mises de côté"
TF=$(jeton DEMO-3E-0001); TK=$(jeton DEMO-TLE-0001); TP=$(jeton parent.demo@monorientation.bj); TA=$(jeton admin@monorientation.bj "${ADMIN_PASSWORD:-admin123}")
MED=$(id_code UNIV-FSS-MEDECINE); C=$(id_code BAC-C)
F=/apprenant/DEMO-3E-0001/favoris
check "sans connexion → 401" 401 $(req GET $F)
check "Fatou : aucune au départ" 0 "$(req GET $F "$TF" >/dev/null; jget 'j.length')"
check "Fatou met Médecine de côté" 204 $(req PUT $F/$MED "$TF")
check "  une seconde fois : sans effet" 204 $(req PUT $F/$MED "$TF")
check "Fatou met la série C de côté" 204 $(req PUT $F/$C "$TF")
check "  2 formations, la plus récente d'abord" "BAC-C UNIV-FSS-MEDECINE" "$(req GET $F "$TF" >/dev/null; js 'return j.map(f=>f.filiere.code).join(" ")')"
check "parent → consulte" 2 "$(req GET $F "$TP" >/dev/null; jget 'j.length')"
check "admin → consulte" 200 $(req GET $F "$TA")
check "parent ne modifie pas → 403" 403 $(req PUT $F/$MED "$TP")
check "autre élève ne modifie pas → 403" 403 $(req PUT $F/$MED "$TK")
check "autre élève ne consulte pas → 403" 403 $(req GET $F "$TK")
check "filière inconnue → 404" 404 $(req PUT $F/$(node -e 'console.log(crypto.randomUUID())') "$TF")
check "identifiant invalide → 400" 400 $(req PUT $F/pas-un-uuid "$TF")
check "Fatou retire Médecine" 204 $(req DELETE $F/$MED "$TF")
check "  une seconde fois : sans effet" 204 $(req DELETE $F/$MED "$TF")
check "  reste la série C" BAC-C "$(req GET $F "$TF" >/dev/null; js 'return j.map(f=>f.filiere.code).join(" ")')"
sql "insert into favoris (apprenant_nip, filiere_id) select 'DEMO-TLE-0001', id from filieres order by id limit 50"
check "au-delà de 50 formations → 400" 400 $(req PUT /apprenant/DEMO-TLE-0001/favoris/$(sql "select id from filieres order by id offset 50 limit 1") "$TK")
check "  une formation déjà mise de côté reste acceptée" 204 $(req PUT /apprenant/DEMO-TLE-0001/favoris/$(sql "select id from filieres order by id limit 1") "$TK")
nettoyer
bilan
