-- AlterTable
ALTER TABLE "schedules" ADD COLUMN     "inputs" JSONB;

-- CreateTable
CREATE TABLE "apps_runs" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "success" BOOLEAN NOT NULL,
    "deploymentId" TEXT NOT NULL,
    "scheduled" BOOLEAN NOT NULL DEFAULT false,
    "result" JSONB,
    "inputs" JSONB,
    "appId" TEXT NOT NULL,

    CONSTRAINT "apps_runs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "apps_runs" ADD CONSTRAINT "apps_runs_appId_fkey" FOREIGN KEY ("appId") REFERENCES "apps"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
