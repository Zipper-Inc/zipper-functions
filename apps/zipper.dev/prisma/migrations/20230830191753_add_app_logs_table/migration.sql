-- CreateTable
CREATE TABLE "app_logs" (
    "id" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "timestamp" INTEGER NOT NULL,
    "appId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "runId" TEXT,

    CONSTRAINT "app_logs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "app_logs" ADD CONSTRAINT "app_logs_appId_fkey" FOREIGN KEY ("appId") REFERENCES "apps"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_logs" ADD CONSTRAINT "app_logs_runId_fkey" FOREIGN KEY ("runId") REFERENCES "apps_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
