# SEC-2026-ACCESS-001 — Access Review

| | |
|---|---|
| **Document reference** | SEC-2026-ACCESS-001 |
| **Version** | 1.0 |
| **Status** | Draft — template, no review performed yet |
| **Category** | Access Review |
| **Owner** | Gerald Rushwaya |
| **Frequency** | Every 6 months, and on any team change |

---

## 1. Purpose

To confirm, on a schedule, that every account still needs to exist and every person still needs the access they hold. Access accumulates silently; nobody is ever notified that a permission became unnecessary.

## 2. Scope

All systems holding Beplugged Tech or client data:

| System | Holds |
|---|---|
| Cloudflare | Workers, D1 database, DNS for client domains |
| Domain registrars | Client and own domains |
| Client hosting panels | Where access has been granted |
| Client CMS logins | Where access has been granted |
| Email (`info@beplugged.co.za`) | Client correspondence, invoice and receipt copies |
| Brevo | Client email addresses, sending capability |
| GitHub | Source code |
| Banking | Financial records |
| Password manager | All of the above |

## 3. Procedure

For each system in §2:

1. List every account and every person with access.
2. For each, ask: **does this still need to exist?** A departed contractor, a finished project, a former client — all mean no.
3. For each remaining, ask: **is the access level still the minimum needed?**
4. Confirm multi-factor authentication is enabled where supported.
5. Remove what is not needed. Record the removal.
6. Note anything that could not be removed and why.

Also check for client credentials still held after project closure. SOP-DEL-001 §5.9 requires removal at closure; this review catches what was missed.

## 4. Review record

> **No review performed yet.** Complete a copy of this section each time.

**Review date:** ______  **Performed by:** ______  **Previous review:** ______

| System | Accounts found | MFA enabled | Removed | Retained | Notes |
|---|---|---|---|---|---|
| Cloudflare | | | | | |
| Domain registrars | | | | | |
| Client hosting | | | | | |
| Client CMS logins | | | | | |
| Email | | | | | |
| Brevo | | | | | |
| GitHub | | | | | |
| Banking | | | | | |
| Password manager | | | | | |

### Findings

*Anything unexpected: shared logins, credentials outside the password manager, MFA not enabled, access retained for a closed project.*

### Actions

| # | Action | Owner | Due | Status |
|---|---|---|---|---|
| | | | | |

Anything indicating a process failure — rather than a one-off — is raised as a corrective action (QMS-2026-CAPA-001).

## 5. Known items to check at first review

Not findings; items already known to warrant checking.

- Cloudflare account MFA status
- Whether any client credentials are held outside a password manager
- Whether `ADMIN_PASSWORD` for the admin system is of adequate strength, given the login endpoint has no rate limiting
- Who besides the owner can access `info@beplugged.co.za`

## 6. Related documents

- QMS-2026-POL-002 — Information Security Policy
- SEC-2026-RISK-001 — Client Data Risk Register
- SOP-DEL-001 — Project Delivery

## 7. Revision history

| Version | Date | Author | Change |
|---|---|---|---|
| 1.0 | 2026-07-28 | Gerald Rushwaya | Template created. No review performed yet |
