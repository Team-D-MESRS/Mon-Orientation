-- AlterTable
ALTER TABLE "etablissements" ADD COLUMN     "code" TEXT,
ADD COLUMN     "sigle" TEXT,
ADD COLUMN     "universite" TEXT,
ALTER COLUMN "departement" DROP NOT NULL,
ALTER COLUMN "commune" DROP NOT NULL;

-- AlterTable
ALTER TABLE "filieres" ADD COLUMN     "matieres_classement" TEXT,
ADD COLUMN     "matieres_cles" JSONB,
ADD COLUMN     "mode_entree" TEXT,
ADD COLUMN     "quota_aides" INTEGER,
ADD COLUMN     "quota_bourses" INTEGER,
ADD COLUMN     "series_recommandees" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "etablissements_code_key" ON "etablissements"("code");

