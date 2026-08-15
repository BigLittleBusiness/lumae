CREATE TABLE `journeys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organisationId` int NOT NULL,
	`surveyId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`triggerType` enum('manual','api_event','scheduled') NOT NULL DEFAULT 'manual',
	`channel` enum('email','sms','in_app','qr') NOT NULL DEFAULT 'email',
	`audienceDescription` text,
	`frequencyGuardDays` int NOT NULL DEFAULT 30,
	`status` enum('draft','published','paused','archived') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `journeys_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `organisation_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organisationId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('owner','admin','manager','analyst','responder','viewer') NOT NULL DEFAULT 'viewer',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `organisation_members_id` PRIMARY KEY(`id`),
	CONSTRAINT `organisation_members_member_unique` UNIQUE(`organisationId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE `organisations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(160) NOT NULL,
	`slug` varchar(80) NOT NULL,
	`industry` varchar(80) NOT NULL,
	`companySize` varchar(40) NOT NULL,
	`plan` enum('signal','momentum','clarity') NOT NULL DEFAULT 'signal',
	`brandName` varchar(160),
	`brandPrimaryColor` varchar(16) NOT NULL DEFAULT '#0E867E',
	`timezone` varchar(64) NOT NULL DEFAULT 'Australia/Sydney',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `organisations_id` PRIMARY KEY(`id`),
	CONSTRAINT `organisations_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `response_actions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organisationId` int NOT NULL,
	`responseId` int NOT NULL,
	`assignedToUserId` int,
	`status` enum('open','in_progress','resolved') NOT NULL DEFAULT 'open',
	`actionText` text NOT NULL,
	`resolutionNote` text,
	`dueAt` timestamp,
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `response_actions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `survey_questions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`surveyId` int NOT NULL,
	`position` int NOT NULL,
	`questionType` enum('nps','csat','ces','rating','text','multiple_choice') NOT NULL,
	`prompt` text NOT NULL,
	`scaleMax` int,
	`required` boolean NOT NULL DEFAULT true,
	`configuration` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `survey_questions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `survey_responses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organisationId` int NOT NULL,
	`surveyId` int NOT NULL,
	`journeyId` int,
	`score` int,
	`comment` text,
	`sentiment` enum('unknown','positive','neutral','negative') NOT NULL DEFAULT 'unknown',
	`status` enum('new','in_progress','closed') NOT NULL DEFAULT 'new',
	`externalReference` varchar(160),
	`context` text,
	`receivedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `survey_responses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `surveys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organisationId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`surveyType` enum('nps','csat','ces','custom') NOT NULL,
	`status` enum('draft','published','paused','archived') NOT NULL DEFAULT 'draft',
	`introductionText` text,
	`thankYouText` text,
	`createdByUserId` int NOT NULL,
	`publishedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `surveys_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `journeys` ADD CONSTRAINT `journeys_organisationId_organisations_id_fk` FOREIGN KEY (`organisationId`) REFERENCES `organisations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `journeys` ADD CONSTRAINT `journeys_surveyId_surveys_id_fk` FOREIGN KEY (`surveyId`) REFERENCES `surveys`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `organisation_members` ADD CONSTRAINT `organisation_members_organisationId_organisations_id_fk` FOREIGN KEY (`organisationId`) REFERENCES `organisations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `organisation_members` ADD CONSTRAINT `organisation_members_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `response_actions` ADD CONSTRAINT `response_actions_organisationId_organisations_id_fk` FOREIGN KEY (`organisationId`) REFERENCES `organisations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `response_actions` ADD CONSTRAINT `response_actions_responseId_survey_responses_id_fk` FOREIGN KEY (`responseId`) REFERENCES `survey_responses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `response_actions` ADD CONSTRAINT `response_actions_assignedToUserId_users_id_fk` FOREIGN KEY (`assignedToUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `survey_questions` ADD CONSTRAINT `survey_questions_surveyId_surveys_id_fk` FOREIGN KEY (`surveyId`) REFERENCES `surveys`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `survey_responses` ADD CONSTRAINT `survey_responses_organisationId_organisations_id_fk` FOREIGN KEY (`organisationId`) REFERENCES `organisations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `survey_responses` ADD CONSTRAINT `survey_responses_surveyId_surveys_id_fk` FOREIGN KEY (`surveyId`) REFERENCES `surveys`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `survey_responses` ADD CONSTRAINT `survey_responses_journeyId_journeys_id_fk` FOREIGN KEY (`journeyId`) REFERENCES `journeys`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `surveys` ADD CONSTRAINT `surveys_organisationId_organisations_id_fk` FOREIGN KEY (`organisationId`) REFERENCES `organisations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `surveys` ADD CONSTRAINT `surveys_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `journeys_organisation_index` ON `journeys` (`organisationId`);--> statement-breakpoint
CREATE INDEX `journeys_survey_index` ON `journeys` (`surveyId`);--> statement-breakpoint
CREATE INDEX `organisation_members_user_index` ON `organisation_members` (`userId`);--> statement-breakpoint
CREATE INDEX `response_actions_organisation_index` ON `response_actions` (`organisationId`,`status`);--> statement-breakpoint
CREATE INDEX `response_actions_response_index` ON `response_actions` (`responseId`);--> statement-breakpoint
CREATE INDEX `response_actions_assignee_index` ON `response_actions` (`assignedToUserId`,`status`);--> statement-breakpoint
CREATE INDEX `survey_questions_survey_index` ON `survey_questions` (`surveyId`,`position`);--> statement-breakpoint
CREATE INDEX `survey_responses_organisation_index` ON `survey_responses` (`organisationId`,`receivedAt`);--> statement-breakpoint
CREATE INDEX `survey_responses_survey_index` ON `survey_responses` (`surveyId`);--> statement-breakpoint
CREATE INDEX `survey_responses_status_index` ON `survey_responses` (`organisationId`,`status`);--> statement-breakpoint
CREATE INDEX `surveys_organisation_index` ON `surveys` (`organisationId`);--> statement-breakpoint
CREATE INDEX `surveys_status_index` ON `surveys` (`organisationId`,`status`);