# Fonctions communes aux tests d'API (à sourcer).
# Prérequis : ./start.sh lancé, conteneur PostgreSQL « mo-postgres » (docker-compose.yml).
A=${API_URL:-http://localhost:8080/api}
BODY=$(mktemp)
trap 'rm -f "$BODY"' EXIT
PSQL="docker exec -i ${PG_CONTAINER:-mo-postgres} psql -U mo_user -d mon_orientation -v ON_ERROR_STOP=1 -q"
ok=0; ko=0

# check <libellé> <attendu> <obtenu>
check() { if [ "$2" = "$3" ]; then ok=$((ok+1)); echo "✔ $1 ($3)"; else ko=$((ko+1)); echo "✘ $1 — attendu $2, obtenu $3 : $(head -c 260 "$BODY")"; fi; }
# req <méthode> <chemin> [jeton] [corps JSON] → affiche le code HTTP, corps de réponse dans $BODY
req() { curl -s -o "$BODY" -w '%{http_code}' -X "$1" "$A$2" -H 'Content-Type: application/json' ${3:+-H "Authorization: Bearer $3"} ${4:+-d "$4"}; }
# js '<corps de fonction>' : évalue du JavaScript sur la dernière réponse (variable j)
js() { node -e "const j=JSON.parse(require('fs').readFileSync('$BODY','utf8'));const v=(()=>{$1})();console.log(v===undefined||v===null?'':typeof v==='object'?JSON.stringify(v):v)" 2>/dev/null; }
jget() { js "return $1"; }
bilan() { echo "RÉSULTAT : $ok OK / $ko échec(s)"; [ "$ko" -eq 0 ]; }
