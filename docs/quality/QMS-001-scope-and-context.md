# QMS-2026-QMS-001 — QMS Scope, Context and Processes

| | |
|---|---|
| **Document reference** | QMS-2026-QMS-001 |
| **Version** | 1.0 |
| **Status** | Approved — in force |
| **Approved** | 2026-08-07 by Gerald Rushwaya |
| **Category** | Quality Management System |
| **Owner** | Gerald Rushwaya |
| **Approver** | Gerald Rushwaya |
| **Effective date** | 2026-08-07 |
| **Next review** | 2027-08-07 |

---

## 1. Purpose

To define what the quality management system covers, the circumstances the business operates in, who has an interest in its performance, and how its processes fit together.

Satisfies ISO 9001:2015 clauses 4.1, 4.2, 4.3 and 4.4, and records the justification required by 7.1.5.

## 2. Scope of the quality management system

The quality management system applies to:

> **The design, development, delivery and support of websites and web applications, and related consulting and training services, provided by Beplugged Tech from its premises in South Africa.**

### 2.1 What is included

| Included | Covered by |
|---|---|
| Client enquiry, requirements capture and quoting | SOP-CLI-001, SOP-FIN-002 |
| Design and development of websites and web applications | SOP-DES-001 |
| Delivery, testing, launch and handover | SOP-DEL-001 |
| Invoicing and collections | SOP-FIN-001 |
| Post-handover support and changes | SOP-DES-001 §9 |
| Training services, including the COS1511 academy | This scope; delivery follows SOP-DEL-001 |

### 2.2 Requirements determined not to be applicable

| Clause | Determination | Justification |
|---|---|---|
| 7.1.5 Monitoring and measuring resources | **Not applicable** | The business uses no measuring instruments whose accuracy affects conformity of the service. Verification of work is performed by testing against documented acceptance criteria, not by physical measurement, so there is nothing requiring calibration or verification against a measurement standard. |

No other clause of ISO 9001:2015 is excluded. In particular, **clause 8.3 design and development is applicable and is not excluded** — building to a client's requirements is design and development, and it is the core activity of the business.

## 3. Context of the organization

### 3.1 External issues

| Issue | Why it matters | Where addressed |
|---|---|---|
| Dependence on third-party platforms — Cloudflare for hosting, compute and data; Brevo for email; RapidAPI for the academy compiler | An outage, price change or withdrawal by any of them interrupts delivery or a live client service | SEC-2026-RISK-001, SOP-SUP-001 |
| Electricity supply interruption | Interrupts development work and client communication | SEC-2026-RISK-001 |
| Exchange rate movement on tooling and hosting, which are priced in USD | Costs are foreign-denominated while revenue is in ZAR, so margin moves without any change in the work | Quoting assumptions, SOP-FIN-002 |
| Competition from low-cost site builders and offshore developers | Pressure on price; differentiation must come from delivery quality rather than rate | Quality objectives, OBJ-001 |
| Client expectations of continuous availability | A website failing out of hours is still the business's problem | Post-delivery support, SOP-DES-001 §9 |
| Statutory and regulatory requirements — POPIA in particular, given client and end-user personal data is processed | Non-compliance carries legal and reputational consequence | POL-002, SEC-2026-RISK-001 |

*[Confirm: add any sector-specific client conditions or regulatory requirements particular to the industries you serve.]*

### 3.2 Internal issues

| Issue | Why it matters | Where addressed |
|---|---|---|
| The business is operated by one person | Capacity is finite, and absence stops delivery entirely. This is the single largest risk to the QMS | SUP-001, SEC-2026-RISK-001 |
| Knowledge is concentrated in one person | A client system nobody else understands cannot be supported if that person is unavailable | SUP-001 §4 |
| Contractors are used variably | Competence and access must be established each time rather than assumed | SUP-001 §3, SOP-SUP-001 |
| Work is delivered from a repository and documented in the same place | A strength — process, product and evidence sit together and are version-controlled | DOC-001 §3 |

