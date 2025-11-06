ALTER TABLE "exam" ALTER COLUMN "exam_date" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "share_link" ADD COLUMN "code" text NOT NULL;--> statement-breakpoint
ALTER TABLE "share_link" ADD COLUMN "email" text NOT NULL;--> statement-breakpoint
ALTER TABLE "share_link" ADD COLUMN "max_uses" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "share_link" ADD COLUMN "times_used" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "share_link" ADD COLUMN "revoked_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "share_link" ADD COLUMN "otp_hash" text;--> statement-breakpoint
ALTER TABLE "share_link" ADD COLUMN "otp_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "share_link" ADD COLUMN "otp_attempts" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "share_link" ADD COLUMN "otp_sent_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "share_link" ADD COLUMN "otp_sent_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "share_link" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now();--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "term_accepted" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "term_version" text;--> statement-breakpoint
ALTER TABLE "share_link" DROP COLUMN "token";--> statement-breakpoint
ALTER TABLE "share_link" DROP COLUMN "contact";--> statement-breakpoint
ALTER TABLE "share_link" DROP COLUMN "used_at";--> statement-breakpoint
ALTER TABLE "share_link" ADD CONSTRAINT "share_link_code_unique" UNIQUE("code");