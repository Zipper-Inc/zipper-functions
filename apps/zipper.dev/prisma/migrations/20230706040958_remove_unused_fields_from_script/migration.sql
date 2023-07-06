/*
  Warnings:

  - You are about to drop the column `description` on the `scripts` table. All the data in the column will be lost.
  - You are about to drop the column `inputSchema` on the `scripts` table. All the data in the column will be lost.
  - You are about to drop the column `outputSchema` on the `scripts` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "scripts" DROP COLUMN "description",
DROP COLUMN "inputSchema",
DROP COLUMN "outputSchema";
