-- AlterTable
ALTER TABLE "sessions" ADD COLUMN     "currentOrganizationId" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "currentOrganizationId" TEXT;
