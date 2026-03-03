CREATE TYPE "public"."webhook_delivery_status" AS ENUM('pending', 'success', 'failed', 'retrying');--> statement-breakpoint
CREATE TYPE "public"."webhook_event_type" AS ENUM('user.created', 'user.updated', 'user.deleted', 'user.email_verified', 'user.password_changed', 'session.created', 'session.destroyed', 'session.extended', 'organization.created', 'organization.updated', 'organization.deleted', 'organization.member_invited', 'organization.member_joined', 'organization.member_removed', 'organization.member_role_changed', 'oauth.client_created', 'oauth.client_updated', 'oauth.client_deleted', 'oauth.token_issued', 'oauth.token_revoked', 'oauth.authorization_granted', 'api_key.created', 'api_key.revoked', 'api_key.used');--> statement-breakpoint
CREATE TYPE "public"."webhook_status" AS ENUM('active', 'disabled', 'failed');--> statement-breakpoint
CREATE TABLE "webhook_deliveries" (
	"id" text PRIMARY KEY NOT NULL,
	"webhook_id" text NOT NULL,
	"event_type" "webhook_event_type" NOT NULL,
	"payload" text NOT NULL,
	"status" "webhook_delivery_status" DEFAULT 'pending' NOT NULL,
	"response_status_code" integer,
	"response_headers" text,
	"response_body" text,
	"error_message" text,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 5 NOT NULL,
	"next_retry_at" timestamp,
	"delivered_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_event_queue" (
	"id" text PRIMARY KEY NOT NULL,
	"event_type" "webhook_event_type" NOT NULL,
	"payload" text NOT NULL,
	"processed" boolean DEFAULT false NOT NULL,
	"processed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhooks" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"secret" text NOT NULL,
	"events" text NOT NULL,
	"status" "webhook_status" DEFAULT 'active' NOT NULL,
	"user_id" text,
	"organization_id" text,
	"description" text,
	"headers" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_triggered_at" timestamp,
	"failure_count" integer DEFAULT 0 NOT NULL,
	"success_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_webhook_id_webhooks_id_fk" FOREIGN KEY ("webhook_id") REFERENCES "public"."webhooks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "webhook_deliveries_webhook_id_idx" ON "webhook_deliveries" USING btree ("webhook_id");--> statement-breakpoint
CREATE INDEX "webhook_deliveries_event_type_idx" ON "webhook_deliveries" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "webhook_deliveries_status_idx" ON "webhook_deliveries" USING btree ("status");--> statement-breakpoint
CREATE INDEX "webhook_deliveries_next_retry_at_idx" ON "webhook_deliveries" USING btree ("next_retry_at");--> statement-breakpoint
CREATE INDEX "webhook_deliveries_created_at_idx" ON "webhook_deliveries" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "webhook_event_queue_processed_idx" ON "webhook_event_queue" USING btree ("processed");--> statement-breakpoint
CREATE INDEX "webhook_event_queue_created_at_idx" ON "webhook_event_queue" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "webhooks_user_id_idx" ON "webhooks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "webhooks_organization_id_idx" ON "webhooks" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "webhooks_status_idx" ON "webhooks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "webhooks_is_active_idx" ON "webhooks" USING btree ("is_active");