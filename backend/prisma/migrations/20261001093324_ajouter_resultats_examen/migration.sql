-- CreateEnum
CREATE TYPE "Examen" AS ENUM ('BEPC', 'BAC');

-- CreateTable
CREATE TABLE "resultats_examen" (
    "id" TEXT NOT NULL,
    "apprenant_nip" TEXT NOT NULL,
    "examen" "Examen" NOT NULL,
    "matiere" TEXT NOT NULL,
    "note" DOUBLE PRECISION NOT NULL,
    "bareme" INTEGER NOT NULL DEFAULT 20,
    "annee_scolaire" TEXT NOT NULL,
    "derniere_sync" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resultats_examen_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "resultats_examen_apprenant_nip_examen_matiere_annee_scolair_key" ON "resultats_examen"("apprenant_nip", "examen", "matiere", "annee_scolaire");

-- AddForeignKey
ALTER TABLE "resultats_examen" ADD CONSTRAINT "resultats_examen_apprenant_nip_fkey" FOREIGN KEY ("apprenant_nip") REFERENCES "apprenants"("nip") ON DELETE CASCADE ON UPDATE CASCADE;