### 3.3 Monitoring

The issues above are reviewed at each quarterly management review (MRV-001), and changes recorded there. Issues do not need a separate register; the review minutes are the record.

## 4. Interested parties and their requirements

| Interested party | What they require | How it is monitored |
|---|---|---|
| **Clients** | Work delivered to the agreed scope, on the agreed date, at the agreed price; their data kept safe; support after handover | FDB-001, quality objectives, CAPA-001 |
| **Prospective clients** | Accurate quotes, honest timelines, clear scope before committing | SOP-CLI-001, SOP-FIN-002 |
| **Contractors** | Clear scope of work, defined access, prompt payment | SOP-SUP-001, SUP-001 §3 |
| **Cloudflare, Brevo, RapidAPI and other providers** | Compliance with their terms of service and acceptable use | SOP-SUP-001 |
| **SARS and other regulators** | Accurate records retained for the required periods; POPIA compliance | DOC-001 §8, POL-002 |
| **Students using the academy** | A service that works, on the device they have; accurate teaching content | Quality objectives, FDB-001 |
| **The owner** | A business that can be operated sustainably and does not depend on memory | This QMS in its entirety |

Requirements of interested parties are reviewed at each management review. Where a requirement changes, the affected document is updated through DOC-001 §6.

## 5. Processes of the quality management system

### 5.1 Process map

```
   ENQUIRY
      |
      v
 [ 1. Onboarding & requirements ]  SOP-CLI-001
      |  scope agreement
      v
 [ 2. Quoting & pricing ]          SOP-FIN-002
      |  accepted quote
      v
 [ 3. Design & development ]       SOP-DES-001  <-- clause 8.3
      |  verified build
      v
 [ 4. Delivery, test & handover ]  SOP-DEL-001
      |  launched site
      +-------------------------> [ 5. Invoicing ]        SOP-FIN-001
      |
      v
 [ 6. Post-delivery support ]      SOP-DES-001 §9
      |
      v
   FEEDBACK  ---> FDB-001 ---> [ 7. Management review ] MRV-001
                  CAPA-001                |
                  AUD-001                 v
                                    improvement actions
                                    back into 1-6
```

Supporting processes — document control (DOC-001), supplier control (SOP-SUP-001), internal audit (AUD-001) and risk management (SEC-RISK-001) — apply across all of the above.

### 5.2 Process detail

| # | Process | Inputs | Outputs | Owner | Measured by |
|---|---|---|---|---|---|
| 1 | Onboarding and requirements | Enquiry, questionnaire | Signed scope agreement | Owner | Quotes not reworked for missed requirements |
| 2 | Quoting and pricing | Scope agreement | Issued and accepted quote | Owner | Quote accuracy against final invoice |
| 3 | Design and development | Accepted quote, scope agreement | Verified build meeting acceptance criteria | Owner | Defects found at review vs after handover |
| 4 | Delivery, test and handover | Verified build | Launched site, handover pack | Owner | On-time delivery |
| 5 | Invoicing and collections | Handover, milestones | Issued invoice, payment | Owner | Days to payment |
| 6 | Post-delivery support | Client request, incident | Resolved issue | Owner | Response and resolution time |
| 7 | Management review | All registers | Decisions and actions | Owner | Reviews held on schedule |

Criteria and methods for each process are in the procedure named for it. Measures are defined with targets in OBJ-001.

## 6. Related documents

- QMS-2026-POL-001 — Quality Management Policy
- QMS-2026-DOC-001 — Document Control Procedure
- QMS-2026-OBJ-001 — Quality Objectives
- QMS-2026-GAP-001 — ISO 9001:2015 Gap Register
- SOP-DES-001 — Design and Development
- SOP-SUP-001 — Control of External Providers

## 7. Revision history

| Version | Date | Author | Change |
|---|---|---|---|
| 1.0 | 2026-08-07 | Gerald Rushwaya | Created and approved. Closes G-01, G-02, G-03, G-04 and G-12 |
