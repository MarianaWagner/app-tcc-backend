CREATE TABLE "prescription_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prescription_id" uuid NOT NULL,
	"name" text NOT NULL,
	"dosage" text,
	"route" text,
	"frequency" text,
	"duration" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "prescription" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"exam_id" uuid,
	"title" text NOT NULL,
	"issue_date" date NOT NULL,
	"posology" text NOT NULL,
	"status" text DEFAULT 'em_uso' NOT NULL,
	"attachment_path" text NOT NULL,
	"attachment_mime_type" text NOT NULL,
	"attachment_metadata" jsonb,
	"tags" text[],
	"notes" text,
	"professional" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "prescription_item" ADD CONSTRAINT "prescription_item_prescription_id_prescription_id_fk" FOREIGN KEY ("prescription_id") REFERENCES "public"."prescription"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescription" ADD CONSTRAINT "prescription_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescription" ADD CONSTRAINT "prescription_exam_id_exam_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exam"("id") ON DELETE no action ON UPDATE no action;