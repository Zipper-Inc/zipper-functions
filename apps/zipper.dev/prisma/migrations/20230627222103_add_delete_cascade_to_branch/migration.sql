/*
  Warnings:

  - You are about to drop the column `inputSchema` on the `scripts` table. All the data in the column will be lost.
  - You are about to drop the column `outputSchema` on the `scripts` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "scripts" DROP CONSTRAINT "scripts_branchId_fkey";

-- AlterTable
ALTER TABLE "scripts" DROP COLUMN "inputSchema",
DROP COLUMN "outputSchema";

-- AddForeignKey
ALTER TABLE "scripts" ADD CONSTRAINT "scripts_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
