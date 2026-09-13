-- AlterTable
ALTER TABLE "apprenants" ADD COLUMN     "palier" "Palier",
ADD COLUMN     "serie" TEXT;

-- AlterTable
ALTER TABLE "preferences" ADD COLUMN     "date_validation_parent" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "recommandations" ADD COLUMN     "criteres" JSONB;

-- CreateIndex
CREATE UNIQUE INDEX "preferences_apprenant_nip_palier_key" ON "preferences"("apprenant_nip", "palier");

