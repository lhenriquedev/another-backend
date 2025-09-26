ALTER TABLE "checkins" DROP CONSTRAINT "checkins_userId_users_id_fk";
--> statement-breakpoint
ALTER TABLE "checkins" DROP CONSTRAINT "checkins_classId_classes_id_fk";
--> statement-breakpoint
ALTER TABLE "belts" ALTER COLUMN "createdAt" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "belts" ALTER COLUMN "createdAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "categories" ALTER COLUMN "createdAt" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "categories" ALTER COLUMN "createdAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "checkins" ALTER COLUMN "userId" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "checkins" ALTER COLUMN "classId" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "checkins" ALTER COLUMN "createdAt" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "checkins" ALTER COLUMN "createdAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "classes" ALTER COLUMN "createdAt" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "classes" ALTER COLUMN "createdAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "email_confirmations" ALTER COLUMN "expiresAt" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "createdAt" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "createdAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "updatedAt" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "updatedAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "checkins" ADD CONSTRAINT "checkins_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkins" ADD CONSTRAINT "checkins_classId_classes_id_fk" FOREIGN KEY ("classId") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "checkins_userId_classId_index" ON "checkins" USING btree ("userId","classId");--> statement-breakpoint
ALTER TABLE "classes" ADD CONSTRAINT "capacity_check" CHECK ("classes"."capacity" >= 0);--> statement-breakpoint
ALTER TABLE "classes" ADD CONSTRAINT "timeOrder_check" CHECK ("classes"."startTime" < "classes"."endTime");--> statement-breakpoint
ALTER TABLE "classes" ADD CONSTRAINT "classes_recurrence_consistency_check" CHECK (( "classes"."isRecurring" = false AND "classes"."recurrenceRule" IS NULL AND "classes"."recurrenceEndDate" IS NULL )
       OR ( "classes"."isRecurring" = true AND "classes"."recurrenceRule" IS NOT NULL AND "classes"."recurrenceEndDate" IS NOT NULL ));