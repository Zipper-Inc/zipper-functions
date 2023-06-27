/*
  Warnings:

  - You are about to drop the column `appId` on the `scripts` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[branchId,filename]` on the table `scripts` will be added. If there are existing duplicate values, this will fail.
  - Made the column `branchId` on table `scripts` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "scripts" DROP CONSTRAINT "scripts_appId_fkey";

-- DropIndex
DROP INDEX "scripts_appId_filename_key";

-- AlterTable
ALTER TABLE "scripts" DROP COLUMN "appId",
ALTER COLUMN "branchId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "scripts_branchId_filename_key" ON "scripts"("branchId", "filename");

-- AddForeignKey
ALTER TABLE "scripts" ADD CONSTRAINT "scripts_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
