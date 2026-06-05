-- ============================================================
-- Fase 2 (multi-board): Sprint boardId nullable + 1 ativa por dono
--
-- A sprint deixa de ser presa a 1 board: boardId vira opcional e o
-- vínculo é com o dono (ownerId, da Fase 1). Pode conter tasks de
-- vários boards do dono (regra aplicada no addTask do service).
-- ============================================================

-- boardId vira opcional
ALTER TABLE "Sprint" ALTER COLUMN "boardId" DROP NOT NULL;

-- FK do board: ON DELETE CASCADE -> SET NULL
-- (deletar 1 board não apaga mais a sprint; ela só perde o board de origem)
ALTER TABLE "Sprint" DROP CONSTRAINT "Sprint_boardId_fkey";
ALTER TABLE "Sprint" ADD CONSTRAINT "Sprint_boardId_fkey"
  FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Regra "1 sprint ACTIVE por dono": antes era 1 por board, então um dono
-- com sprints ativas em boards diferentes teria várias. Mantém a mais
-- recente ACTIVE e rebaixa as outras pra PLANNED.
UPDATE "Sprint" SET "status" = 'PLANNED'
WHERE "id" IN (
  SELECT "id" FROM (
    SELECT "id", ROW_NUMBER() OVER (
      PARTITION BY "ownerId" ORDER BY "startDate" DESC, "createdAt" DESC
    ) AS rn
    FROM "Sprint" WHERE "status" = 'ACTIVE'
  ) ranked WHERE rn > 1
);
