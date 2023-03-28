/*
  Warnings:

  - The primary key for the `app_access_tokens` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `encryptedToken` on the `app_access_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `app_access_tokens` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[identifier]` on the table `app_access_tokens` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[hashedSecret]` on the table `app_access_tokens` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `hashedSecret` to the `app_access_tokens` table without a default value. This is not possible if the table is not empty.
  - Added the required column `identifier` to the `app_access_tokens` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "app_access_tokens_encryptedToken_key";

-- AlterTable
ALTER TABLE "app_access_tokens" DROP CONSTRAINT "app_access_tokens_pkey",
DROP COLUMN "encryptedToken",
DROP COLUMN "id",
ADD COLUMN     "hashedSecret" TEXT NOT NULL,
ADD COLUMN     "identifier" TEXT NOT NULL,
ADD CONSTRAINT "app_access_tokens_pkey" PRIMARY KEY ("identifier", "appId");

-- CreateIndex
CREATE UNIQUE INDEX "app_access_tokens_identifier_key" ON "app_access_tokens"("identifier");

-- CreateIndex
CREATE UNIQUE INDEX "app_access_tokens_hashedSecret_key" ON "app_access_tokens"("hashedSecret");
