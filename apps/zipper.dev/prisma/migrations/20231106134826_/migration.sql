/*
  Warnings:

  - You are about to drop the column `appId` on the `discord_zipper_slash_command_installs` table. All the data in the column will be lost.
  - You are about to drop the column `botUserId` on the `discord_zipper_slash_command_installs` table. All the data in the column will be lost.
  - You are about to drop the column `installers` on the `discord_zipper_slash_command_installs` table. All the data in the column will be lost.
  - You are about to drop the column `teamId` on the `discord_zipper_slash_command_installs` table. All the data in the column will be lost.
  - You are about to drop the column `teamName` on the `discord_zipper_slash_command_installs` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[guildId]` on the table `discord_zipper_slash_command_installs` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `guildId` to the `discord_zipper_slash_command_installs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `guildName` to the `discord_zipper_slash_command_installs` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "discord_zipper_slash_command_installs_teamId_appId_key";

-- AlterTable
ALTER TABLE "discord_zipper_slash_command_installs" DROP COLUMN "appId",
DROP COLUMN "botUserId",
DROP COLUMN "installers",
DROP COLUMN "teamId",
DROP COLUMN "teamName",
ADD COLUMN     "guildId" TEXT NOT NULL,
ADD COLUMN     "guildName" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "discord_zipper_slash_command_installs_guildId_key" ON "discord_zipper_slash_command_installs"("guildId");
