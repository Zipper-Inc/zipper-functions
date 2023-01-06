/*
  Warnings:

  - You are about to drop the `third_party_accounts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "app_editors" DROP CONSTRAINT "app_editors_userId_fkey";

-- DropForeignKey
ALTER TABLE "third_party_accounts" DROP CONSTRAINT "third_party_accounts_userId_fkey";

-- DropTable
DROP TABLE "third_party_accounts";

-- DropTable
DROP TABLE "users";
