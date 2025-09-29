CREATE TYPE "public"."checkin_status" AS ENUM('pending', 'done', 'cancelled');--> statement-breakpoint
ALTER TABLE "checkins" ADD COLUMN "status" "checkin_status" DEFAULT 'pending';