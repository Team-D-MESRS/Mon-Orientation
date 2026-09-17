-- CreateTable
CREATE TABLE "decouvertes" (
    "apprenant_nip" TEXT NOT NULL,
    "reponses" JSONB NOT NULL,
    "affinites" JSONB NOT NULL,
    "date_saisie" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "decouvertes_pkey" PRIMARY KEY ("apprenant_nip")
);

-- AddForeignKey
ALTER TABLE "decouvertes" ADD CONSTRAINT "decouvertes_apprenant_nip_fkey" FOREIGN KEY ("apprenant_nip") REFERENCES "apprenants"("nip") ON DELETE CASCADE ON UPDATE CASCADE;

