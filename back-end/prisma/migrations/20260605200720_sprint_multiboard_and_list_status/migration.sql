-- ============================================================
-- Fase 1 (multi-board): Sprint.ownerId + List.status
--
-- Aditiva e segura. A sprint passa a gravar o dono (ownerId), mas
-- continua nascendo sob um board (boardId non-null) por ora.
-- boardId nullable + cross-board + permissões por-owner = Fase 2.
-- ============================================================

-- ---------- Sprint: grava o dono ----------

-- ownerId: adiciona nullable, popula do board, torna obrigatório
ALTER TABLE "Sprint" ADD COLUMN "ownerId" TEXT;
UPDATE "Sprint" s SET "ownerId" = b."ownerId"
  FROM "Board" b WHERE s."boardId" = b."id";
ALTER TABLE "Sprint" ALTER COLUMN "ownerId" SET NOT NULL;

-- FK do owner
ALTER TABLE "Sprint" ADD CONSTRAINT "Sprint_ownerId_fkey"
  FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Índices novos
CREATE INDEX "Sprint_ownerId_idx" ON "Sprint"("ownerId");
CREATE INDEX "Sprint_ownerId_status_idx" ON "Sprint"("ownerId", "status");

-- ---------- List: status mapeado (automação status<->coluna) ----------

ALTER TABLE "List" ADD COLUMN "status" "Status";

-- Heurística: mapeia o título da coluna pro status. lower()+LIKE cobre
-- acentos porque o radical buscado não tem acento (conclu, andamento...).
-- Aplicado em ordem; cada UPDATE só toca listas ainda sem status.
UPDATE "List" SET "status" = 'DONE' WHERE "status" IS NULL AND (
  lower("title") LIKE '%conclu%' OR lower("title") LIKE '%done%' OR
  lower("title") LIKE '%finaliz%' OR lower("title") LIKE '%pronto%'
);
UPDATE "List" SET "status" = 'BLOCKED' WHERE "status" IS NULL AND (
  lower("title") LIKE '%impedid%' OR lower("title") LIKE '%bloque%' OR
  lower("title") LIKE '%blocked%'
);
UPDATE "List" SET "status" = 'IN_PROGRESS' WHERE "status" IS NULL AND (
  lower("title") LIKE '%andamento%' OR lower("title") LIKE '%progress%' OR
  lower("title") LIKE '%fazendo%' OR lower("title") LIKE '%doing%'
);
UPDATE "List" SET "status" = 'TODO' WHERE "status" IS NULL AND (
  lower("title") LIKE '%fazer%' OR lower("title") LIKE '%todo%' OR
  lower("title") LIKE '%to-do%' OR lower("title") LIKE '%backlog%' OR
  lower("title") LIKE '%novo%' OR lower("title") LIKE '%aberto%' OR
  lower("title") LIKE '%pendente%' OR lower("title") LIKE '%open%'
);

-- Dedupe: garante 1 lista por (board, status). Extras voltam pra NULL
-- (coluna livre), pra não violar o unique abaixo.
UPDATE "List" SET "status" = NULL
WHERE "id" IN (
  SELECT "id" FROM (
    SELECT "id", ROW_NUMBER() OVER (
      PARTITION BY "boardId", "status" ORDER BY "position" ASC, "createdAt" ASC
    ) AS rn
    FROM "List" WHERE "status" IS NOT NULL
  ) ranked WHERE rn > 1
);

-- Unique (boardId, status). No Postgres NULLs são distintos, então várias
-- colunas livres (status NULL) por board continuam permitidas.
CREATE UNIQUE INDEX "List_boardId_status_key" ON "List"("boardId", "status");
