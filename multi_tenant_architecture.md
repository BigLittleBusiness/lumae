# Lumae Multi-Tenant Platform Architecture

## Tenant Boundary

Every operational record is scoped to an organisation. Server procedures resolve the caller’s membership before reading or writing tenant data, and organisation identifiers are included in every tenant-owned query predicate. A user may belong to more than one organisation; the active organisation is recorded on the user account and must be an organisation for which that user has a current membership.

## Platform Administration

Platform administrators manage provider connection settings, provider health, global billing configuration, audit history, and tenant security posture. Tenant administrators manage their own members, invitations, branded survey settings, retention choices, and delivery readiness. Provider secrets are encrypted before persistence; client views receive only masked state and non-secret metadata.

## Provider Model

| Capability | Approved initial provider | Configuration authority | Activation rule |
| --- | --- | --- | --- |
| Subscription billing | Stripe | Platform administrator | Checkout is unavailable until Stripe price IDs are configured. |
| Transactional email | AWS SES | Platform administrator | Invitations and email journeys remain queued until SES is verified. |
| SMS distribution | Twilio | Platform administrator | SMS delivery requires an approved sending number or messaging service. |
| CRM | HubSpot | Platform administrator | Tenant mapping is enabled only after OAuth/API configuration and tenant consent. |
| Helpdesk | Zendesk | Platform administrator | Tenant mapping is enabled only after OAuth/API configuration and tenant consent. |
| Workforce SSO | Google Workspace and Microsoft Entra ID | Platform administrator | Tenant enforcement is enabled only after an OIDC provider is complete. |

## Security Controls

Invitation tokens are stored as hashes, recipient details are encrypted for queued delivery, audit logs are append-only at the application layer, and Stripe storage is restricted to identifiers and business-specific tenant status. Data retention defaults to 730 days and is designed to be tenant-configurable. A scheduled cleanup is not activated until retention policy confirmation and a published handler are in place.
