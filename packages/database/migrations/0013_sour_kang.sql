CREATE INDEX "entries_feedId_idx" ON "entries" USING btree ("feed_id");--> statement-breakpoint
CREATE INDEX "entries_publishedAt_idx" ON "entries" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "entries_createdAt_idx" ON "entries" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "feeds_categoryId_idx" ON "feeds" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "feeds_link_idx" ON "feeds" USING btree ("link");--> statement-breakpoint
CREATE INDEX "fluxConnections_userId_idx" ON "flux_connections" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "userEntries_userId_idx" ON "user_entries" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "userEntries_entryId_idx" ON "user_entries" USING btree ("entry_id");--> statement-breakpoint
CREATE INDEX "userEntries_status_idx" ON "user_entries" USING btree ("status");--> statement-breakpoint
CREATE INDEX "userEntries_userId_status_idx" ON "user_entries" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "userFeedSubscriptions_userId_idx" ON "user_feed_subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "userFeedSubscriptions_feedId_idx" ON "user_feed_subscriptions" USING btree ("feed_id");