-- CreateTable
CREATE TABLE "app_settings" (
    "settingName" VARCHAR NOT NULL,
    "settingValue" VARCHAR NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(6),
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "appId" TEXT NOT NULL,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("settingName","appId")
);

-- CreateIndex
CREATE UNIQUE INDEX "app_settings_appId_settingName_key" ON "app_settings"("appId", "settingName");

-- AddForeignKey
ALTER TABLE "app_settings" ADD CONSTRAINT "app_settings_appId_fkey" FOREIGN KEY ("appId") REFERENCES "apps"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
