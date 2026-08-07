# QMS-2026-AUD-001 — Internal Audit Procedure and Programme

| | |
|---|---|
| **Document reference** | QMS-2026-AUD-001 |
| **Version** | 1.0 |
| **Status** | Approved — in force — no audit performed yet |
| **Approved** | 2026-08-07 by Gerald Rushwaya |
| **Category** | Internal Audit |
| **Owner** | Gerald Rushwaya |
| **Approver** | Gerald Rushwaya |
| **Effective date** | 2026-08-07 |
| **Next review** | 2027-08-07 |

---

## 1. Purpose

To check, on a schedule and by someone independent of the work, whether the quality management system is being followed and whether it is working.

Satisfies ISO 9001:2015 clause 9.2.

## 2. The problem this procedure has to solve first

Clause 9.2.2(c) requires auditors to be **objective and impartial**, and states that auditors shall not audit their own work.

In a one-person business the owner performs every process, so the owner cannot audit any of it. There is no way to write around this. It is the one requirement of ISO 9001 that cannot be satisfied internally here.

### 2.1 The options

| Option | Viability |
|---|---|
| Owner audits own work | **Not acceptable.** Fails 9.2.2(c) directly. A certification body will raise it as a major nonconformity |
| Contract an independent internal auditor | **The workable option.** A qualified auditor engaged per audit |
| Reciprocal audit with another small business having a QMS | Acceptable if the other party is competent and genuinely independent |
| Use the certification body's auditor | **Not acceptable.** They cannot audit what they will later certify |

**Decision: contract an independent internal auditor.** *[Confirm: identify and engage one. Budget for one audit per year at minimum. This is the single unavoidable cost in reaching certification.]*

The auditor is an external provider and is selected and recorded under SOP-SUP-001, with competence evidence retained — typically an ISO 9001 lead auditor qualification.

## 3. Audit programme

Every clause of ISO 9001:2015 is audited at least once per year. Processes are audited more often where their failure would affect a client, or where a previous audit or corrective action found a problem.

| Cycle | Clauses and processes audited | Frequency | Why this frequency |
|---|---|---|---|
| **A** | 8.3 design and development, 8.5 service provision, 8.6 release, 8.7 nonconforming output | Twice yearly | The core of what the business does, and where client impact is highest |
| **B** | 4 context, 5 leadership, 6 planning, 9.1 monitoring, 9.3 management review, 10 improvement | Annually | Whole-system clauses; change slowly |
| **C** | 7 support — resources, competence, awareness, communication, documented information | Annually | Changes only when people or tools change |
| **D** | 8.1, 8.2 requirements and customer communication, 8.4 external providers | Annually | Stable once the SOPs are operating |

An audit may be brought forward where a corrective action, a client complaint or a significant change makes it useful.

### 3.1 Schedule

| Audit | Cycles covered | Planned | Auditor | Performed | Report |
|---|---|---|---|---|---|
| 1 | A, B, C, D — full system, first audit | *[confirm: within 3 months of the QMS operating]* | *[to be appointed]* | — | — |
| 2 | A | +6 months | | | |
| 3 | A, B, C, D | +12 months | | | |

**The first audit should be a full-system audit.** It is the last opportunity to find problems before a certification body does, and finding them internally is far cheaper.

## 4. Audit procedure

### 4.1 Plan

For each audit, record before it starts:

- **Criteria** — the clauses of ISO 9001:2015 and the documents being audited against
- **Scope** — which processes, which period, which projects sampled
- **Method** — document review, interview, examination of records, observation of work
- **Auditor** — named, with the basis of their independence recorded
- **Dates**

### 4.2 Conduct

The auditor examines evidence, not intentions. For each requirement in scope they establish whether:

1. A documented process exists where one is required
2. It says what the standard requires
3. It is actually being followed
4. It is producing the intended result

Point 3 is where most findings arise, and it can only be established from records. The auditor is given access to `docs/`, the project records, the D1 database and the repository history.

### 4.3 Findings

| Type | Meaning | Response required |
|---|---|---|
| **Major nonconformity** | A requirement of the standard is not met at all, or a failure affecting a client | Corrective action in CAPA-001, with a date |
| **Minor nonconformity** | A single lapse in an otherwise working process | Corrective action in CAPA-001 |
| **Observation** | Conforms, but is fragile or could be improved | Considered at management review; action optional |
| **Conformity** | Requirement met, with evidence | Recorded — a clean finding is evidence too |

Every finding cites the clause and the evidence examined. A finding without evidence is an opinion.

### 4.4 Report

The audit report records: criteria, scope, auditor, dates, evidence examined, findings by type, and a conclusion on whether the QMS conforms and is effective.

Reports are kept in `docs/quality/` and retained 3 years.

### 4.5 Follow-up

1. Findings become entries in CAPA-001, each with an owner and a date.
2. Correction is made and the cause addressed.
3. **The auditor confirms effectiveness at the next audit.** A finding is not closed by asserting it was fixed.
4. Results are an input to the next management review — MRV-001 requires them.

## 5. Records retained

| Record | Retained |
|---|---|
| Audit programme and any changes to it | 3 years |
| Audit plans | 3 years |
| Audit reports and findings | 3 years |
| Evidence of auditor competence and independence | While engaged, plus 3 years |
| Corrective actions arising | Per CAPA-001 |

## 6. Related documents

- QMS-2026-QMS-001 — QMS Scope, Context and Processes
- QMS-2026-CAPA-001 — Corrective Action Register
- QMS-2026-MRV-001 — Management Review
- QMS-2026-GAP-001 — ISO 9001:2015 Gap Register
- SOP-SUP-001 — Control of External Providers

## 7. Revision history

| Version | Date | Author | Change |
|---|---|---|---|
| 1.0 | 2026-08-07 | Gerald Rushwaya | Created and approved. Closes G-34 as a procedure. The gap is not fully closed until an auditor is appointed and the first audit performed |
