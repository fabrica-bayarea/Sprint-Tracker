/*
  Warnings:

  - Added the required column `title` to the `PokerSession` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."PokerSession" ADD COLUMN     "title" TEXT NOT NULL;
