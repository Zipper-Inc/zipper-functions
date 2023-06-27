/*
  Warnings:

  - You are about to drop the column `hash` on the `apps` table. All the data in the column will be lost.
  - You are about to drop the column `lastDeploymentVersion` on the `apps` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "apps" DROP COLUMN "hash",
DROP COLUMN "lastDeploymentVersion";

-- AlterTable
ALTER TABLE "branches" ADD COLUMN     "hash" TEXT;
