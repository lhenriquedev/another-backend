ALTER TABLE "classes" DROP CONSTRAINT "classes_recurrence_consistency_check";--> statement-breakpoint
ALTER TABLE "classes" ALTER COLUMN "capacity" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "classes" ALTER COLUMN "capacity" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "classes" DROP COLUMN "isRecurring";--> statement-breakpoint
ALTER TABLE "classes" DROP COLUMN "recurrenceRule";--> statement-breakpoint
ALTER TABLE "classes" DROP COLUMN "recurrenceEndDate";