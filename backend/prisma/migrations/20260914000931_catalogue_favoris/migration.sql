-- Recherche du catalogue insensible aux accents (extension « de confiance » depuis PostgreSQL 13 :
-- le propriétaire de la base peut la créer sans être superutilisateur)
CREATE EXTENSION IF NOT EXISTS unaccent;

-- AlterTable
ALTER TABLE "filieres" ADD COLUMN     "domaines" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "favoris" (
    "apprenant_nip" TEXT NOT NULL,
    "filiere_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favoris_pkey" PRIMARY KEY ("apprenant_nip","filiere_id")
);

-- AddForeignKey
ALTER TABLE "favoris" ADD CONSTRAINT "favoris_apprenant_nip_fkey" FOREIGN KEY ("apprenant_nip") REFERENCES "apprenants"("nip") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favoris" ADD CONSTRAINT "favoris_filiere_id_fkey" FOREIGN KEY ("filiere_id") REFERENCES "filieres"("id") ON DELETE CASCADE ON UPDATE CASCADE;

