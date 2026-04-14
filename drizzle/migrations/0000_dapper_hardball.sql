CREATE TABLE `diagnoses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ref_id` text DEFAULT 'direct' NOT NULL,
	`mode` text NOT NULL,
	`topic` text,
	`user_name` text,
	`birth_date` text,
	`paid_amount` integer DEFAULT 0 NOT NULL,
	`stripe_session_id` text,
	`utm_source` text,
	`utm_medium` text,
	`utm_campaign` text,
	`device_type` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `diagnoses_stripe_session_id_unique` ON `diagnoses` (`stripe_session_id`);--> statement-breakpoint
CREATE TABLE `kickback_payments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`location_ref` text NOT NULL,
	`period_start` text NOT NULL,
	`period_end` text NOT NULL,
	`diagnosis_count` integer DEFAULT 0 NOT NULL,
	`unit_amount` integer DEFAULT 50 NOT NULL,
	`amount` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`paid_at` text,
	`statement_html` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `locations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ref_id` text NOT NULL,
	`name` text NOT NULL,
	`contact_name` text,
	`contact_email` text,
	`address` text,
	`postal_code` text,
	`prefecture` text,
	`city` text,
	`street_address` text,
	`bank_info` text,
	`bank_name` text,
	`branch_name` text,
	`account_type` text,
	`account_number` text,
	`account_holder` text,
	`kickback_rate` integer DEFAULT 50 NOT NULL,
	`carried_over_amount` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `locations_ref_id_unique` ON `locations` (`ref_id`);--> statement-breakpoint
CREATE TABLE `payment_tokens` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`token` text NOT NULL,
	`session_id` text NOT NULL,
	`created_at` text NOT NULL,
	`used` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `payment_tokens_token_unique` ON `payment_tokens` (`token`);--> statement-breakpoint
CREATE TABLE `referral_fees` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`place_id` text NOT NULL,
	`stripe_session_id` text NOT NULL,
	`mode` text NOT NULL,
	`amount` integer NOT NULL,
	`fee` integer NOT NULL,
	`status` text DEFAULT 'unpaid' NOT NULL,
	`paid_at` text,
	`created_at` text NOT NULL
);
