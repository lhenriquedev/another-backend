ALTER TABLE "email_confirmations" RENAME COLUMN "code" TO "codeHash";--> statement-breakpoint
ALTER TABLE "email_confirmations" ADD COLUMN "consumedAt" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "email_confirmations" DROP COLUMN "confirmedAt";