CREATE TYPE "public"."belts_role" AS ENUM('white', 'blue', 'purple', 'brown', 'black');--> statement-breakpoint
ALTER TYPE "public"."user_role" ADD VALUE 'instructor';--> statement-breakpoint
CREATE TABLE "belts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"belt" "belts_role" NOT NULL,
	"createdAt" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "beltId" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_beltId_belts_id_fk" FOREIGN KEY ("beltId") REFERENCES "public"."belts"("id") ON DELETE no action ON UPDATE no action;