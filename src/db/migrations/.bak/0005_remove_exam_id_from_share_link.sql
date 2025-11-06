-- Migration: Remover exam_id de share_link
-- Os exames agora são vinculados através da tabela shared_exam

-- Remover foreign key constraint
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'share_link_exam_id_exam_id_fk'
  ) THEN
    ALTER TABLE "share_link" DROP CONSTRAINT "share_link_exam_id_exam_id_fk";
  END IF;
END $$;

-- Remover coluna exam_id
ALTER TABLE "share_link" DROP COLUMN IF EXISTS "exam_id";
