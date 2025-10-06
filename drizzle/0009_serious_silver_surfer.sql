CREATE INDEX "classes_start_time_id_idx" ON "classes" USING btree ("startTime","id");--> statement-breakpoint
CREATE INDEX "classes_category_id_idx" ON "classes" USING btree ("categoryId");--> statement-breakpoint
CREATE INDEX "classes_instructor_id_idx" ON "classes" USING btree ("instructorId");--> statement-breakpoint
CREATE INDEX "classes_date_idx" ON "classes" USING btree ("date");--> statement-breakpoint
CREATE INDEX "classes_end_time_idx" ON "classes" USING btree ("endTime");