# SEC-2026-RISK-001 — Client Data Risk Register

| | |
|---|---|
| **Document reference** | SEC-2026-RISK-001 |
| **Version** | 1.1 |
| **Status** | Draft — risks identified, one part treated, scores not yet accepted |
| **Category** | Risk Register |
| **Owner** | Gerald Rushwaya |
| **Frequency** | Reviewed at each management review |

---

## 1. Purpose

To record the risks to client data and systems that Beplugged Tech is responsible for, so decisions about them are deliberate rather than accidental.

## 2. Scoring

**Likelihood** and **Impact** are each rated 1–5. **Score = Likelihood × Impact.**

| Score | Response |
|---|---|
| 15–25 | Act now. Do not accept without a dated plan |
| 8–14 | Plan a mitigation with an owner and date |
| 4–7 | Monitor. Review each quarter |
| 1–3 | Accept and record |

## 3. Register

The risks below are **identified from how the business actually operates**. Scores are proposed starting points for discussion — they have not been assessed or accepted by the owner. The Treatment column is filled only where a control has actually been applied.

| Ref | Risk | Cause | Impact if it happens | L | I | Score | Treatment | Owner | Status |
|---|---|---|---|---|---|---|---|---|---|
| R-01 | Client credentials exposed | Credentials sent by WhatsApp or email, or stored in project notes rather than a password manager | Attacker gains control of a client's domain, hosting, or CMS. Client harmed directly | 3 | 5 | 15 | | | Open |
| R-02 | D1 data loss with no verified restore | Backup position for D1 not yet confirmed or tested | Loss of invoices, payments, and client records. Financial and legal exposure | 2 | 5 | 10 | | | Open |
| R-03 | Admin password brute-forced | Password strength not verified. Rate limiting now applied but is permissive by design | Full access to all client data, invoices, and CRM records | 2 | 5 | 10 | Reduced: rate limit applied to `/api/auth/login`. Outstanding: set a long `ADMIN_PASSWORD` | Owner | Part treated |
| R-04 | Single point of knowledge | One person holds all access, context, and client relationships | Business cannot operate if that person is unavailable. Clients stranded | 2 | 4 | 8 | | | Open |
| R-05 | Personal information mishandled | POPIA obligations on enquiry and client data not formalised | Regulatory exposure, client trust damage | 2 | 4 | 8 | | | Open |
| R-06 | Client site compromised after handover | Site left with the client, no maintenance agreement, dependencies age | Reputational damage — the client associates it with Beplugged Tech regardless of contract | 3 | 3 | 9 | | | Open |
| R-07 | Access retained after project closure | Removal at closure depends on remembering | Unnecessary standing access to former client systems | 3 | 3 | 9 | | | Open |
| R-08 | Third-party service failure | Reliance on Cloudflare and Brevo | Sites or client email delivery unavailable, no direct remedy | 2 | 3 | 6 | | | Open |
| R-09 | Enquiry form abused | `/api/contact` is unauthenticated; rate limiting is permissive by design | Email quota drained, business inbox flooded | 3 | 2 | 6 | | | Open |

## 4. Completing this register

For each risk:

1. **Agree the scores.** The proposed values are a starting point, not an assessment.
2. **Decide a treatment** — reduce, transfer, avoid, or accept:
   - **Reduce** — do something that lowers likelihood or impact
   - **Transfer** — insurance, or a contractual term
   - **Avoid** — stop doing the thing that creates the risk
   - **Accept** — record that it is accepted, by whom, and why
3. **Set an owner and a date** for anything not accepted.
4. **Re-score** once the treatment is in place.

Accepting a risk is a legitimate decision. Accepting it silently is not — an accepted risk must be written down as accepted.

## 5. Notes on specific risks

**R-01 and R-03** are the two worth addressing first. Both give an attacker access to everything, and both currently rely on care rather than a control.

**R-03** is now part treated. A rate limit binding was applied to
`/api/auth/login`, but the binding is permissive by design: measured against
production, nineteen attempts got through before the first rejection. That caps
sustained brute force without making a short password safe, so the residual risk
sits almost entirely on password strength. Setting a long `ADMIN_PASSWORD` is
the remaining half and closes the risk.

**R-02** cannot be scored honestly until the D1 backup position is established (SEC-2026-DR-001 §2).

## 6. Related documents

- QMS-2026-POL-002 — Information Security Policy
- SEC-2026-ACCESS-001 — Access Review
- SEC-2026-DR-001 — Backup and Recovery Test
- QMS-2026-MRV-001 — Management Review

## 7. Revision history

| Version | Date | Author | Change |
|---|---|---|---|
| 1.0 | 2026-07-28 | Gerald Rushwaya | Register created. Risks identified from current operations; scores proposed, not yet assessed |
| 1.1 | 2026-07-29 | Gerald Rushwaya | R-03 part treated: rate limiting applied to the login endpoint, likelihood re-scored 3 to 2 |
