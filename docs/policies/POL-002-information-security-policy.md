# QMS-2026-POL-002 — Information Security Policy

| | |
|---|---|
| **Document reference** | QMS-2026-POL-002 |
| **Version** | 1.0 |
| **Status** | Draft |
| **Category** | Policy |
| **Owner** | Gerald Rushwaya |
| **Approver** | Gerald Rushwaya |
| **Effective date** | *to be set on approval* |
| **Next review** | *effective date + 12 months* |

---

## 1. Purpose

To state how Beplugged Tech protects its own information and, more importantly, the client information and systems it is trusted with.

## 2. Scope

Applies to all information handled by Beplugged Tech, including:

- Client credentials — domain registrars, hosting panels, CMS logins, payment gateways
- Client personal information collected through enquiry forms and project work
- Client systems and websites under Beplugged Tech's control
- Beplugged Tech's own accounts, source code, and financial records

## 3. Policy statement

Beplugged Tech holds credentials and personal information belonging to other businesses. A compromise would damage those clients, not only Beplugged Tech. Access is therefore granted narrowly, held securely, and removed when no longer needed.

## 4. Commitments

### 4.1 Access

1. **Prefer delegated access.** Where a client can grant access under their own account, that is done instead of sharing a password.
2. **Never transmit credentials in plain channels.** Not by WhatsApp, SMS, or unencrypted email where it can be avoided. Where a credential must be sent, it is changed afterwards.
3. **No credentials in project notes, spreadsheets, or chat history.** Credentials belong in a password manager.
4. **Unique passwords per service.** No reuse across clients or systems.
5. **Multi-factor authentication** enabled on every account that supports it — Cloudflare, domain registrars, email, banking, GitHub.
6. **Remove access at project closure** (SOP-DEL-001 §5.9), and record that it was removed.

### 4.2 Client data

1. Collect only the personal information needed for the work (POPIA — SOP-CLI-001 §8).
2. Do not pass client contact details to third parties without permission.
3. Delete data that is past its retention period.
4. Where a site collects personal information, ensure it has a privacy policy before launch.

### 4.3 Systems

1. Production secrets are held as platform secrets, never committed to source control.
2. Source repositories contain no credentials, API keys, or personal data.
3. Software and dependencies are kept reasonably current.
4. Backups are taken and their restoration tested (SOP-SEC-002, pending).

### 4.4 Incidents

Any suspected compromise — a leaked credential, an unexpected login, a defaced site — is treated as an incident:

1. Change the affected credentials immediately.
2. Establish what was accessed and over what period.
3. Notify any affected client without delay. Under POPIA, a breach involving personal information may require notifying the Information Regulator and the data subjects.
4. Record it as a security record and raise a corrective action.

Disclosing an incident promptly is a smaller problem than being found to have concealed one.

## 5. Responsibilities

| Role | Responsibility |
|---|---|
| **Owner** | Sets this policy, maintains the password manager, performs access reviews |
| **Anyone with access to client systems** | Follows §4, and reports anything suspicious immediately |

## 6. Review

Access is reviewed at least every six months against SEC-2026-ACCESS-001, confirming that every account still needs to exist and every person still needs their access.

## 7. Related documents

- QMS-2026-POL-001 — Quality Management Policy
- SEC-2026-ACCESS-001 — Access Review
- SEC-2026-RISK-001 — Client Data Risk Register
- SOP-DEL-001 — Project Delivery
- SOP-SEC-001 — Access and Credential Management *(not yet written)*

## 8. Revision history

| Version | Date | Author | Change |
|---|---|---|---|
| 1.0 | 2026-07-28 | Gerald Rushwaya | Initial draft |
