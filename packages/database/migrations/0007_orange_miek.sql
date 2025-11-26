CREATE TABLE "user_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"entry_id" serial NOT NULL,
	"status" text DEFAULT 'unread' NOT NULL,
	"starred" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "uniqueUserEntry" UNIQUE("user_id","entry_id")
);
--> statement-breakpoint
CREATE TABLE "user_feed_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"feed_id" text NOT NULL,
	"subscribed_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "uniqueUserFeedSubscription" UNIQUE("user_id","feed_id")
);
--> statement-breakpoint
ALTER TABLE "entries" DROP CONSTRAINT "uniqueUserFeedEntryTitle";--> statement-breakpoint
ALTER TABLE "user_entries" ADD CONSTRAINT "user_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_entries" ADD CONSTRAINT "user_entries_entry_id_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_feed_subscriptions" ADD CONSTRAINT "user_feed_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_feed_subscriptions" ADD CONSTRAINT "user_feed_subscriptions_feed_id_feeds_id_fk" FOREIGN KEY ("feed_id") REFERENCES "public"."feeds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entries" ADD CONSTRAINT "uniqueFeedEntryTitle" UNIQUE("feed_id","title");