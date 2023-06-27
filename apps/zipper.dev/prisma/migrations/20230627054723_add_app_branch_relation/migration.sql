-- AlterTable
ALTER TABLE "apps" ADD COLUMN     "branchId" TEXT;

-- AddForeignKey
ALTER TABLE "branches" ADD CONSTRAINT "branches_appId_fkey" FOREIGN KEY ("appId") REFERENCES "apps"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

UPDATE "apps"
SET "branchId" = branches.id
FROM branches
WHERE branches."appId" = apps.id;
