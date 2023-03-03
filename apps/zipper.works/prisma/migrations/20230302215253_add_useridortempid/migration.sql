/*
  Warnings:

  - You are about to drop the column `connectorId` on the `app_connector_user_auth` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `app_connector_user_auth` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[appId,connectorType,userIdOrTempId]` on the table `app_connector_user_auth` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `appId` to the `app_connector_user_auth` table without a default value. This is not possible if the table is not empty.
  - Added the required column `connectorType` to the `app_connector_user_auth` table without a default value. This is not possible if the table is not empty.
  - Added the required column `encryptedAccessToken` to the `app_connector_user_auth` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userIdOrTempId` to the `app_connector_user_auth` table without a default value. This is not possible if the table is not empty.
  - Made the column `metadata` on table `app_connector_user_auth` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "app_connector_user_auth" DROP CONSTRAINT "app_connector_user_auth_connectorId_fkey";

-- AlterTable
ALTER TABLE "app_connector_user_auth" DROP COLUMN "connectorId",
DROP COLUMN "userId",
ADD COLUMN     "appId" TEXT NOT NULL,
ADD COLUMN     "connectorType" TEXT NOT NULL,
ADD COLUMN     "encryptedAccessToken" TEXT NOT NULL,
ADD COLUMN     "userIdOrTempId" TEXT NOT NULL,
ALTER COLUMN "metadata" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "app_connector_user_auth_appId_connectorType_userIdOrTempId_key" ON "app_connector_user_auth"("appId", "connectorType", "userIdOrTempId");

-- AddForeignKey
ALTER TABLE "app_connector_user_auth" ADD CONSTRAINT "app_connector_user_auth_appId_connectorType_fkey" FOREIGN KEY ("appId", "connectorType") REFERENCES "app_connectors"("appId", "type") ON DELETE CASCADE ON UPDATE CASCADE;
