# QMS-2026-GAP-001 — ISO 9001:2015 Gap Register

| | |
|---|---|
| **Document reference** | QMS-2026-GAP-001 |
| **Version** | 1.1 |
| **Status** | Draft — 2 gaps closed, 36 open |
| **Category** | Gap Assessment |
| **Owner** | Gerald Rushwaya |
| **Assessed against** | ISO 9001:2015, clauses 4 to 10 |
| **Assessment date** | 2026-08-07 |
| **Review frequency** | Monthly until all gaps are closed, then at each management review |

---

## 1. Purpose

To record, clause by clause, what ISO 9001:2015 requires, what Beplugged Tech currently has, and what is missing — so that preparing for certification is a list of finite tasks rather than a vague ambition.

This register is the working document for that preparation. It is closed when every gap is marked complete and the evidence exists.

## 2. Scope of the assessment

All requirement clauses of ISO 9001:2015 — clauses 4 through 10. Clauses 1 to 3 are scope, references and definitions, and contain no requirements.

The assessment covers the twelve documents in `docs/` as at the assessment date, and the systems they describe.

## 3. A note on the standard used

The copy of the standard reviewed was **ISO/FDIS 9001:2015(E)** — the Final Draft International Standard, circulated for voting before publication in September 2015.

The clause structure and requirements are materially those of the published standard, so the assessment below stands. However, **a licensed copy of the published ISO 9001:2015 must be obtained before an audit.** A certification body will expect the organisation to hold the standard it is being audited against, and working from a draft is a poor first impression.

**Action:** purchase ISO 9001:2015 from the SABS or the ISO store.

## 4. How to read the ratings

| Rating | Meaning |
|---|---|
| **Met** | A document exists, covers the requirement, and has been operated at least once |
| **Documented** | A document exists and covers the requirement, but has produced no records yet |
| **Partial** | Something exists but does not cover the whole requirement |
| **Absent** | Nothing exists |

The distinction between **Met** and **Documented** matters more than anything else in this register. See §7.

## 5. Gap register

### Clause 4 — Context of the organization

| Ref | Clause | Requirement in short | Current evidence | Rating | What closes it |
|---|---|---|---|---|---|
| G-01 | 4.1 | Determine external and internal issues relevant to the business's purpose and strategic direction | None | **Absent** | A context document listing external issues (client sector conditions, competition, Cloudflare and other platform dependencies, load-shedding, exchange rate on tooling) and internal ones (single-person capacity, contractor availability, skills) |
| G-02 | 4.2 | Determine interested parties and their relevant requirements | None | **Absent** | A table of interested parties — clients, contractors, Cloudflare, Brevo, RapidAPI, SARS, students on the academy — with what each requires of the business |
| G-03 | 4.3 | Determine and document the scope of the QMS | None | **Absent** | A scope statement naming the services covered, the physical or logical boundaries, and any clause claimed as not applicable with justification |
| G-04 | 4.4 | Determine the processes needed, their sequence, interaction, criteria and measures | SOPs describe individual processes | **Partial** | A process map showing how onboarding, quoting, delivery and invoicing feed one another, with the inputs, outputs and measures for each |

### Clause 5 — Leadership

| Ref | Clause | Requirement in short | Current evidence | Rating | What closes it |
|---|---|---|---|---|---|
| G-05 | 5.1 | Top management demonstrates leadership and accountability for the QMS | Implied by POL-001 | **Partial** | Evidence rather than a statement: management review minutes, resources allocated, objectives set and tracked. Closes itself once §6 items operate |
| G-06 | 5.2 | Establish, communicate and make available a quality policy | POL-001, approved 2026-08-07 | **Documented** | **Approval done.** Remaining: record that it has been communicated to anyone doing work for the business |
| G-07 | 5.3 | Assign and communicate roles, responsibilities and authorities | None | **Absent** | A short responsibilities table. Being a one-person business does not remove this — it makes it easy. Name who approves quotes, who authorises release, who owns the QMS, and what a contractor may and may not decide |

### Clause 6 — Planning

