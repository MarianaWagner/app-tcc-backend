-- Migration: Adicionar campos de aceite do termo de responsabilidade
-- Adicionar campos para registrar aceite do termo de responsabilidade

-- Adicionar novas colunas
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "term_accepted" timestamp with time zone;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "term_version" text;

-- Comentário explicativo
COMMENT ON COLUMN "user"."term_accepted" IS 'Data e hora em que o usuário aceitou o termo de responsabilidade';
COMMENT ON COLUMN "user"."term_version" IS 'Versão do termo de responsabilidade que foi aceita pelo usuário';

