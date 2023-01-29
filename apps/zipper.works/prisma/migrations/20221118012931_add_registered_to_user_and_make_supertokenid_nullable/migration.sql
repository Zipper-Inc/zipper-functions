/*
  Warnings:

  - Added the required column `registered` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "app_editors_userId_appId_key";

-- DropIndex
DROP INDEX "users_superTokenId_key";

-- AlterTable
ALTER TABLE "app_editors" ADD CONSTRAINT "app_editors_pkey" PRIMARY KEY ("userId", "appId");

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "registered" BOOLEAN NOT NULL,
ALTER COLUMN "superTokenId" DROP NOT NULL;
