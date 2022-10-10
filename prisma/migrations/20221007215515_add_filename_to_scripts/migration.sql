/*
  Warnings:

  - Added the required column `filename` to the `scripts` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "scripts" ADD COLUMN     "filename" TEXT NOT NULL;
