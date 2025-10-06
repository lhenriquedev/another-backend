DROP INDEX "checkins_user_status_date_idx";--> statement-breakpoint
CREATE INDEX "checkins_user_status_idx" ON "checkins" USING btree ("userId","status");--> statement-breakpoint
CREATE INDEX "checkins_class_idx" ON "checkins" USING btree ("classId");--> statement-breakpoint
CREATE INDEX "checkins_completed_at_idx" ON "checkins" USING btree ("completedAt");