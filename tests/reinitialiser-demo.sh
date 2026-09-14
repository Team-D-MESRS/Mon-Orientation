#!/bin/bash
# Remet les dossiers de démonstration dans leur état initial : sans vœux, recommandations ni formations
# mises de côté, Adama sans compte.
docker exec -i ${PG_CONTAINER:-mo-postgres} psql -U mo_user -d mon_orientation -q <<SQL
delete from preferences where apprenant_nip like 'DEMO-%';
delete from favoris where apprenant_nip like 'DEMO-%';
delete from recommandations where apprenant_nip like 'DEMO-%';
delete from conversations_ia where apprenant_nip like 'DEMO-%';
delete from utilisateurs where nip = 'DEMO-4E-0001';
SQL
echo "Données de démonstration réinitialisées."
