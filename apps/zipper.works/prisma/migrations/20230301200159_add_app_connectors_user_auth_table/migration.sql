-- AlterTable
ALTER TABLE "app_connectors" ADD COLUMN     "isUserAuthRequired" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "userScopes" TEXT[],
ADD COLUMN     "workspaceScopes" TEXT[];

-- CreateTable
CREATE TABLE "app_connector_user_auth" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(6),
    "connectorId" TEXT NOT NULL,
    "userId" TEXT,
    "metadata" JSONB,

    CONSTRAINT "app_connector_user_auth_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "app_connector_user_auth" ADD CONSTRAINT "app_connector_user_auth_connectorId_fkey" FOREIGN KEY ("connectorId") REFERENCES "app_connectors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