| Ref | Clause | Requirement in short | Current evidence | Rating | What closes it |
|---|---|---|---|---|---|
| G-08 | 6.1 | Determine risks and opportunities arising from clause 4, and plan actions to address them | SEC-RISK-001 covers client data risk | **Partial** | Extend to business and quality risks — key-person dependency, a single client dominating revenue, platform lock-in, an unrenewed API quota stopping a service. Opportunities must be recorded too; the current register only has downside |
| G-09 | 6.2 | Establish measurable quality objectives, with plans saying what, who, when and how evaluated | None | **Absent** | Three to five objectives with numbers against them. Examples: projects delivered by agreed date ≥ 90%; defects reaching a client after handover ≤ 1 per project; quotes within 10% of final invoice ≥ 80% |
| G-10 | 6.3 | Plan changes to the QMS rather than making them ad hoc | DOC-001 §6 | **Documented** | **Closed on paper.** Evidenced once a change is made through it |

### Clause 7 — Support

| Ref | Clause | Requirement in short | Current evidence | Rating | What closes it |
|---|---|---|---|---|---|
| G-11 | 7.1.1–7.1.4 | Determine and provide the resources, people, infrastructure and working environment needed | None | **Absent** | A resources section: hardware, hosting and tooling relied on, and what happens when a person or a platform is unavailable |
| G-12 | 7.1.5 | Control monitoring and measuring resources where used to verify conformity | None | **Absent** | Likely **not applicable** — no calibrated measuring equipment is used. Must be stated and justified in the scope document (G-03), not silently omitted |
| G-13 | 7.1.6 | Determine and maintain the organizational knowledge needed | Partly in the SOPs | **Partial** | Say where knowledge lives — the repository, the SOPs, client documentation — and how it survives the owner being unavailable. This is the highest real risk in a one-person business |
| G-14 | 7.2 | Determine necessary competence, ensure it, and retain evidence | None | **Absent** | A competence record: what skills the work requires, evidence for each (qualifications, experience), and how a contractor's competence is established before they touch client work |
| G-15 | 7.3 | Ensure people are aware of the policy, objectives and their contribution | None | **Absent** | A record that anyone doing work has read the quality policy and knows the objectives. A signed acknowledgement is sufficient |
| G-16 | 7.4 | Determine internal and external communications — what, when, with whom, how | None | **Absent** | A communication table. Much of this already happens through the invoicing system and the client portal; it needs writing down |
| G-17 | 7.5.1–7.5.2 | Maintain documented information, properly identified and reviewed | Every document carries reference, version, owner, approver and review date | **Met** | Nothing. This is done well already |
| G-18 | 7.5.3 | Control documented information — availability, protection, distribution, retention, disposal, control of external documents | DOC-001 | **Documented** | **Closed.** Procedure written and approved, covering storage, approval, change, retention periods, external documents and withdrawal |

### Clause 8 — Operation

