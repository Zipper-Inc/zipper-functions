-- AlterTable
ALTER TABLE "schedules" ADD COLUMN     "fromConfig" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "name" TEXT;
