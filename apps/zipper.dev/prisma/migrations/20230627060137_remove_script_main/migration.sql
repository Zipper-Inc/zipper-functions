/*
  Warnings:

  - You are about to drop the `script_main` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "script_main" DROP CONSTRAINT "script_main_appId_fkey";

-- DropForeignKey
ALTER TABLE "script_main" DROP CONSTRAINT "script_main_scriptId_fkey";

-- DropTable
DROP TABLE "script_main";
