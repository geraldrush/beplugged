# QMS-2026-CAPA-001 — Corrective Action Register

| | |
|---|---|
| **Document reference** | QMS-2026-CAPA-001 |
| **Version** | 1.0 |
| **Status** | Draft — no entries yet |
| **Category** | Corrective Action |
| **Owner** | Gerald Rushwaya |
| **Review frequency** | Open actions reviewed monthly; all reviewed at management review |

---

## 1. Purpose

To record things that went wrong, what caused them, and what was changed so they do not recur. A corrective action is not a record of blame — it is a record of a process being fixed.

## 2. When to raise one

Raise a corrective action when:

- A client complains about the same kind of thing twice
- A project misses its agreed date
- A defect reaches the client after handover
- A security incident occurs, however minor
- A quote is materially wrong because something was missed at requirements stage

Do **not** raise one for a single unavoidable slip. Raise one when the process, not the person, allowed it.

## 3. Distinguishing correction from corrective action

| | Meaning | Example |
|---|---|---|
| **Correction** | Fixing the immediate problem | Fix the broken contact form |
| **Corrective action** | Changing what allowed it | Add form testing to the launch checklist |

Both are needed. Only the second stops it happening again.

## 4. Register

> **No entries yet.** The first entry is raised when one of the triggers in §2 occurs.

| Ref | Date raised | Source | Problem | Immediate correction | Root cause | Corrective action | Owner | Due | Status | Verified |
|---|---|---|---|---|---|---|---|---|---|---|
| | | | | | | | | | | |

**Column notes**

- **Source** — client feedback, internal check, audit, incident, missed deadline
- **Root cause** — why it was possible, not what the symptom was. Ask "why" until the answer is a process, not a person
- **Status** — open, in progress, closed
- **Verified** — date the fix was confirmed to have worked. An action is not closed until verified

## 5. Procedure

1. **Record** the problem while it is fresh, in plain language.
2. **Correct** the immediate issue and record what was done.
3. **Find the cause.** Keep asking why. "I forgot" is a symptom; "there is no checklist" is a cause.
4. **Decide the action.** Prefer changing a document or a checklist over resolving to be more careful.
5. **Set an owner and a date.** An action with neither will not happen.
6. **Verify.** After the action is applied, confirm at the next equivalent occasion that it worked. Only then close it.

## 6. Worked example

Included to show the expected level of detail. **This is an illustration, not a record of an actual event.**

| Field | Example |
|---|---|
| Problem | Client reported the contact form on their new site was not delivering enquiries. Found three days after launch |
| Immediate correction | Corrected the recipient address, re-tested, confirmed delivery. Client notified |
| Root cause | The form was tested on the staging domain but not re-tested after DNS moved. The launch checklist covered testing forms, but not re-testing after the domain change |
| Corrective action | Added an explicit post-launch item to SOP-DEL-001 §8: re-test form submissions on the live domain |
| Verified | Confirmed at the next launch that the step was performed and the form worked |

## 7. Related documents

- QMS-2026-POL-001 — Quality Management Policy
- QMS-2026-FDB-001 — Customer Satisfaction Register
- QMS-2026-MRV-001 — Management Review
- SOP-DEL-001 — Project Delivery

## 8. Revision history

| Version | Date | Author | Change |
|---|---|---|---|
| 1.0 | 2026-07-28 | Gerald Rushwaya | Register created. No entries yet |
