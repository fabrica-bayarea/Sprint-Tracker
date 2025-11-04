/*
  Warnings:

  - You are about to drop the column `accessToken` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `googleId` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userName]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[authProvider,providerId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `authProvider` on the `User` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('local', 'google', 'microsoft');

-- DropIndex
DROP INDEX "User_googleId_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "accessToken",
DROP COLUMN "googleId",
ADD COLUMN     "providerId" TEXT,
ALTER COLUMN "password" DROP NOT NULL,
DROP COLUMN "authProvider",
ADD COLUMN     "authProvider" "AuthProvider" NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_userName_key" ON "User"("userName");

-- CreateIndex
CREATE UNIQUE INDEX "User_authProvider_providerId_key" ON "User"("authProvider", "providerId");
