-- Migration: Create prescription tables

CREATE TABLE IF NOT EXISTS "prescription" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "exam_id" uuid,
  "title" text NOT NULL,
  "issue_date" date NOT NULL,
  "posology" text NOT NULL,
  "status" text NOT NULL DEFAULT 'em_uso',
  "attachment_path" text NOT NULL,
  "attachment_mime_type" text NOT NULL,
  "attachment_metadata" jsonb,
  "tags" text[],
  "notes" text,
  "professional" text,
  "created_at" timestamptz DEFAULT now(),
  "updated_at" timestamptz DEFAULT now(),
  "deleted_at" timestamptz,
  CONSTRAINT "prescription_status_check" CHECK ("status" IN ('em_uso', 'concluida', 'suspensa'))
);

ALTER TABLE "prescription"
  ADD CONSTRAINT "prescription_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;

ALTER TABLE "prescription"
  ADD CONSTRAINT "prescription_exam_id_fkey"
  FOREIGN KEY ("exam_id") REFERENCES "exam"("id") ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS "prescription_user_idx" ON "prescription" ("user_id");
CREATE INDEX IF NOT EXISTS "prescription_status_idx" ON "prescription" ("status");
CREATE INDEX IF NOT EXISTS "prescription_issue_date_idx" ON "prescription" ("issue_date");

CREATE TABLE IF NOT EXISTS "prescription_item" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "prescription_id" uuid NOT NULL,
  "name" text NOT NULL,
  "dosage" text,
  "route" text,
  "frequency" text,
  "duration" text,
  "notes" text,
  "created_at" timestamptz DEFAULT now()
);

ALTER TABLE "prescription_item"
  ADD CONSTRAINT "prescription_item_prescription_id_fkey"
  FOREIGN KEY ("prescription_id") REFERENCES "prescription"("id") ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS "prescription_item_prescription_idx" ON "prescription_item" ("prescription_id");

