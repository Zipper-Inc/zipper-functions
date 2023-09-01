-- CreateTable
CREATE TABLE "slack_zipper_slash_command_installs" (
    "teamId" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "encryptedBotToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "slack_zipper_slash_command_installs_teamId_appId_key" ON "slack_zipper_slash_command_installs"("teamId", "appId");
