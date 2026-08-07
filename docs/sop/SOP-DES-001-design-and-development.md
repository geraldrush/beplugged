# SOP-DES-001 — Design and Development

| | |
|---|---|
| **Document reference** | SOP-DES-001 |
| **Version** | 1.0 |
| **Status** | Approved — in force |
| **Approved** | 2026-08-07 by Gerald Rushwaya |
| **Category** | Delivery |
| **Owner** | Gerald Rushwaya |
| **Approver** | Gerald Rushwaya |
| **Effective date** | 2026-08-07 |
| **Next review** | 2027-08-07 |
| **Supersedes** | — |

---

## 1. Purpose

To control how a client's requirements become a working website or application, so that what is built is what was agreed, defects are found before the client sees them, and every design decision can be traced back to the requirement that caused it.

Satisfies ISO 9001:2015 clause 8.3 in full — 8.3.1 through 8.3.6 — and clauses 8.5.6 and 8.5.5 for changes and post-delivery activity.

## 2. Scope

Every project that produces a new website, a new application, or a substantial change to an existing one. Applies from the point a quote is accepted until handover is complete.

**Not** in scope: routine content edits, minor copy changes and configuration adjustments that do not alter how the system works. Those are handled under §10 as service changes.

## 3. Why this procedure exists

Building a website to a client's requirements is design and development. It is the core activity of the business, it cannot be excluded from the quality management system, and it is where a certification auditor will spend most of their time.

More practically: most project failures are traceable to a design decision nobody recorded, made to satisfy a requirement nobody wrote down.

## 4. Design and development planning — 8.3.2

At the start of each project, record the following in the project record. For a small project this is a page; for a large one it is proportionately longer.

| Item | What to record |
|---|---|
| **Stages** | The design stages this project needs, from the list in §5 |
| **Review points** | Which stages end in a review, and who attends |
| **Verification** | How each output will be checked against its input |
| **Validation** | How it will be confirmed the result works for the client's actual use |
| **Responsibilities** | Who does the work; who reviews it; who authorises release |
| **Client involvement** | What the client must supply, by when, and what they must approve |
| **Resources** | People, tools, third-party services and licences needed |
| **Records** | What evidence each stage produces and where it is kept |

The extent of control is proportionate to the project. A five-page brochure site needs one review; a booking system with payments needs a review at each stage. Record which was chosen and why.

## 5. Design stages

| Stage | Output | Reviewed against |
|---|---|---|
| 1. Requirements confirmation | Agreed requirement list | Scope agreement from SOP-CLI-001 |
| 2. Structure and content plan | Sitemap, page list, data model | Requirement list |
| 3. Visual design | Layouts or prototypes | Requirement list, brand inputs |
| 4. Build | Working system in a non-live environment | All of the above |
| 5. Verification and validation | Test results, client acceptance | Acceptance criteria |

Stages 2 and 3 may be combined on small projects. Stage 5 is never skipped.

## 6. Design and development inputs — 8.3.3

Before design begins, the following must exist and be recorded. Design does not start until they do.

| Input | Source |
|---|---|
| Functional requirements — what it must do | Scope agreement, SOP-CLI-001 |
| Performance requirements — speed, availability, devices and browsers supported | Scope agreement |
| Statutory and regulatory requirements — POPIA where personal data is processed, accessibility where required | This procedure, §6.1 |
| Information from similar previous projects | Repository, previous project records |
| Consequences of failure — what happens to the client if this breaks | Recorded per project |
| Content, brand assets and access the client must supply | Scope agreement |

Inputs must be complete, unambiguous and not in conflict with one another. **Where two requirements conflict, this is resolved with the client in writing before design proceeds, and the resolution recorded.** An unresolved conflict is the most expensive thing to discover during build.

### 6.1 Standing inputs

These apply to every project whether or not the client asks for them:

- The site works on a phone as well as a desktop
- Personal data collected is limited to what is needed, and is protected per POL-002
- Forms confirm submission to the user and deliver to a monitored address
- The client can be given control of their own domain and hosting on request

