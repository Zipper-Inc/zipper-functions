/*
  Warnings:

  - Made the column `branchId` on table `apps` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "apps" ALTER COLUMN "branchId" SET NOT NULL;
