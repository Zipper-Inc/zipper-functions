/*
  Warnings:

  - You are about to drop the column `scheduled` on the `apps_runs` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "apps_runs" DROP COLUMN "scheduled",
ADD COLUMN     "scheduleId" TEXT;

-- AddForeignKey
ALTER TABLE "apps_runs" ADD CONSTRAINT "apps_runs_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "schedules"("id") ON DELETE SET NULL ON UPDATE CASCADE;
