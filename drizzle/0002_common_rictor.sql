ALTER TABLE "email_confirmations" DROP CONSTRAINT "email_confirmations_token_unique";--> statement-breakpoint
ALTER TABLE "email_confirmations" ADD COLUMN "code" text NOT NULL;--> statement-breakpoint
ALTER TABLE "email_confirmations" DROP COLUMN "token";--> statement-breakpoint
ALTER TABLE "email_confirmations" DROP COLUMN "codeHash";