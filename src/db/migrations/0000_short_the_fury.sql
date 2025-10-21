CREATE TABLE "user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	"updateAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX "emailUniqueIndex" ON "user" USING btree (lower("email"));
