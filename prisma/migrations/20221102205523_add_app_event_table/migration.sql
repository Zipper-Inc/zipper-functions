-- CreateTable
CREATE TABLE "apps_events" (
    "id" TEXT NOT NULL,
    "timestamp" TEXT NOT NULL,
    "deploymentId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventPayload" JSONB NOT NULL,

    CONSTRAINT "apps_events_pkey" PRIMARY KEY ("id")
);
