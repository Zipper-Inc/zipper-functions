/*
  Warnings:

  - The primary key for the `organization_memberships` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `organization_memberships` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "organization_memberships" DROP CONSTRAINT "organization_memberships_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "organization_memberships_pkey" PRIMARY KEY ("organizationId", "userId");
