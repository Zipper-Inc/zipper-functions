/*
  Warnings:

  - You are about to drop the column `name` on the `secrets` table. All the data in the column will be lost.
  - Added the required column `key` to the `secrets` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "secrets" DROP COLUMN "name",
ADD COLUMN     "key" TEXT NOT NULL;
