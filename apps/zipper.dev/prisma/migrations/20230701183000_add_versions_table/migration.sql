/*
  Warnings:

  - You are about to drop the column `hash` on the `apps` table. All the data in the column will be lost.
  - You are about to drop the column `lastDeploymentVersion` on the `apps` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[publishedVersionHash]` on the table `apps` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[playgroundVersionHash]` on the table `apps` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "apps" DROP COLUMN "hash",
DROP COLUMN "lastDeploymentVersion",
ADD COLUMN     "playgroundVersionHash" TEXT,
ADD COLUMN     "publishedVersionHash" TEXT;

-- CreateTable
CREATE TABLE "versions" (
    "hash" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "buildFile" BYTEA NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "versions_pkey" PRIMARY KEY ("hash")
);

-- CreateIndex
CREATE UNIQUE INDEX "versions_appId_hash_key" ON "versions"("appId", "hash");

-- CreateIndex
CREATE UNIQUE INDEX "apps_publishedVersionHash_key" ON "apps"("publishedVersionHash");

-- CreateIndex
CREATE UNIQUE INDEX "apps_playgroundVersionHash_key" ON "apps"("playgroundVersionHash");

-- AddForeignKey
ALTER TABLE "apps" ADD CONSTRAINT "apps_publishedVersionHash_fkey" FOREIGN KEY ("publishedVersionHash") REFERENCES "versions"("hash") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "apps" ADD CONSTRAINT "apps_playgroundVersionHash_fkey" FOREIGN KEY ("playgroundVersionHash") REFERENCES "versions"("hash") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "versions" ADD CONSTRAINT "versions_appId_fkey" FOREIGN KEY ("appId") REFERENCES "apps"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
