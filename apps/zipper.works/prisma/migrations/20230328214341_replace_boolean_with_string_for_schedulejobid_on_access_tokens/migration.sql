/*
  Warnings:

  - You are about to drop the column `forScheduledJob` on the `app_access_tokens` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "app_access_tokens" DROP COLUMN "forScheduledJob",
ADD COLUMN     "scheduleId" TEXT;