## 7. Design and development controls — 8.3.4

For each stage, the following are performed and recorded.

### 7.1 Review

At each review point in the plan, confirm the stage output meets the requirements, and record:

- What was reviewed and against what
- Problems found
- Actions arising, with an owner and a date

A review is a recorded event, not an impression. **A review that found no problems is still recorded, saying so.**

### 7.2 Verification

Verification answers: *does the output meet the input?*

| Verified | How |
|---|---|
| Every requirement in the list is present | Walk the list against the build |
| The system behaves as specified | Functional testing against acceptance criteria |
| It works on the browsers and devices agreed | Test on each; record what was tested |
| Forms deliver | Submit a real test entry and confirm receipt |
| Nothing else broke | Re-test previously working functions after changes |

### 7.3 Validation

Validation answers: *does it work for what the client actually needs it for?*

Performed with the client, on the real content, before launch. Client acceptance is recorded — an email confirming acceptance is sufficient, and is retained.

**Verification and validation are different things and both are required.** A site can meet every written requirement and still be unusable for the client's actual purpose.

### 7.4 If a problem is found

Problems found at review or verification are corrected and re-verified before the stage is considered complete. Where a problem cannot be resolved, it goes to §10 as a design change, or to NCR-001 if the output cannot be made to conform.

## 8. Design and development outputs — 8.3.5

Outputs must:

- Meet the input requirements
- Be adequate for the delivery, launch and support that follow
- Include or reference acceptance criteria
- State the characteristics essential to safe and proper use — hosting requirements, credentials, how to update content, what must not be changed without advice

The handover pack required by SOP-DEL-001 is the formal design output. It is approved before release.

## 9. Post-delivery activities — 8.5.5

After handover:

| Period | Commitment |
|---|---|
| **Defect period — 30 days from handover** *[confirm: state your actual period]* | Anything not working as specified in the scope agreement is corrected at no charge |
| **After the defect period** | Support and changes are chargeable, quoted under SOP-FIN-002 |

Anything reported in the defect period that turns out to be a new requirement rather than a defect is quoted as a change, and the distinction explained to the client in writing.

Defects reaching a client after handover are recorded in CAPA-001 where they indicate a process failure, and counted against the objective in OBJ-001.

## 10. Design and development changes — 8.3.6, 8.5.6

Changes arise during a project, after handover, or from a review. All follow the same route.

1. **Record the change requested**, who asked for it and why.
2. **Assess the effect** on requirements, on other parts of the system, on the date and on the price. Record the assessment.
3. **Get authorisation.** Changes altering scope, price or date require the client's written agreement before work starts. Changes that do not are authorised by the owner and recorded.
4. **Make the change**, and re-verify everything the assessment said it could affect.
5. **Record** what changed, who authorised it and the result of re-verification.

**Changes to a live client system additionally require:** a working backup taken and confirmed before the change, and a way to reverse it. A change to a live system that cannot be reversed is not made without the client's explicit written acceptance of that fact.

## 11. Records retained

| Record | Kept where | Retained |
|---|---|---|
| Design plan | Project record | 5 years |
| Requirement list and any conflict resolutions | Project record | 5 years |
| Review records | Project record | 5 years |
| Verification and test results | Project record | 5 years |
| Client acceptance | Project record and email | 5 years |
| Change requests, assessments and authorisations | Project record | 5 years |
| Handover pack | Project record and client copy | 5 years |

## 12. Related documents

- SOP-CLI-001 — Client Onboarding and Requirements Capture
- SOP-FIN-002 — Quoting and Pricing
- SOP-DEL-001 — Project Delivery
- QMS-2026-NCR-001 — Control of Nonconforming Output
- QMS-2026-CAPA-001 — Corrective Action Register
- QMS-2026-POL-002 — Information Security Policy

## 13. Revision history

| Version | Date | Author | Change |
|---|---|---|---|
| 1.0 | 2026-08-07 | Gerald Rushwaya | Created and approved. Closes G-21, G-27 and G-28 |
