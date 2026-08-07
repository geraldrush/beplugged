# SOP-SUP-001 — Control of External Providers

| | |
|---|---|
| **Document reference** | SOP-SUP-001 |
| **Version** | 1.0 |
| **Status** | Approved — in force |
| **Approved** | 2026-08-07 by Gerald Rushwaya |
| **Category** | Supplier |
| **Owner** | Gerald Rushwaya |
| **Approver** | Gerald Rushwaya |
| **Effective date** | 2026-08-07 |
| **Next review** | 2027-08-07 |

---

## 1. Purpose

To control the parts of the service that other people provide, so that a failure by a supplier does not become an unmanaged failure to a client.

Satisfies ISO 9001:2015 clauses 8.4.1, 8.4.2 and 8.4.3.

## 2. Scope

Every externally provided process, product or service that ends up inside what a client receives. Three kinds:

| Kind | Examples |
|---|---|
| **Platforms the client's system runs on** | Cloudflare (hosting, Workers, D1, DNS) |
| **Services used to deliver** | Brevo (email), RapidAPI/Judge0 (academy compiler), payment providers, domain registrars |
| **People doing part of the work** | Contract developers, designers, copywriters |

## 3. Why a supplier is controlled

The degree of control depends on how badly it hurts when the supplier fails.

| Impact if it fails | Control applied |
|---|---|
| A live client site goes down | Highest — alternatives identified in advance, backups held independently, incident route agreed |
| Delivery is delayed but nothing live breaks | Moderate — evaluated before use, performance monitored |
| An internal convenience stops working | Low — replaced when convenient |

## 4. Selection criteria

Before a supplier is used for client work, confirm and record:

| Criterion | Applies to |
|---|---|
| Can it do what is needed, technically | All |
| Track record and reputation | All |
| Terms of service permit the intended use | Platforms and services |
| Where data is held, and whether that is acceptable under POPIA | Anything touching personal data |
| Continuity — what happens if they fail, and how the business would move | Platforms |
| Cost and how it scales | All |
| Competence evidence | Contractors — see §7 |
| Confidentiality undertaking | Contractors and anyone with client access |

## 5. Supplier register

| Supplier | Provides | Impact if it fails | Selected on | Evaluated | Next re-evaluation |
|---|---|---|---|---|---|
| **Cloudflare** | Hosting, Workers, D1 database, DNS, static assets | **Highest** — client sites and the invoicing system are unavailable | Platform capability, cost, integrated services, South African edge presence | *[confirm date]* | Annually |
| **Brevo** | Transactional email — invoices, quotes, notifications | High — clients stop receiving invoices and system mail | Deliverability, cost, API suitability | *[confirm date]* | Annually |
| **RapidAPI / Judge0** | C++ compilation for the COS1511 academy | Moderate — the academy Run button stops working; no client system affected | Managed service, no infrastructure to run, Piston-compatible | 2026-08-04 | Annually |
| **Domain registrar** *[confirm which]* | Domain registration and renewal | **Highest** — a lapsed domain takes a client offline entirely | *[confirm]* | *[confirm]* | Annually |
| **Contractors** | Development, design or copywriting as needed | Moderate to high depending on the work | §7 below | Per engagement | Per engagement |

*[Confirm: add any payment provider, analytics, CDN or other service in use, and complete the dates.]*

## 6. Information given to external providers — 8.4.3

Before work begins, the provider is told:

- What is required — the process, service or deliverable, in writing
- The acceptance criteria their work will be judged against
- Any competence or qualification required
- What access they are given, and to what
- How and when the business will verify their work
- Their confidentiality obligations

For platforms and services this is satisfied by their terms of service and the configuration chosen. For contractors it is a written brief, and no work starts without one.

## 7. Contractors specifically

Contractors are the highest-variability supplier, and the one an auditor will ask about.

1. **Before engagement:** confirm competence — previous work, references or a paid trial task. Record what was relied on. Obtain a signed confidentiality undertaking.
2. **Access:** grant the minimum needed, record what was granted, and set an expected end date. Access is covered by SEC-ACCESS-001 and is reviewed there.
3. **Brief:** written, with acceptance criteria.
4. **Verification:** all contractor work is verified against the brief before it goes anywhere near a client. Contractor work is never released unverified, regardless of how experienced they are.
5. **On completion:** revoke access, record the date, and record how the work performed against the brief.

Work that fails verification is handled under NCR-001 §5 as rejection and rework.

## 8. Monitoring performance

| Supplier type | Monitored by | Reviewed |
|---|---|---|
| Platforms | Incidents affecting clients; outages recorded as they occur | Each management review |
| Services | Failures affecting delivery; quota or limit breaches | Each management review |
| Contractors | Work accepted first time vs reworked; deadlines met | Per engagement, summarised at management review |

A supplier whose failure affects a client is recorded in CAPA-001, and re-evaluated against §4 at the next management review.

## 9. Related documents

- QMS-2026-QMS-001 — QMS Scope, Context and Processes
- QMS-2026-POL-002 — Information Security Policy
- SEC-2026-ACCESS-001 — Access Review
- SEC-2026-RISK-001 — Client Data Risk Register
- QMS-2026-NCR-001 — Control of Nonconforming Output

## 10. Revision history

| Version | Date | Author | Change |
|---|---|---|---|
| 1.0 | 2026-08-07 | Gerald Rushwaya | Created and approved. Closes G-22. Supplier register requires dates and additions confirmed by the owner |
