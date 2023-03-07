/*
  Warnings:

  - A unique constraint covering the columns `[appId,key]` on the table `secrets` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "secrets_appId_key_key" ON "secrets"("appId", "key");
