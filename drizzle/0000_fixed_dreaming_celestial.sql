CREATE TYPE "public"."belts_role" AS ENUM('white', 'blue', 'purple', 'brown', 'black');--> statement-breakpoint
CREATE TYPE "public"."category_role" AS ENUM('Misto', 'Kids I', 'Kids II', 'Iniciante', 'Competição', 'Intermediário', 'Avançado');--> statement-breakpoint
CREATE TYPE "public"."status_role" AS ENUM('finished', 'in-progress', 'cancelled', 'not-started');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'student', 'instructor');--> statement-breakpoint
CREATE TABLE "belts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"belt" "belts_role" NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now(),
	"requiredClasses" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "category_role" NOT NULL,
	"description" text,
	"createdAt" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "checkins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"classId" uuid NOT NULL,
	"done" boolean DEFAULT false,
	"completedAt" timestamp with time zone DEFAULT now(),
	"createdAt" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "classes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text,
	"description" text,
	"date" date NOT NULL,
	"startTime" timestamp with time zone NOT NULL,
	"endTime" timestamp with time zone NOT NULL,
	"capacity" integer DEFAULT 0 NOT NULL,
	"status" "status_role" DEFAULT 'not-started',
	"instructorId" uuid,
	"categoryId" uuid,
	"createdAt" timestamp with time zone DEFAULT now(),
	CONSTRAINT "capacity_check" CHECK ("classes"."capacity" >= 0),
	CONSTRAINT "timeOrder_check" CHECK ("classes"."startTime" < "classes"."endTime")
);
--> statement-breakpoint
CREATE TABLE "email_confirmations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"codeHash" text NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL,
	"isConsumed" boolean DEFAULT false,
	"userId" uuid NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"role" "user_role" DEFAULT 'student' NOT NULL,
	"isActive" boolean DEFAULT false NOT NULL,
	"beltId" uuid NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "checkins" ADD CONSTRAINT "checkins_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkins" ADD CONSTRAINT "checkins_classId_classes_id_fk" FOREIGN KEY ("classId") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classes" ADD CONSTRAINT "classes_instructorId_users_id_fk" FOREIGN KEY ("instructorId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classes" ADD CONSTRAINT "classes_categoryId_categories_id_fk" FOREIGN KEY ("categoryId") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_confirmations" ADD CONSTRAINT "email_confirmations_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_beltId_belts_id_fk" FOREIGN KEY ("beltId") REFERENCES "public"."belts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "checkins_userId_classId_index" ON "checkins" USING btree ("userId","classId");