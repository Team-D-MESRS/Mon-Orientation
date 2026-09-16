-- AlterTable
ALTER TABLE "etablissements" ADD COLUMN     "externat" BOOLEAN,
ADD COLUMN     "internat" BOOLEAN,
ADD COLUMN     "quartier" TEXT;

-- AlterTable
ALTER TABLE "filieres" ADD COLUMN     "contenu_metier" JSONB;

-- CreateTable
CREATE TABLE "offres_formation" (
    "filiere_id" TEXT NOT NULL,
    "etablissement_id" TEXT NOT NULL,
    "duree" TEXT,
    "source" TEXT NOT NULL,

    CONSTRAINT "offres_formation_pkey" PRIMARY KEY ("filiere_id","etablissement_id")
);

-- CreateIndex
CREATE INDEX "offres_formation_etablissement_id_idx" ON "offres_formation"("etablissement_id");

-- AddForeignKey
ALTER TABLE "offres_formation" ADD CONSTRAINT "offres_formation_filiere_id_fkey" FOREIGN KEY ("filiere_id") REFERENCES "filieres"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offres_formation" ADD CONSTRAINT "offres_formation_etablissement_id_fkey" FOREIGN KEY ("etablissement_id") REFERENCES "etablissements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

