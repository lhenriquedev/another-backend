ALTER TABLE "checkins" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "checkins" ALTER COLUMN "status" SET DEFAULT 'done'::text;--> statement-breakpoint
DROP TYPE "public"."checkin_status";--> statement-breakpoint
CREATE TYPE "public"."checkin_status" AS ENUM('done', 'cancelled');--> statement-breakpoint
ALTER TABLE "checkins" ALTER COLUMN "status" SET DEFAULT 'done'::"public"."checkin_status";--> statement-breakpoint
ALTER TABLE "checkins" ALTER COLUMN "status" SET DATA TYPE "public"."checkin_status" USING "status"::"public"."checkin_status";--> statement-breakpoint
ALTER TABLE "checkins" DROP COLUMN "done";