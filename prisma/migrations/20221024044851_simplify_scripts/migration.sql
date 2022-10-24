/*
  Warnings:

  - You are about to drop the column `scriptHash` on the `script_main` table. All the data in the column will be lost.
  - The primary key for the `scripts` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `childHash` on the `scripts` table. All the data in the column will be lost.
  - You are about to drop the column `hash` on the `scripts` table. All the data in the column will be lost.
  - You are about to drop the column `parentHash` on the `scripts` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[scriptId]` on the table `script_main` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `scriptId` to the `script_main` table without a default value. This is not possible if the table is not empty.
  - The required column `id` was added to the `scripts` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- DropForeignKey
ALTER TABLE "script_main" DROP CONSTRAINT "script_main_scriptHash_fkey";

-- DropIndex
DROP INDEX "script_main_scriptHash_key";

-- AlterTable
ALTER TABLE "script_main" DROP COLUMN "scriptHash",
ADD COLUMN     "scriptId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "scripts" DROP CONSTRAINT "scripts_pkey",
DROP COLUMN "childHash",
DROP COLUMN "hash",
DROP COLUMN "parentHash",
ADD COLUMN     "id" TEXT NOT NULL,
ADD CONSTRAINT "scripts_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "script_main_scriptId_key" ON "script_main"("scriptId");

-- AddForeignKey
ALTER TABLE "script_main" ADD CONSTRAINT "script_main_scriptId_fkey" FOREIGN KEY ("scriptId") REFERENCES "scripts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
