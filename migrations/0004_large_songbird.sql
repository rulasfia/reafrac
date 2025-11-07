ALTER TABLE "entries" ADD COLUMN "thumbnail" text;--> statement-breakpoint
ALTER TABLE "feeds" ADD COLUMN "site_url" text DEFAULT '' NOT NULL;