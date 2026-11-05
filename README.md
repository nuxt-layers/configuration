# @nuxt-layers/configuration

Nuxt 4 foundation layer for the facts a site states about itself and its organisation: its name, the organisation's legal details and address, contact points, social links, legal pages and presentation defaults, for the platform, each tenant and each group; and the settings a host declares per account, which only the account's own person reads or changes.

A platform foundation layer, not a member of the Identity and Access Management (IAM) suite. It reaches Identity and Authorisation only through ports the host supplies, never imports them, and follows the suite's approvals process for its own changes.

The layer exposes an HTTP API, client composables, administration screens, account-scoped settings, export/import and host-supplied IAM adapters. See the [standalone host contract](CONTRACT.md) for the current development integration.

## Owns

- Declared settings: each one a key, a schema, the scopes that may set it, who may read it, its risk and its default. Nothing undeclared is stored.
- The values of those settings for the platform, for each tenant, for each standard group and for each person's own account, keyed by Identity's opaque identifiers.
- Resolving a setting's value in force, from its default, the deployment, the platform, the tenant and the group's lineage, with where each value came from.
- Pending changes to those values, their approvals and their history.

## Never owns

| Not here | Owned by |
|---|---|
| Anything that describes a person (names, contact details, locale, time zone, chosen theme) | Profile |
| Sign-in identifiers, credentials and authentication policy (MFA, session lifetimes) | Authentication |
| Tenants, groups, group names, the hierarchy, group settings, approval requirements, safety periods and memberships | Identity |
| Roles, grants and access decisions | Authorisation |
| Theme definitions | Theme Manager |
| Secrets (SMTP passwords, API keys, client secrets) | The host's environment or secret store |
| Uploaded files (logos, images) | The host's asset store: configuration holds only a reference |

An organisation's address or contact point can still be personal data (a sole trader's home, a named officer). Such settings are declared `possibly-personal`: they never reach events or logs, and a contact point names a role or a mailbox, never a person. Where a person must be named, the setting holds Identity's identifier and the page shows the name through Profile.

## Interfaces

| Direction | Interface | Purpose |
|---|---|---|
| Consumes from Identity | Directory, access-governance and tenant ports | Groups' tenant, lineage, kind and state; a tenant's state; approval requirements, safety periods and owners for the approval route |
| Consumes from Identity | Its tenant and disposal events, through `applyConfigurationIdentityEvent` | Tenant states, and disposal of a group's or tenant's values when due |
| Consumes from Authorisation | Access-decision port | Whether the subject may request or approve a change, and how many others qualify |
| Consumes from the host | Subject resolver, database, clock, setting declarations | The signed-in subject and its assurance; storage under ADR-0002; the host's and other layers' own settings |
| Provides to pages | `useConfiguration()`, `useConfigurationHead()`, `Configuration*` components | Values in force, head and SEO defaults, and administration pages with pending changes |
| Provides to other layers, through the host | `getConfiguration()` | Values the host passes into other layers' ports (for example the site name in Authentication's emails) |
| Publishes | `configuration.change-requested`, `configuration.change-decided`, `configuration.change-held`, `configuration.changed`, `configuration.reset` | Keys, scopes, identifiers and codes only, never a value |

## Documentation

- [Host contract](CONTRACT.md): the one page a host needs to compose the layer (ADR-0012 §6)
- [Contract](docs/contracts.md) (version 1): boundaries, declarations, scopes and precedence, visibility, changes and approvals, events, ports, server functions, HTTP API and presentation
- [Roadmap](docs/roadmap.md)
- Clock presentation preferences are optional **host-declared settings**, not built-in keys; their complete integration is in [CONTRACT.md](CONTRACT.md).

## Documentation checks

`python3 scripts/check_markdown.py` checks headings, local links and unsupported development references.

## Governing decisions and specifications

The authoritative ecosystem rules live in `nuxt-layers/architecture-rules`. The [host contract](CONTRACT.md) records Configuration's supported integration surface, including optional Clock presentation preferences; [docs/contracts.md](docs/contracts.md) explains the implementation boundaries.
