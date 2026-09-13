-- CreateEnum
CREATE TYPE "NiveauAcces" AS ENUM ('APRES_BEPC', 'APRES_BAC');

-- AlterTable
ALTER TABLE "filieres" ADD COLUMN     "code" TEXT,
ADD COLUMN     "niveau_acces" "NiveauAcces",
ADD COLUMN     "ou_se_former" TEXT,
ADD COLUMN     "series_admises" JSONB,
ADD COLUMN     "sources" JSONB,
ALTER COLUMN "bourses" DROP NOT NULL,
ALTER COLUMN "bourses" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "filieres_code_key" ON "filieres"("code");

