/*
  Warnings:

  - A unique constraint covering the columns `[appId,filename]` on the table `scripts` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "scripts_appId_filename_key" ON "scripts"("appId", "filename");
