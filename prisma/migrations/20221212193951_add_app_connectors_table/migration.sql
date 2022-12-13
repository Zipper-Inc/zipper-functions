-- CreateTable
CREATE TABLE "app_connectors" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(6),
    "type" TEXT NOT NULL,
    "appId" TEXT NOT NULL,

    CONSTRAINT "app_connectors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "app_connectors_appId_type_key" ON "app_connectors"("appId", "type");

-- AddForeignKey
ALTER TABLE "app_connectors" ADD CONSTRAINT "app_connectors_appId_fkey" FOREIGN KEY ("appId") REFERENCES "apps"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
