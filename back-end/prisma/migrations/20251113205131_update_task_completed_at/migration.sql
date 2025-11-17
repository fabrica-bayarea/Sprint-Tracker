-- AlterTable
ALTER TABLE "public"."Task" ADD COLUMN     "assignedToId" TEXT,
ADD COLUMN     "completedAt" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "public"."Task" ADD CONSTRAINT "Task_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
