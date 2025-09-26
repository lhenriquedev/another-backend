CREATE TYPE "public"."status_role" AS ENUM('finished', 'in-progress', 'cancelled', 'not-started');--> statement-breakpoint
CREATE TABLE "checkins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid,
	"classId" uuid,
	"createdAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "classes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text,
	"description" text,
	"date" date NOT NULL,
	"startTime" time NOT NULL,
	"endTime" time NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	"instructorId" uuid,
	"isRecurring" boolean DEFAULT false,
	"recurrenceRule" text,
	"recurrenceEndDate" date,
	"capacity" integer,
	"status" "status_role" DEFAULT 'not-started'
);
--> statement-breakpoint
ALTER TABLE "checkins" ADD CONSTRAINT "checkins_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkins" ADD CONSTRAINT "checkins_classId_classes_id_fk" FOREIGN KEY ("classId") REFERENCES "public"."classes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classes" ADD CONSTRAINT "classes_instructorId_users_id_fk" FOREIGN KEY ("instructorId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;