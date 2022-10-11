/*
  Warnings:

  - You are about to drop the column `code` on the `apps` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "apps" DROP COLUMN "code";

-- AlterTable
ALTER TABLE "scripts" ADD COLUMN     "childHash" TEXT;

-- CreateTable
CREATE TABLE "script_main" (
    "appId" TEXT NOT NULL,
    "scriptHash" TEXT NOT NULL,

    CONSTRAINT "script_main_pkey" PRIMARY KEY ("appId")
);

-- CreateIndex
CREATE UNIQUE INDEX "script_main_scriptHash_key" ON "script_main"("scriptHash");

-- AddForeignKey
ALTER TABLE "script_main" ADD CONSTRAINT "script_main_appId_fkey" FOREIGN KEY ("appId") REFERENCES "apps"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "script_main" ADD CONSTRAINT "script_main_scriptHash_fkey" FOREIGN KEY ("scriptHash") REFERENCES "scripts"("hash") ON DELETE RESTRICT ON UPDATE CASCADE;
