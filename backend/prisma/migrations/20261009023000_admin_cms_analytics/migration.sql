CREATE TYPE "TypeRessourceAdmin" AS ENUM ('FILIERE', 'ETABLISSEMENT', 'PAGE_SITE');
CREATE TYPE "EtatBrouillonAdmin" AS ENUM ('BROUILLON', 'PUBLIE');
CREATE TYPE "StatutPageSite" AS ENUM ('BROUILLON', 'PUBLIE', 'ARCHIVE');
CREATE TYPE "TypeEvenementUsage" AS ENUM ('RECHERCHE_CATALOGUE', 'CONSULTATION_FILIERE', 'UTILISATION_GUIDO');

ALTER TABLE "etablissements" ADD COLUMN "actif" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE "brouillons_admin" (
    "id" TEXT NOT NULL,
    "type" "TypeRessourceAdmin" NOT NULL,
    "cible_id" TEXT,
    "titre" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "etat" "EtatBrouillonAdmin" NOT NULL DEFAULT 'BROUILLON',
    "auteur_id" TEXT NOT NULL,
    "publie_le" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "brouillons_admin_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "brouillons_admin_auteur_id_fkey" FOREIGN KEY ("auteur_id") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "brouillons_admin_type_etat_updated_at_idx" ON "brouillons_admin"("type", "etat", "updated_at");

CREATE TABLE "historique_admin" (
    "id" TEXT NOT NULL,
    "auteur_id" TEXT NOT NULL,
    "type" "TypeRessourceAdmin" NOT NULL,
    "cible_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "avant" JSONB,
    "apres" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "historique_admin_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "historique_admin_auteur_id_fkey" FOREIGN KEY ("auteur_id") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "historique_admin_type_cible_id_created_at_idx" ON "historique_admin"("type", "cible_id", "created_at");

CREATE TABLE "pages_site" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "intro" TEXT,
    "sections" JSONB NOT NULL,
    "statut" "StatutPageSite" NOT NULL DEFAULT 'BROUILLON',
    "publie_le" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "pages_site_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "pages_site_slug_key" ON "pages_site"("slug");
CREATE INDEX "pages_site_statut_updated_at_idx" ON "pages_site"("statut", "updated_at");

CREATE TABLE "evenements_usage" (
    "id" TEXT NOT NULL,
    "jour" DATE NOT NULL,
    "type" "TypeEvenementUsage" NOT NULL,
    "dimension" TEXT NOT NULL DEFAULT '',
    "nombre" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "evenements_usage_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "evenements_usage_nombre_check" CHECK ("nombre" >= 0)
);
CREATE UNIQUE INDEX "evenements_usage_jour_type_dimension_key" ON "evenements_usage"("jour", "type", "dimension");
CREATE INDEX "evenements_usage_type_jour_idx" ON "evenements_usage"("type", "jour");
