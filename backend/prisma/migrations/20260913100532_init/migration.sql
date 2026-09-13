-- CreateEnum
CREATE TYPE "Role" AS ENUM ('APPRENANT', 'PARENT', 'ETABLISSEMENT', 'DGES', 'ADMIN');

-- CreateEnum
CREATE TYPE "Palier" AS ENUM ('QUATRIEME', 'TROISIEME', 'PREMIERE', 'TERMINALE');

-- CreateEnum
CREATE TYPE "TypeFiliere" AS ENUM ('GENERALE', 'TECHNIQUE', 'TECHNIQUE_AGRICOLE', 'PROFESSIONNELLE', 'ECOLE_METIER', 'UNIVERSITE');

-- CreateEnum
CREATE TYPE "TypeEtablissement" AS ENUM ('LYCEE_GENERAL', 'LYCEE_TECHNIQUE', 'LYCEE_PRO', 'ECOLE_METIER', 'UNIVERSITE');

-- CreateTable
CREATE TABLE "utilisateurs" (
    "id" TEXT NOT NULL,
    "nip" TEXT,
    "email" TEXT,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "hash_mot_de_passe" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'APPRENANT',
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "derniere_connexion" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "utilisateurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "utilisateur_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "refresh_token" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "apprenants" (
    "nip" TEXT NOT NULL,
    "utilisateur_id" TEXT,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "date_naissance" TIMESTAMP(3) NOT NULL,
    "sexe" TEXT NOT NULL,
    "departement" TEXT NOT NULL,
    "commune" TEXT NOT NULL,
    "derniere_sync" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "apprenants_pkey" PRIMARY KEY ("nip")
);

-- CreateTable
CREATE TABLE "parent_apprenant" (
    "id" TEXT NOT NULL,
    "parent_user_id" TEXT NOT NULL,
    "apprenant_nip" TEXT NOT NULL,
    "relation" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parent_apprenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "etablissements" (
    "id" TEXT NOT NULL,
    "educmaster_id" TEXT,
    "nom" TEXT NOT NULL,
    "type" "TypeEtablissement" NOT NULL,
    "departement" TEXT NOT NULL,
    "commune" TEXT NOT NULL,
    "capacite" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "etablissements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "filieres" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "type" "TypeFiliere" NOT NULL,
    "description" TEXT,
    "diplomes_delivres" JSONB,
    "metiers_vises" JSONB,
    "debouches" TEXT,
    "taux_insertion" DOUBLE PRECISION,
    "conditions_acces" TEXT,
    "bourses" BOOLEAN NOT NULL DEFAULT false,
    "etablissement_id" TEXT,
    "image_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "filieres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notes" (
    "id" TEXT NOT NULL,
    "apprenant_nip" TEXT NOT NULL,
    "matiere" TEXT NOT NULL,
    "note" DOUBLE PRECISION NOT NULL,
    "bareme" INTEGER NOT NULL DEFAULT 20,
    "trimestre" INTEGER NOT NULL,
    "annee_scolaire" TEXT NOT NULL,
    "derniere_sync" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "filiere_id" TEXT,

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "preferences" (
    "id" TEXT NOT NULL,
    "apprenant_nip" TEXT NOT NULL,
    "palier" "Palier" NOT NULL,
    "filiere_id_1" TEXT,
    "filiere_id_2" TEXT,
    "filiere_id_3" TEXT,
    "motivation" TEXT,
    "date_saisie" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valide_parent" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommandations" (
    "id" TEXT NOT NULL,
    "apprenant_nip" TEXT NOT NULL,
    "palier" "Palier" NOT NULL,
    "filiere_id" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "explication" TEXT,
    "date_generation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "recommandations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations_ia" (
    "id" TEXT NOT NULL,
    "apprenant_nip" TEXT NOT NULL,
    "messages" JSONB NOT NULL,
    "langue" TEXT NOT NULL DEFAULT 'fr',
    "palier" "Palier" NOT NULL,
    "date_debut" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_fin" TIMESTAMP(3),
    "filiere_id" TEXT,

    CONSTRAINT "conversations_ia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "utilisateurs_nip_key" ON "utilisateurs"("nip");

-- CreateIndex
CREATE UNIQUE INDEX "utilisateurs_email_key" ON "utilisateurs"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_refresh_token_key" ON "sessions"("refresh_token");

-- CreateIndex
CREATE UNIQUE INDEX "apprenants_utilisateur_id_key" ON "apprenants"("utilisateur_id");

-- CreateIndex
CREATE UNIQUE INDEX "etablissements_educmaster_id_key" ON "etablissements"("educmaster_id");

-- CreateIndex
CREATE UNIQUE INDEX "notes_apprenant_nip_matiere_trimestre_annee_scolaire_key" ON "notes"("apprenant_nip", "matiere", "trimestre", "annee_scolaire");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "apprenants" ADD CONSTRAINT "apprenants_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_apprenant" ADD CONSTRAINT "parent_apprenant_parent_user_id_fkey" FOREIGN KEY ("parent_user_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_apprenant" ADD CONSTRAINT "parent_apprenant_apprenant_nip_fkey" FOREIGN KEY ("apprenant_nip") REFERENCES "apprenants"("nip") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "filieres" ADD CONSTRAINT "filieres_etablissement_id_fkey" FOREIGN KEY ("etablissement_id") REFERENCES "etablissements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_apprenant_nip_fkey" FOREIGN KEY ("apprenant_nip") REFERENCES "apprenants"("nip") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_filiere_id_fkey" FOREIGN KEY ("filiere_id") REFERENCES "filieres"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preferences" ADD CONSTRAINT "preferences_apprenant_nip_fkey" FOREIGN KEY ("apprenant_nip") REFERENCES "apprenants"("nip") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preferences" ADD CONSTRAINT "preferences_filiere_id_1_fkey" FOREIGN KEY ("filiere_id_1") REFERENCES "filieres"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preferences" ADD CONSTRAINT "preferences_filiere_id_2_fkey" FOREIGN KEY ("filiere_id_2") REFERENCES "filieres"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preferences" ADD CONSTRAINT "preferences_filiere_id_3_fkey" FOREIGN KEY ("filiere_id_3") REFERENCES "filieres"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommandations" ADD CONSTRAINT "recommandations_apprenant_nip_fkey" FOREIGN KEY ("apprenant_nip") REFERENCES "apprenants"("nip") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommandations" ADD CONSTRAINT "recommandations_filiere_id_fkey" FOREIGN KEY ("filiere_id") REFERENCES "filieres"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations_ia" ADD CONSTRAINT "conversations_ia_apprenant_nip_fkey" FOREIGN KEY ("apprenant_nip") REFERENCES "apprenants"("nip") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations_ia" ADD CONSTRAINT "conversations_ia_filiere_id_fkey" FOREIGN KEY ("filiere_id") REFERENCES "filieres"("id") ON DELETE SET NULL ON UPDATE CASCADE;
