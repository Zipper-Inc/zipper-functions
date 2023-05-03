-- AlterTable
ALTER TABLE "app_access_tokens" ADD COLUMN     "scheduleId" TEXT;

-- AlterTable
ALTER TABLE "schedules" ADD COLUMN     "userId" TEXT;
