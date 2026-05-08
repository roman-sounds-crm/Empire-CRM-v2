CREATE TABLE `portal_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`token` text NOT NULL,
	`event_id` text,
	`client_email` text NOT NULL,
	`client_name` text NOT NULL,
	`expires_at` text,
	`used_at` text,
	`created_at` text DEFAULT (current_timestamp)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `portal_tokens_token_unique` ON `portal_tokens` (`token`);--> statement-breakpoint
ALTER TABLE `contracts` ADD `client_email` text;--> statement-breakpoint
ALTER TABLE `contracts` ADD `signature_data` text;--> statement-breakpoint
ALTER TABLE `contracts` ADD `sign_token` text;--> statement-breakpoint
ALTER TABLE `events` ADD `client_email` text;--> statement-breakpoint
ALTER TABLE `events` ADD `client_phone` text;--> statement-breakpoint
ALTER TABLE `events` ADD `package_id` text;--> statement-breakpoint
ALTER TABLE `events` ADD `contractor_id` text;--> statement-breakpoint
ALTER TABLE `events` ADD `portal_token` text;--> statement-breakpoint
ALTER TABLE `invoices` ADD `client_email` text;--> statement-breakpoint
ALTER TABLE `invoices` ADD `stripe_payment_intent` text;--> statement-breakpoint
ALTER TABLE `invoices` ADD `stripe_checkout_url` text;--> statement-breakpoint
ALTER TABLE `invoices` ADD `pay_token` text;