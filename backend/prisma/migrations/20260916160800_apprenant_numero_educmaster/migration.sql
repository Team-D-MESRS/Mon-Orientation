-- AlterTable
ALTER TABLE "apprenants" ADD COLUMN     "numero_educmaster" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "apprenants_numero_educmaster_key" ON "apprenants"("numero_educmaster");