| Ref | Clause | Requirement in short | Current evidence | Rating | What closes it |
|---|---|---|---|---|---|
| G-19 | 8.1 | Plan and control the processes needed to deliver the service | SOP-DEL-001 | **Documented** | Operate it on a real project and keep the records |
| G-20 | 8.2.1–8.2.4 | Customer communication, determining and reviewing requirements, and handling changes to them | SOP-CLI-001, SOP-FIN-002 | **Documented** | Operate them and retain the records — the questionnaire, the scope agreement, the quote |
| G-21 | 8.3.1–8.3.6 | Design and development: planning, inputs, controls, outputs, changes | None | **Absent** | **The largest gap.** Building websites and applications to a client's requirements *is* design and development, and it cannot be excluded. Needs a procedure covering design planning, what the inputs are (the scope agreement), design review and verification points, what the outputs are, how a design change is authorised, and the records kept at each stage |
| G-22 | 8.4.1–8.4.3 | Control externally provided processes, products and services, with criteria for evaluation and re-evaluation | None | **Absent** | A supplier register with criteria. Your external providers include Cloudflare, Brevo, RapidAPI and any contractor. Each needs a basis for selection, a record of evaluation, and a statement of what is required of them |
| G-23 | 8.5.1 | Control service provision under controlled conditions | SOP-DEL-001 | **Documented** | Operate and record |
| G-24 | 8.5.2 | Identify outputs and control their traceability where required | Partly — the D1 schema tracks projects, milestones and documents | **Partial** | State how a deliverable is identified and traced back to the requirement that asked for it |
| G-25 | 8.5.3 | Protect property belonging to customers or external providers | Partly in POL-002 | **Partial** | Client property here means their domains, hosting credentials, content and data. Say explicitly how each is safeguarded, and what happens if any is lost or damaged |
| G-26 | 8.5.4 | Preserve outputs during delivery | Partly — repository and backups | **Partial** | Cover it in the backup and recovery document once G-31 is closed |
| G-27 | 8.5.5 | Post-delivery activities — warranty, support, obligations | None | **Absent** | Write down the support commitment after handover: what is covered, for how long, and what is chargeable. This likely exists in your quotes already and needs stating as a procedure |
| G-28 | 8.5.6 | Control changes to service provision | None | **Absent** | A change control clause: who authorises a change to a live client site, and what record is kept |
| G-29 | 8.6 | Release of products and services — verify requirements met, keep evidence and authorisation | SOP-DEL-001 has a launch checklist | **Partial** | Add the record: who authorised release, on what date, against which acceptance criteria |
| G-30 | 8.7 | Control nonconforming outputs — identify, control, and record what was done | None | **Absent** | Distinct from corrective action. This is what happens to defective work *before* it reaches the client: how it is identified, held back, corrected, re-verified, and recorded |

### Clause 9 — Performance evaluation

| Ref | Clause | Requirement in short | Current evidence | Rating | What closes it |
|---|---|---|---|---|---|
| G-31 | 9.1.1 | Determine what is monitored and measured, the methods, and when | Registers exist | **Partial** | Follows from the objectives in G-09. Once there are numbers to hit, say how each is measured and how often |
| G-32 | 9.1.2 | Monitor customer perception | FDB-001 | **Documented** | Send the feedback request on the next handover and record the response |
| G-33 | 9.1.3 | Analyse and evaluate the data | MRV-001 agenda covers it | **Partial** | Needs data to analyse. Follows from G-09 and G-31 |
| G-34 | 9.2 | Internal audit at planned intervals, with a programme, defined criteria, objective auditors, and records | None | **Absent** | **Mandatory and currently missing entirely.** Needs an audit programme covering all clauses over a defined cycle, a procedure, and audit reports. Objectivity is the difficulty in a one-person business — an auditor may not audit their own work, so this will require a contracted internal auditor |
| G-35 | 9.3.1–9.3.3 | Management review at planned intervals, covering the required inputs, producing decisions and actions | MRV-001 | **Documented** | Hold the first review. The standing agenda already matches the required inputs |

### Clause 10 — Improvement

| Ref | Clause | Requirement in short | Current evidence | Rating | What closes it |
|---|---|---|---|---|---|
| G-36 | 10.1 | Determine and select opportunities for improvement | Implied | **Partial** | Falls out of management review once it is held |
| G-37 | 10.2 | React to nonconformity, evaluate the need for action, implement, review effectiveness, retain records | CAPA-001 | **Documented** | Well written, including the correction versus corrective action distinction. Needs its first real entry |
| G-38 | 10.3 | Continually improve the suitability, adequacy and effectiveness of the QMS | None | **Partial** | Evidenced by the management review and gap register operating over time. Closes itself last |

## 6. Summary

| Rating | Count |
|---|---|
| Met | 1 |
| Documented | 9 |
| Partial | 12 |
| Absent | 16 |

*Updated 2026-08-07: all twelve documents approved and in force, and DOC-001 written, moving G-06, G-10 and G-18.*

Sixteen requirements have nothing behind them at all. The four that matter most, in order:

1. **G-21 — design and development (8.3).** The core of what the business does, and entirely undocumented.
2. **G-34 — internal audit (9.2).** Mandatory, absent, and needs an outside person.
3. **G-03 — scope of the QMS (4.3).** Everything else is assessed against it, so it comes first in practice.
4. **G-09 — quality objectives (6.2).** Without measurable objectives there is nothing for clause 9 to evaluate.

