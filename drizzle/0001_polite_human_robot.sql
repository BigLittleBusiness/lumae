CREATE TABLE `early_access_signups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`name` varchar(120),
	`company` varchar(160),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `early_access_signups_id` PRIMARY KEY(`id`),
	CONSTRAINT `early_access_signups_email_unique` UNIQUE(`email`)
);
