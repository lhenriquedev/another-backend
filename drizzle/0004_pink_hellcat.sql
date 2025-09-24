ALTER TABLE "email_confirmations" ADD COLUMN "isConsumed" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "email_confirmations" DROP COLUMN "consumedAt";