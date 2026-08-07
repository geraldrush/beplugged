# QMS-2026-NCR-001 — Control of Nonconforming Output

| | |
|---|---|
| **Document reference** | QMS-2026-NCR-001 |
| **Status** | Approved — in force — no entries yet |
| **Approved** | 2026-08-07 by Gerald Rushwaya |
| **Version** | 1.0 |
| **Category** | Nonconformity |
| **Owner** | Gerald Rushwaya |
| **Review frequency** | Open entries reviewed weekly; all reviewed at management review |

---

## 1. Purpose

To make sure work that does not meet its requirements is identified and controlled before it reaches a client, and that where it has already reached a client, the right action is taken.

Satisfies ISO 9001:2015 clause 8.7.

## 2. How this differs from a corrective action

| | Question it answers | Document |
|---|---|---|
| **Nonconforming output** | What do we do with *this* piece of work that is wrong? | This one |
| **Corrective action** | What do we change so it does not happen again? | CAPA-001 |

Every nonconformity needs the first. It needs the second only when the cause is a process rather than a one-off.

## 3. What counts as nonconforming output

Any deliverable that does not meet its requirements, including:

- A function that does not work as the scope agreement specified
- A page that breaks on a browser or device that was agreed to be supported
- A form that does not deliver
- Content published with the wrong information
- A deliverable missing something the handover pack lists
- A live client system behaving incorrectly after a change
- Work by a contractor that does not meet the brief

## 4. What to do — in order

1. **Identify it.** Record what is wrong, where it was found, and at which stage. Give it an NCR reference.
2. **Contain it.** Stop it going further. Concretely: do not release; if already live, take the affected function out of use or roll back; if the client has been told something incorrect, correct it promptly.
3. **Decide the action** from §5.
4. **Act, and re-verify.** Work corrected after a nonconformity is verified again against the original requirement. This is required by 8.7 and is the step most often skipped.
5. **Record** the whole of the above in §7.
6. **Decide whether a corrective action is needed** — see §6.

## 5. Available actions

| Action | When appropriate | Requires |
|---|---|---|
| **Correct it** | The normal case. Fix and re-verify | Re-verification recorded |
| **Segregate or withhold** | Cannot be fixed before the agreed date | Client informed; revised date agreed |
| **Roll back** | Live system affected by a change | Backup confirmed before rollback |
| **Inform the client and agree a concession** | The client is willing to accept it as it is | **Written client acceptance, retained.** Never assumed from silence |
| **Reject and rework** | Contractor work not meeting the brief | Re-verified before acceptance |

Where a client accepts a nonconformity, what they accepted and when is recorded. This matters if the same thing is raised later.

## 6. When to raise a corrective action as well

Raise one in CAPA-001 when:

- The same kind of nonconformity has occurred before
- It reached the client rather than being caught internally
- It was caused by a step that is missing from a procedure
- It affected a live client system

A single slip caught at review, in a step that already exists and was simply performed imperfectly, does not need one.

## 7. Register

> **No entries yet.** The first entry is raised the next time work is found not to meet its requirements.

| Ref | Date | Found at stage | What was wrong | Reached client? | Containment | Action taken | Re-verified | CAPA raised | Status |
|---|---|---|---|---|---|---|---|---|---|
| | | | | | | | | | |

**Column notes**

- **Found at stage** — design review, verification, validation, after handover, contractor acceptance
- **Reached client?** — yes or no. This is the number that matters most; it is reported at management review
- **Re-verified** — the date the corrected work was checked again. An entry does not close without it
- **Status** — open, corrected, closed

## 8. Worked example

Included to show the expected level of detail. **This is an illustration, not a record of an actual event.**

| Field | Example |
|---|---|
| Found at stage | Verification, before launch |
| What was wrong | The enquiry form validated the email field but accepted an empty phone number, though the scope agreement listed it as required |
| Reached client? | No |
| Containment | Launch held. No other work affected |
| Action taken | Validation added to the phone field |
| Re-verified | Re-tested the form with the field empty and populated; both behaved correctly. Full form re-tested for regressions |
| CAPA raised | No. The verification step existed and worked — this is the process catching a defect, which is what it is for |

## 9. Related documents

- SOP-DES-001 — Design and Development
- SOP-DEL-001 — Project Delivery
- QMS-2026-CAPA-001 — Corrective Action Register
- SOP-SUP-001 — Control of External Providers

## 10. Revision history

| Version | Date | Author | Change |
|---|---|---|---|
| 1.0 | 2026-08-07 | Gerald Rushwaya | Created and approved. Closes G-30. No entries yet |
