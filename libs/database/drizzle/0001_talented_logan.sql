ALTER TABLE "user" ADD COLUMN "session_timeout" integer DEFAULT 604800;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "allow_concurrent_sessions" boolean DEFAULT true NOT NULL;