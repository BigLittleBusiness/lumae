ALTER TABLE `organisations` ADD `deliveryChannels` varchar(80) DEFAULT 'email' NOT NULL;--> statement-breakpoint
ALTER TABLE `organisations` ADD `deliveryFrequencyGuardDays` int DEFAULT 30 NOT NULL;