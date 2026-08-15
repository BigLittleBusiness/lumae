CREATE TABLE `audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organisationId` int,
	`actorUserId` int,
	`action` varchar(120) NOT NULL,
	`entityType` varchar(80) NOT NULL,
	`entityId` varchar(120),
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `organisation_invitations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organisationId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`role` enum('owner','admin','manager','analyst','responder','viewer') NOT NULL DEFAULT 'viewer',
	`tokenHash` varchar(128) NOT NULL,
	`status` enum('pending','accepted','revoked','expired') NOT NULL DEFAULT 'pending',
	`invitedByUserId` int NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`acceptedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `organisation_invitations_id` PRIMARY KEY(`id`),
	CONSTRAINT `organisation_invitations_tokenHash_unique` UNIQUE(`tokenHash`)
);
--> statement-breakpoint
CREATE TABLE `organisation_subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organisationId` int NOT NULL,
	`stripeCustomerId` varchar(255),
	`stripeSubscriptionId` varchar(255),
	`stripePriceId` varchar(255),
	`status` enum('inactive','trialing','active','past_due','cancelled') NOT NULL DEFAULT 'inactive',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `organisation_subscriptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `organisation_subscriptions_organisationId_unique` UNIQUE(`organisationId`)
);
--> statement-breakpoint
CREATE TABLE `platform_provider_configs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`provider` enum('stripe','aws_ses','twilio','hubspot','zendesk','oidc_google','oidc_microsoft') NOT NULL,
	`enabled` boolean NOT NULL DEFAULT false,
	`publicConfiguration` text,
	`secretConfigurationCiphertext` text,
	`lastTestStatus` varchar(32),
	`lastTestedAt` timestamp,
	`updatedByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `platform_provider_configs_id` PRIMARY KEY(`id`),
	CONSTRAINT `platform_provider_configs_provider_unique` UNIQUE(`provider`)
);
--> statement-breakpoint
CREATE TABLE `survey_deliveries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organisationId` int NOT NULL,
	`surveyId` int NOT NULL,
	`journeyId` int,
	`channel` enum('email','sms','in_app','qr') NOT NULL,
	`recipientHash` varchar(128) NOT NULL,
	`recipientCiphertext` text NOT NULL,
	`status` enum('queued','sent','failed','suppressed') NOT NULL DEFAULT 'queued',
	`providerMessageId` varchar(255),
	`scheduledAt` timestamp NOT NULL DEFAULT (now()),
	`sentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `survey_deliveries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `activeOrganisationId` int;--> statement-breakpoint
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_organisationId_organisations_id_fk` FOREIGN KEY (`organisationId`) REFERENCES `organisations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_actorUserId_users_id_fk` FOREIGN KEY (`actorUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `organisation_invitations` ADD CONSTRAINT `organisation_invitations_organisationId_organisations_id_fk` FOREIGN KEY (`organisationId`) REFERENCES `organisations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `organisation_invitations` ADD CONSTRAINT `organisation_invitations_invitedByUserId_users_id_fk` FOREIGN KEY (`invitedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `organisation_subscriptions` ADD CONSTRAINT `organisation_subscriptions_organisationId_organisations_id_fk` FOREIGN KEY (`organisationId`) REFERENCES `organisations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `platform_provider_configs` ADD CONSTRAINT `platform_provider_configs_updatedByUserId_users_id_fk` FOREIGN KEY (`updatedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `survey_deliveries` ADD CONSTRAINT `survey_deliveries_organisationId_organisations_id_fk` FOREIGN KEY (`organisationId`) REFERENCES `organisations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `survey_deliveries` ADD CONSTRAINT `survey_deliveries_surveyId_surveys_id_fk` FOREIGN KEY (`surveyId`) REFERENCES `surveys`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `survey_deliveries` ADD CONSTRAINT `survey_deliveries_journeyId_journeys_id_fk` FOREIGN KEY (`journeyId`) REFERENCES `journeys`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `audit_logs_organisation_index` ON `audit_logs` (`organisationId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `audit_logs_actor_index` ON `audit_logs` (`actorUserId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `organisation_invitations_organisation_index` ON `organisation_invitations` (`organisationId`,`status`);--> statement-breakpoint
CREATE INDEX `organisation_invitations_email_index` ON `organisation_invitations` (`email`);--> statement-breakpoint
CREATE INDEX `organisation_subscriptions_customer_index` ON `organisation_subscriptions` (`stripeCustomerId`);--> statement-breakpoint
CREATE INDEX `survey_deliveries_organisation_index` ON `survey_deliveries` (`organisationId`,`status`);--> statement-breakpoint
CREATE INDEX `survey_deliveries_recipient_index` ON `survey_deliveries` (`organisationId`,`recipientHash`,`createdAt`);