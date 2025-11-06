-- Migration: Tornar exam_date obrigatório (NOT NULL)
-- Atualizar coluna exam_date para ser obrigatória

-- Primeiro, atualizar registros existentes que não têm data (usar data atual como padrão)
UPDATE "exam" SET "exam_date" = CURRENT_DATE WHERE "exam_date" IS NULL;

-- Agora tornar a coluna obrigatória
ALTER TABLE "exam" ALTER COLUMN "exam_date" SET NOT NULL;

