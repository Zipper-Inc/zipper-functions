/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `apps` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `apps` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "apps" ADD COLUMN     "lastDeploymentVersion" TEXT,
ADD COLUMN     "slug" VARCHAR(60) NOT NULL,
ALTER COLUMN "name" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "apps_slug_key" ON "apps"("slug");
