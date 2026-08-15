# Lumae Application MVP — Initial Build Boundary

## Product Loop

The first application build implements the core Lumae loop: **collect → understand → recover → improve**. It is designed for a signed-in team to create an organisation, build and publish an NPS, CSAT, CES, or custom survey, then establish the data structures needed to view feedback and own follow-up actions.

## Initial User Flows

| Area | Initial user flow | First-build outcome |
| --- | --- | --- |
| Workspace | Sign in → create organisation → invite-ready role model | A tenant-safe home for all organisation data. |
| Survey studio | Create survey → select measurement type → edit question → publish | A real persisted survey draft and a clear publication state. |
| Response intelligence | Open response feed → filter-ready records → inspect customer context | A privacy-conscious response model ready for real delivery channels. |
| Action tracking | Assign response → record next step → resolve | An ownership model for closed-loop service recovery. |
| Reporting | View counts and score-ready data by organisation | A reporting foundation without fabricating customer data. |
| Administration | View workspace, roles, brands, delivery and integration foundations | A clear path to future white-label, access-control, and integration capabilities. |

## MVP Deliberate Boundaries

The first build does not send email, SMS, in-app, or QR messages yet, nor does it connect to external CRMs or helpdesks. The data model includes journeys, delivery preferences, responses, actions, member roles, and organisation branding so those capabilities can be added without replacing the core domain model. Delivery automation will be designed as deterministic managed jobs or webhooks after the relevant delivery provider and expected volume are confirmed.

## Core Entities

| Entity | Purpose |
| --- | --- |
| Organisation and members | Tenant boundary, workspace identity, and role-based access. |
| Surveys and questions | Survey definition, publication state, measurement type, and question configuration. |
| Journeys | Delivery intent, channel, event/scheduled/manual trigger, audience note, and frequency safeguard. |
| Responses | Score, comment, sentiment-ready state, lifecycle status, and privacy-conscious external reference. |
| Response actions | Owner, next step, due date, resolution note, and closed-loop state. |