## 7. The gap that is not in the table

Every document in `docs/` is marked **Draft**. The policies have no effective date. Every register says *no entries yet*, every template says *no review held yet*, and the recovery test says *to be confirmed*.

ISO 9001 certification is not awarded for documentation. A Stage 2 audit looks for evidence that the system has been operated: completed reviews, real register entries, audits performed, actions closed and verified. A complete and well-written set of documents with no records behind it fails Stage 2.

**A certification body will typically expect around three months of operating records.** That period cannot be compressed, and it does not start until the documents are approved and in use. It should therefore start as early as possible, and in parallel with closing the gaps above — not after.

## 8. What to do, in order

**Stage 1 — make what exists real (weeks 1–2)**

1. Buy the published ISO 9001:2015. Stop working from the FDIS.
2. Approve POL-001 and POL-002. Set effective dates, change Status from Draft to Approved, record the approval.
3. Approve the four SOPs the same way.
4. Start using them on the next live project, however small. From this point records begin accumulating, and the three-month clock starts.

**Stage 2 — close the foundation clauses (weeks 3–6)**

5. Write the QMS scope statement (G-03), including the justification for excluding 7.1.5.
6. Write the context and interested parties document (G-01, G-02).
7. Write the responsibilities table (G-07).
8. Set three to five measurable quality objectives (G-09) and say how each is measured (G-31).
9. Write the document control procedure (G-18), including change planning (G-10).

**Stage 3 — close the operational clauses (weeks 7–12)**

10. Write the design and development procedure (G-21). Budget the most time here; it is the largest gap and the one most closely examined.
11. Write the supplier register and evaluation criteria (G-22).
12. Write the nonconforming output procedure (G-30).
13. Write the post-delivery support and change control clauses (G-27, G-28).
14. Extend the risk register to business and quality risks, and add opportunities (G-08).
15. Write the competence, awareness and communication records (G-14, G-15, G-16).

**Stage 4 — operate and evaluate (months 3–6)**

16. Hold the first quarterly management review using MRV-001.
17. Perform the first backup and recovery test, and the first access review.
18. Send the first customer feedback request on a real handover.
19. Appoint a contracted internal auditor and run the first internal audit (G-34).
20. Raise and close at least one corrective action, verified.

**Stage 5 — certification (month 6 onwards)**

21. Choose an accredited certification body. In South Africa, check accreditation with SANAS — an unaccredited certificate is worth little.
22. Book the Stage 1 audit, which is a documentation review.
23. Close whatever Stage 1 raises.
24. Book Stage 2, the audit of the system in operation.

**Realistic timeline: six to nine months** from today to certification, assuming the document work is done alongside real client projects rather than instead of them. Anyone offering it in six weeks is selling a certificate rather than a system.

## 9. Related documents

- QMS-2026-POL-001 — Quality Management Policy
- QMS-2026-POL-002 — Information Security Policy
- QMS-2026-CAPA-001 — Corrective Action Register
- QMS-2026-FDB-001 — Customer Satisfaction Register
- QMS-2026-MRV-001 — Management Review
- SEC-2026-RISK-001 — Client Data Risk Register
- SEC-2026-ACCESS-001 — Access Review
- SEC-2026-DR-001 — Backup and Recovery Test
- SOP-CLI-001 — Client Onboarding and Requirements Capture
- SOP-DEL-001 — Project Delivery
- SOP-FIN-001 — Invoicing and Collections
- SOP-FIN-002 — Quoting and Pricing

## 10. Revision history

| Version | Date | Author | Change |
|---|---|---|---|
| 1.0 | 2026-08-07 | Gerald Rushwaya | Register created from an assessment of the twelve documents in `docs/` against ISO 9001:2015 clauses 4 to 10. 38 gaps recorded, none closed |
| 1.1 | 2026-08-07 | Gerald Rushwaya | All twelve documents approved and in force. DOC-001 document control procedure written, closing G-18 and the change-planning part of G-10 |
