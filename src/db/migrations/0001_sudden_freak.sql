ALTER TABLE "reminder" ALTER COLUMN "exam_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "reminder" ADD COLUMN "requires_fasting" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "reminder" ADD COLUMN "fasting_duration" integer;--> statement-breakpoint
ALTER TABLE "reminder" ADD COLUMN "fasting_alert_time" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "reminder" ADD COLUMN "notes" text;