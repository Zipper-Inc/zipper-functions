/*
  Warnings:

  - Added the required column `userId` to the `schedules` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "schedules" ADD COLUMN     "userId" TEXT NOT NULL;
