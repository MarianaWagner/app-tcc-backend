-- Migration: Tornar exam_id opcional em reminder e adicionar campos de jejum

-- Remover foreign key constraint existente
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'reminder_exam_id_exam_id_fk'
  ) THEN
    ALTER TABLE "reminder" DROP CONSTRAINT "reminder_exam_id_exam_id_fk";
  END IF;
END $$;

-- Tornar exam_id opcional (permite NULL)
ALTER TABLE "reminder" ALTER COLUMN "exam_id" DROP NOT NULL;

-- Recriar foreign key constraint (agora permite NULL)
ALTER TABLE "reminder" 
  ADD CONSTRAINT "reminder_exam_id_exam_id_fk" 
  FOREIGN KEY ("exam_id") 
  REFERENCES "exam"("id") 
  ON DELETE SET NULL 
  ON UPDATE NO ACTION;

-- Adicionar campos de jejum
ALTER TABLE "reminder" 
  ADD COLUMN IF NOT EXISTS "requires_fasting" integer DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS "fasting_duration" integer,
  ADD COLUMN IF NOT EXISTS "fasting_alert_time" timestamp with time zone,
  ADD COLUMN IF NOT EXISTS "notes" text;

