/*
  Warnings:

  - A unique constraint covering the columns `[appId,name]` on the table `branches` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "branches_appId_name_key" ON "branches"("appId", "name");
