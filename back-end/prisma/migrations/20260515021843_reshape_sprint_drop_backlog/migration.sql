/*
  Warnings:

  - You are about to drop the `Backlog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SprintBacklogItem` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Backlog" DROP CONSTRAINT "Backlog_boardId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Sprint" DROP CONSTRAINT "Sprint_boardId_fkey";

-- DropForeignKey
ALTER TABLE "public"."SprintBacklogItem" DROP CONSTRAINT "SprintBacklogItem_backlogId_fkey";

-- DropForeignKey
ALTER TABLE "public"."SprintBacklogItem" DROP CONSTRAINT "SprintBacklogItem_sprintId_fkey";

-- AlterTable
ALTER TABLE "public"."Sprint" ADD COLUMN     "goal" TEXT;

-- AlterTable
ALTER TABLE "public"."Task" ADD COLUMN     "sprintId" TEXT;

-- DropTable
DROP TABLE "public"."Backlog";

-- DropTable
DROP TABLE "public"."SprintBacklogItem";

-- DropEnum
DROP TYPE "public"."BacklogStatus";

-- DropEnum
DROP TYPE "public"."Priority";

-- CreateIndex
CREATE INDEX "Sprint_boardId_idx" ON "public"."Sprint"("boardId");

-- CreateIndex
CREATE INDEX "Sprint_status_idx" ON "public"."Sprint"("status");

-- CreateIndex
CREATE INDEX "Task_sprintId_idx" ON "public"."Task"("sprintId");

-- AddForeignKey
ALTER TABLE "public"."Sprint" ADD CONSTRAINT "Sprint_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "public"."Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Task" ADD CONSTRAINT "Task_sprintId_fkey" FOREIGN KEY ("sprintId") REFERENCES "public"."Sprint"("id") ON DELETE SET NULL ON UPDATE CASCADE;
