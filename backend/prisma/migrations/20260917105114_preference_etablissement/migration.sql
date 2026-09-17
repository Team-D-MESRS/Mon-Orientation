-- AlterTable
ALTER TABLE "preferences" ADD COLUMN     "etablissement_id" TEXT;

-- AddForeignKey
ALTER TABLE "preferences" ADD CONSTRAINT "preferences_etablissement_id_fkey" FOREIGN KEY ("etablissement_id") REFERENCES "etablissements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

