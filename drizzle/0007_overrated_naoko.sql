CREATE TYPE "public"."category_role" AS ENUM('Misto', 'Kids I', 'Kids II', 'Iniciante', 'Competição', 'Intermediário', 'Avançado');--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "category_role" NOT NULL,
	"description" text,
	"createdAt" timestamp DEFAULT now()
);
