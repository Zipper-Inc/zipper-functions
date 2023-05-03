/*
  Warnings:

  - You are about to drop the `organization_slugs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `resoure_instances` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "organization_slugs";

-- DropTable
DROP TABLE "resoure_instances";

-- CreateTable
CREATE TABLE "resource_owner_slugs" (
    "slug" TEXT NOT NULL,
    "resourceOwnerType" INTEGER NOT NULL,
    "resourceOwnerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(6),

    CONSTRAINT "resource_owner_slugs_pkey" PRIMARY KEY ("slug")
);

-- CreateIndex
CREATE UNIQUE INDEX "resource_owner_slugs_slug_key" ON "resource_owner_slugs"("slug");
