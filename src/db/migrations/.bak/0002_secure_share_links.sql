-- Migration: Atualizar share_link para compartilhamento seguro com OTP
-- Adicionar novos campos e remover campos antigos

-- Adicionar novas colunas
ALTER TABLE "share_link" ADD COLUMN IF NOT EXISTS "exam_id" uuid;
ALTER TABLE "share_link" ADD COLUMN IF NOT EXISTS "code" text;
ALTER TABLE "share_link" ADD COLUMN IF NOT EXISTS "email" text;
ALTER TABLE "share_link" ADD COLUMN IF NOT EXISTS "max_uses" integer DEFAULT 1 NOT NULL;
ALTER TABLE "share_link" ADD COLUMN IF NOT EXISTS "times_used" integer DEFAULT 0 NOT NULL;
ALTER TABLE "share_link" ADD COLUMN IF NOT EXISTS "revoked_at" timestamp with time zone;
ALTER TABLE "share_link" ADD COLUMN IF NOT EXISTS "otp_hash" text;
ALTER TABLE "share_link" ADD COLUMN IF NOT EXISTS "otp_expires_at" timestamp with time zone;
ALTER TABLE "share_link" ADD COLUMN IF NOT EXISTS "otp_attempts" integer DEFAULT 0 NOT NULL;
ALTER TABLE "share_link" ADD COLUMN IF NOT EXISTS "otp_sent_at" timestamp with time zone;
ALTER TABLE "share_link" ADD COLUMN IF NOT EXISTS "otp_sent_count" integer DEFAULT 0 NOT NULL;
ALTER TABLE "share_link" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone DEFAULT now();

-- Adicionar constraint de foreign key para exam_id
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'share_link_exam_id_exam_id_fk'
  ) THEN
    ALTER TABLE "share_link" ADD CONSTRAINT "share_link_exam_id_exam_id_fk" 
      FOREIGN KEY ("exam_id") REFERENCES "public"."exam"("id") ON DELETE no action ON UPDATE no action;
  END IF;
END $$;

-- Adicionar índice único para code
CREATE UNIQUE INDEX IF NOT EXISTS "share_link_code_unique" ON "share_link" ("code");

-- Remover colunas antigas (comentadas para não perder dados, podem ser removidas depois)
-- ALTER TABLE "share_link" DROP COLUMN IF EXISTS "token";
-- ALTER TABLE "share_link" DROP COLUMN IF EXISTS "contact";
-- ALTER TABLE "share_link" DROP COLUMN IF EXISTS "used_at";

-- Atualizar updated_at com valor padrão
UPDATE "share_link" SET "updated_at" = COALESCE("created_at", NOW()) WHERE "updated_at" IS NULL;

