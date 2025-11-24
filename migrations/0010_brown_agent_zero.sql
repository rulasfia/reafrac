ALTER TABLE "categories" DROP CONSTRAINT "categories_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "entries" DROP CONSTRAINT "entries_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "feeds" DROP CONSTRAINT "feeds_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "categories" DROP COLUMN "user_id";--> statement-breakpoint
ALTER TABLE "entries" DROP COLUMN "user_id";--> statement-breakpoint
ALTER TABLE "entries" DROP COLUMN "status";--> statement-breakpoint
ALTER TABLE "entries" DROP COLUMN "starred";--> statement-breakpoint
ALTER TABLE "feeds" DROP COLUMN "user_id";