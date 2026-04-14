CREATE INDEX `diagnoses_ref_id_idx` ON `diagnoses` (`ref_id`);--> statement-breakpoint
CREATE INDEX `diagnoses_created_at_idx` ON `diagnoses` (`created_at`);--> statement-breakpoint
CREATE INDEX `kickback_payments_location_ref_idx` ON `kickback_payments` (`location_ref`);--> statement-breakpoint
CREATE INDEX `kickback_payments_status_idx` ON `kickback_payments` (`status`);--> statement-breakpoint
CREATE INDEX `locations_status_idx` ON `locations` (`status`);--> statement-breakpoint
CREATE INDEX `locations_is_active_idx` ON `locations` (`is_active`);--> statement-breakpoint
CREATE INDEX `referral_fees_place_id_idx` ON `referral_fees` (`place_id`);--> statement-breakpoint
CREATE INDEX `referral_fees_status_idx` ON `referral_fees` (`status`);--> statement-breakpoint
CREATE INDEX `referral_fees_place_id_status_idx` ON `referral_fees` (`place_id`,`status`);