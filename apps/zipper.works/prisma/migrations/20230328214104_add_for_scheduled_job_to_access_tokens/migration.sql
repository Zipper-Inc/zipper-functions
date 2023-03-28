-- AlterTable
ALTER TABLE "app_access_tokens" ADD COLUMN     "forScheduledJob" BOOLEAN NOT NULL DEFAULT false;
