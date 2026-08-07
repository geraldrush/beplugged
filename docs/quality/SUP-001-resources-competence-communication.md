# QMS-2026-SUP-001 — Resources, Competence, Awareness and Communication

| | |
|---|---|
| **Document reference** | QMS-2026-SUP-001 |
| **Version** | 1.0 |
| **Status** | Approved — in force |
| **Approved** | 2026-08-07 by Gerald Rushwaya |
| **Category** | Support |
| **Owner** | Gerald Rushwaya |
| **Approver** | Gerald Rushwaya |
| **Effective date** | 2026-08-07 |
| **Next review** | 2027-08-07 |

---

## 1. Purpose

To record the resources the business depends on, the competence required to do the work, how people are made aware of what matters, and how communication happens.

Satisfies ISO 9001:2015 clauses 7.1.1 to 7.1.4, 7.1.6, 7.2, 7.3 and 7.4.

## 2. Resources — 7.1.1 to 7.1.4

### 2.1 People

The business is operated by one person. Contractors are engaged as needed under SOP-SUP-001 §7.

**This is recorded as a limitation, not a detail.** Capacity is finite, work stops if that person is unavailable, and both facts are treated as risks in SEC-2026-RISK-001 rather than as things to hope about.

### 2.2 Infrastructure

| Resource | Used for | If unavailable |
|---|---|---|
| Development machine | All work | Work stops. Repository is on GitHub, so no work is lost; another machine can be set up from it |
| Internet connection | All work, all client communication | Mobile fallback |
| Electricity | All work | *[confirm: battery, inverter or generator arrangement]* |
| GitHub | Source of truth for code and QMS documents | Local clones remain complete and usable |
| Cloudflare | Client hosting, invoicing system, database | Highest impact. See SOP-SUP-001 §5 |

### 2.3 Environment for the operation of processes

Work is performed from a home or office environment with the quiet needed for concentration, and with client information kept where it cannot be read by others. No special environmental conditions — temperature, cleanliness, static control — affect conformity of the service.

## 3. Organizational knowledge — 7.1.6

| Knowledge | Where it lives | How it is preserved |
|---|---|---|
| How the invoicing and quoting system works | Repository, `ARCHITECTURE.md`, code comments | Version-controlled; comments explain why, not only what |
| How each client's system is built and hosted | Project record, handover pack | One pack per client, retained 5 years |
| How the business's processes work | `docs/` | This QMS |
| Client credentials and access | *[confirm: password manager in use]* | Per POL-002 |
| C++ and web development skill | The owner | §4 |

### 3.1 The knowledge risk

The largest single risk to this business is that a client system exists which nobody but the owner understands. The controls against it are:

- Every project produces a handover pack that a competent developer could work from
- Client sites are built on Cloudflare and standard web technology, not on anything proprietary to the business
- Code and documents live in a repository that another person can be granted access to
- Clients can be given control of their own domain and hosting on request

*[Confirm: consider whether a named person should hold emergency access to the repository and password manager, and record the decision either way.]*

## 4. Competence — 7.2

### 4.1 Competence required

| Work | Competence needed |
|---|---|
| Requirements capture and quoting | Ability to elicit requirements and identify what has not been said; commercial judgement |
| Web and application development | HTML, CSS, JavaScript, C++ where relevant, Cloudflare Workers and D1, version control |
| Security of client data | Working knowledge of POPIA obligations and of the controls in POL-002 |
| Quality management | Working knowledge of ISO 9001:2015 as it applies to this business |

### 4.2 Evidence held

| Person | Role | Evidence of competence |
|---|---|---|
| Gerald Rushwaya | Owner, all roles | *[confirm: qualifications, years of experience, notable delivered projects]* |

*[Confirm: complete the row above. An auditor will ask for it, and "I have been doing this for years" is acceptable only if the years are stated and a portfolio can be shown.]*

### 4.3 Where competence is lacking

Where work requires competence not held, the options are: acquire it and record the training; engage a contractor with it under SOP-SUP-001 §7; or decline the work. Which was chosen is recorded in the project record.

**Declining work outside competence is a legitimate and recorded outcome, not a failure.**

### 4.4 Maintaining competence

Technology in use changes. Training, courses and material study undertaken are recorded below and reviewed annually.

| Date | Person | Training or study | Why | Evidence |
|---|---|---|---|---|
| | | | | |

## 5. Awareness — 7.3

Anyone doing work for the business, including contractors, must be aware of:

- The quality policy (POL-001) and what it commits to
- The quality objectives (OBJ-001) relevant to their work
- How their work contributes to those objectives
- What happens if the management system is not followed — specifically, that unverified work reaching a client is a recorded nonconformity
- Their obligations under the information security policy (POL-002)

### 5.1 Record of awareness

Recorded before any contractor begins work. A signed or emailed acknowledgement is sufficient.

| Date | Person | Confirmed aware of | Evidence |
|---|---|---|---|
| 2026-08-07 | Gerald Rushwaya | POL-001, POL-002, OBJ-001 — as author and approver of each | This document |

## 6. Communication — 7.4

### 6.1 External

| What | With whom | When | How | Who |
|---|---|---|---|---|
| Quotes and scope agreements | Prospective clients | Before work starts | Written, via the system | Owner |
| Progress updates | Clients | At each milestone, and on any delay | Email | Owner |
| Delay notification | Clients | As soon as a delay is known, never after the date has passed | Email, followed by call if material | Owner |
| Invoices and statements | Clients | Per SOP-FIN-001 | System, via Brevo | Owner |
| Handover pack | Clients | At handover | Written | Owner |
| Feedback request | Clients | After handover | Email | Owner |
| Incident affecting a live client system | Affected client | Immediately on discovery | Call, then written confirmation | Owner |
| Data breach affecting personal data | Affected parties and the Information Regulator | Per POPIA timeframes | Per POL-002 | Owner |

### 6.2 Internal

With one person, internal communication is largely the written record itself. Where contractors are engaged:

| What | With whom | When | How |
|---|---|---|---|
| Brief and acceptance criteria | Contractor | Before work starts | Written |
| Verification result | Contractor | On completion | Written |
| Quality policy and objectives | Contractor | Before work starts | §5.1 |

### 6.3 The rule behind the table

Anything that affects a client's cost, date or data is communicated in writing, by the owner, as soon as it is known. Nothing on that list is communicated only verbally, and nothing is communicated after the fact.

## 7. Related documents

- QMS-2026-POL-001 — Quality Management Policy
- QMS-2026-POL-002 — Information Security Policy
- QMS-2026-QMS-001 — QMS Scope, Context and Processes
- QMS-2026-OBJ-001 — Quality Objectives
- SOP-SUP-001 — Control of External Providers
- SEC-2026-RISK-001 — Client Data Risk Register

## 8. Revision history

| Version | Date | Author | Change |
|---|---|---|---|
| 1.0 | 2026-08-07 | Gerald Rushwaya | Created and approved. Closes G-11, G-13, G-14, G-15 and G-16. Items marked *[confirm]* require the owner's input |
