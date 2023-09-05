-- AlterTable
ALTER TABLE "slack_zipper_slash_command_installs" ADD COLUMN     "botUserId" TEXT,
ADD COLUMN     "installers" TEXT[],
ADD COLUMN     "teamName" TEXT;
