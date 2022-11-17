-- AlterTable
ALTER TABLE "apps" ADD COLUMN     "parentId" TEXT;

-- AddForeignKey
ALTER TABLE "apps" ADD CONSTRAINT "apps_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "apps"("id") ON DELETE SET NULL ON UPDATE CASCADE;
