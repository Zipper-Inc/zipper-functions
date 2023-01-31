-- AlterTable
ALTER TABLE "apps" ADD COLUMN     "categories" TEXT[],
ADD COLUMN     "isPrivate" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "submissionState" INTEGER NOT NULL DEFAULT 0;
