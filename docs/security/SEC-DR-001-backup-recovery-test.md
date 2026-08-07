# SEC-2026-DR-001 — Backup and Recovery Test

| | |
|---|---|
| **Document reference** | SEC-2026-DR-001 |
| **Version** | 1.0 |
| **Status** | Approved — in force — template, no test performed yet |
| **Approved** | 2026-08-07 by Gerald Rushwaya |
| **Category** | Recovery Test |
| **Owner** | Gerald Rushwaya |
| **Frequency** | Quarterly |

---

## 1. Purpose

To confirm by actually doing it that data can be restored. An untested backup is an assumption, and the assumption is usually discovered to be wrong at the worst possible moment.

## 2. Scope

| Asset | Where it lives | Backup today |
|---|---|---|
| D1 database — invoices, quotes, clients, payments, CRM, quality and security records | Cloudflare D1 | **To be confirmed** |
| Source code | GitHub | Held in remote repository |
| Static assets — images, documents | Cloudflare Workers Assets, from the repository | Held in repository |
| Client sites hosted elsewhere | Client hosting | Client's responsibility unless contracted |
| Email | `info@beplugged.co.za` mailbox | Provider-dependent |

> The D1 backup position must be established before the first test. Cloudflare offers Time Travel point-in-time restore for D1, but the retention window depends on plan. Whether that alone is sufficient — and whether an independent export is needed — is the first question this test answers.

## 3. Procedure

1. **Confirm a backup exists** and note its timestamp and mechanism.
2. **Restore it somewhere that is not production.** A restore into production is not a test, it is an incident.
3. **Verify the restored data**: row counts on key tables, a known invoice present and correct, a known payment matching its receipt.
4. **Record how long it took** from deciding to restore to having usable data. This is the real recovery time, and it is normally longer than expected.
5. **Record anything that did not work.**
6. **Raise a corrective action** for any gap found.

## 4. Test record

> **No test performed yet.**

**Test date:** ______  **Performed by:** ______  **Previous test:** ______

| Asset | Backup exists | Backup dated | Restore attempted | Restore succeeded | Time to restore | Notes |
|---|---|---|---|---|---|---|
| D1 database | | | | | | |
| Source code | | | | | | |
| Static assets | | | | | | |
| Email | | | | | | |

### Verification checks

- [ ] Row counts on `invoices`, `payments`, `quotes`, `clients` match expectation
- [ ] A known invoice is present with the correct total
- [ ] A known payment is present and its receipt reconciles
- [ ] Quality and security records restored
- [ ] Restored system starts and serves requests

### Findings

*What did not work, took longer than expected, or was not backed up at all.*

### Actions

| # | Action | Owner | Due | Status |
|---|---|---|---|---|
| | | | | |

## 5. Targets to agree

These need a decision before the first test, so results can be judged against something.

- **Recovery point objective** — how much data loss is acceptable. One hour? One day?
- **Recovery time objective** — how quickly the system must be usable again.
- **Retention** — how far back a restore must be possible.

## 6. Related documents

- QMS-2026-POL-002 — Information Security Policy
- QMS-2026-CAPA-001 — Corrective Action Register
- SOP-SEC-002 — Backup and Recovery *(not yet written)*

## 7. Revision history

| Version | Date | Author | Change |
|---|---|---|---|
| 1.0 | 2026-07-28 | Gerald Rushwaya | Template created. No test performed yet |
| 1.0 | 2026-08-07 | Gerald Rushwaya | Approved and issued for use. No change to the content |
