-- AlterEnum
BEGIN;
CREATE TYPE "TypeFiliere_new" AS ENUM ('GENERALE', 'TECHNIQUE', 'TECHNIQUE_AGRICOLE', 'PROFESSIONNELLE', 'UNIVERSITE');
ALTER TABLE "filieres" ALTER COLUMN "type" TYPE "TypeFiliere_new" USING ("type"::text::"TypeFiliere_new");
ALTER TYPE "TypeFiliere" RENAME TO "TypeFiliere_old";
ALTER TYPE "TypeFiliere_new" RENAME TO "TypeFiliere";
DROP TYPE "TypeFiliere_old";
COMMIT;

