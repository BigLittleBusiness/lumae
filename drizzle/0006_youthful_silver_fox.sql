ALTER TABLE `organisations` ADD `retentionDays` int DEFAULT 730 NOT NULL;--> statement-breakpoint
ALTER TABLE `organisations` ADD `ssoProvider` varchar(64);--> statement-breakpoint
ALTER TABLE `organisations` ADD `ssoRequired` boolean DEFAULT false NOT NULL;