-- AlterTable
ALTER TABLE "scripts" ADD COLUMN     "branchId" TEXT;

UPDATE "scripts"
SET "branchId" = branches.id
FROM branches
WHERE branches."appId" = scripts."appId";