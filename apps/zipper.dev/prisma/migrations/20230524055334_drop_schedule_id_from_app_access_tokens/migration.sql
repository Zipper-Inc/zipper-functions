/*
  Warnings:

  - You are about to drop the column `scheduleId` on the `app_access_tokens` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "app_access_tokens" DROP COLUMN "scheduleId";
