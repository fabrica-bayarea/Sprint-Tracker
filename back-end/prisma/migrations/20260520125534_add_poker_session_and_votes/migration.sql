-- CreateEnum
CREATE TYPE "public"."PokerStatus" AS ENUM ('WAITING', 'VOTING', 'REVEALED', 'CLOSED');

-- CreateTable
CREATE TABLE "public"."PokerSession" (
    "id" TEXT NOT NULL,
    "pokerStatus" "public"."PokerStatus" NOT NULL,
    "taskId" TEXT,
    "inviteCode" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PokerSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PokerVotes" (
    "id" TEXT NOT NULL,
    "voteValue" TEXT NOT NULL,
    "pokerSessionId" TEXT NOT NULL,
    "boardMemberId" TEXT NOT NULL,
    "boardMemberUserId" TEXT NOT NULL,
    "comment" TEXT,

    CONSTRAINT "PokerVotes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PokerSession_inviteCode_key" ON "public"."PokerSession"("inviteCode");

-- CreateIndex
CREATE UNIQUE INDEX "PokerVotes_boardMemberId_boardMemberUserId_pokerSessionId_key" ON "public"."PokerVotes"("boardMemberId", "boardMemberUserId", "pokerSessionId");

-- AddForeignKey
ALTER TABLE "public"."PokerSession" ADD CONSTRAINT "PokerSession_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "public"."Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PokerSession" ADD CONSTRAINT "PokerSession_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "public"."Board"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PokerVotes" ADD CONSTRAINT "PokerVotes_pokerSessionId_fkey" FOREIGN KEY ("pokerSessionId") REFERENCES "public"."PokerSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PokerVotes" ADD CONSTRAINT "PokerVotes_boardMemberId_boardMemberUserId_fkey" FOREIGN KEY ("boardMemberId", "boardMemberUserId") REFERENCES "public"."BoardMember"("boardId", "userId") ON DELETE RESTRICT ON UPDATE CASCADE;
