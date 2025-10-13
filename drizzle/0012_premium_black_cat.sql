ALTER TABLE "email_confirmations" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "email_confirmations" CASCADE;--> statement-breakpoint
ALTER TABLE "checkins" RENAME COLUMN "userId" TO "user_id";--> statement-breakpoint
ALTER TABLE "checkins" RENAME COLUMN "classId" TO "class_id";--> statement-breakpoint
ALTER TABLE "checkins" RENAME COLUMN "completedAt" TO "completed_at";--> statement-breakpoint
ALTER TABLE "checkins" RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint
ALTER TABLE "checkins" DROP CONSTRAINT "checkins_userId_users_id_fk";
--> statement-breakpoint
ALTER TABLE "checkins" DROP CONSTRAINT "checkins_classId_classes_id_fk";
--> statement-breakpoint
ALTER TABLE "classes" DROP CONSTRAINT "classes_instructorId_users_id_fk";
--> statement-breakpoint
ALTER TABLE "classes" DROP CONSTRAINT "classes_categoryId_categories_id_fk";
--> statement-breakpoint
DROP INDEX "checkins_userId_classId_index";--> statement-breakpoint
DROP INDEX "users_belt_id_idx";--> statement-breakpoint
DROP INDEX "checkins_user_status_idx";--> statement-breakpoint
DROP INDEX "checkins_class_idx";--> statement-breakpoint
DROP INDEX "checkins_completed_at_idx";--> statement-breakpoint
DROP INDEX "classes_category_id_idx";--> statement-breakpoint
DROP INDEX "classes_instructor_id_idx";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "name" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "email" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "password" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "classes" ADD COLUMN "instructor_id" uuid;--> statement-breakpoint
ALTER TABLE "classes" ADD COLUMN "category_id" uuid;--> statement-breakpoint
ALTER TABLE "classes" ADD COLUMN "created_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "birth_date" date NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "gender" varchar(6) NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phone" varchar(20);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_active" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "checkins" ADD CONSTRAINT "checkins_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkins" ADD CONSTRAINT "checkins_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classes" ADD CONSTRAINT "classes_instructor_id_users_id_fk" FOREIGN KEY ("instructor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classes" ADD CONSTRAINT "classes_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "checkins_user_id_class_id_index" ON "checkins" USING btree ("user_id","class_id");--> statement-breakpoint
CREATE INDEX "checkins_user_status_idx" ON "checkins" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "checkins_class_idx" ON "checkins" USING btree ("class_id");--> statement-breakpoint
CREATE INDEX "checkins_completed_at_idx" ON "checkins" USING btree ("completed_at");--> statement-breakpoint
CREATE INDEX "classes_category_id_idx" ON "classes" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "classes_instructor_id_idx" ON "classes" USING btree ("instructor_id");--> statement-breakpoint
ALTER TABLE "classes" DROP COLUMN "instructorId";--> statement-breakpoint
ALTER TABLE "classes" DROP COLUMN "categoryId";--> statement-breakpoint
ALTER TABLE "classes" DROP COLUMN "createdAt";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "isActive";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "createdAt";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "updatedAt";