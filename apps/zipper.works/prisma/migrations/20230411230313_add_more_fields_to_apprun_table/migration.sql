-- AlterTable
ALTER TABLE "apps_runs" ADD COLUMN     "originalRequestMethod" TEXT,
ADD COLUMN     "originalRequestUrl" TEXT,
ADD COLUMN     "path" TEXT NOT NULL DEFAULT 'main.ts',
ADD COLUMN     "userId" TEXT,
ADD COLUMN     "version" TEXT;
