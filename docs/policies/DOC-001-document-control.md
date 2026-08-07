# QMS-2026-DOC-001 — Document Control Procedure

| | |
|---|---|
| **Document reference** | QMS-2026-DOC-001 |
| **Version** | 1.0 |
| **Status** | Approved — in force |
| **Approved** | 2026-08-07 by Gerald Rushwaya |
| **Category** | Procedure |
| **Owner** | Gerald Rushwaya |
| **Approver** | Gerald Rushwaya |
| **Effective date** | 2026-08-07 |
| **Next review** | 2027-08-07 |

---

## 1. Purpose

To define how documents and records are created, approved, changed, stored, found and disposed of, so that anyone reading a Beplugged Tech document knows whether it is in force and whether it is the current version.

Satisfies ISO 9001:2015 clauses 7.5.1, 7.5.2 and 7.5.3, and the change planning requirement of 6.3.

## 2. Scope

All quality and security documents in the `docs/` directory of the Beplugged Tech repository, and the records they generate. Also covers documents of external origin that the business relies on.

## 3. Where documents live, and why that matters

Every document is a Markdown file held in the Beplugged Tech git repository, hosted on GitHub.

This is deliberate rather than incidental. Git provides, without any additional system:

| Requirement | How git satisfies it |
|---|---|
| Version identification | Every change is a commit with a unique identifier |
| Author identification | Every commit records who made it |
| Date of change | Every commit is timestamped and cannot be silently altered |
| Revision history | `git log` on any file returns its full history |
| Protection from unintended change | Nothing changes without a commit; every change is attributable |
| Recovery of a superseded version | Any earlier version can be retrieved exactly |

**A consequence worth stating plainly:** because commit timestamps are part of the repository's integrity, a document's history cannot be rewritten to show an approval that did not happen when it says it did. This is a control, not a limitation. Any date recorded in a document can be checked against the commit that placed it there.

## 4. Document identification

Each document carries a header table with, at minimum:

| Field | Meaning |
|---|---|
| **Document reference** | Unique identifier. Never reused |
| **Version** | Content version. Changes when the content changes |
| **Status** | Draft, or Approved — in force, or Withdrawn |
| **Approved** | Date of approval and by whom. Blank while Draft |
| **Owner** | The person accountable for keeping it correct |
| **Effective date** | The date from which the document applies |
| **Next review** | When it must be reviewed even if nothing has changed |

## 5. Approving a document

There is no approval button. Approval is an edit followed by a commit, and the commit is the evidence.

To approve a document:

1. Read it through as though it were someone else's.
2. Set **Status** to `Approved — in force`.
3. Set **Approved** to the date of approval and the approver's name. **This is the date approval actually happens, never an earlier one.**
4. Set the **Effective date**. This may be the approval date, or a later date if the document takes effect then.
5. Set **Next review** to the effective date plus twelve months.
6. Add a row to the revision history recording the approval.
7. Commit, with a message stating what was approved.

### 5.1 Documents already in use before approval

Where a procedure has been followed before it was formally approved, this is recorded rather than concealed:

- The **Effective date** stays as the date the procedure actually came into use.
- The **Approved** date is the date approval actually happened.
- The revision history records both, and states that records from the earlier period are retained.

Work performed under a procedure that was in use but not yet approved is still evidence that the procedure was followed. It is not discarded and it is not re-dated. A document whose approval date has been moved backwards to cover the gap is a falsified record, and is treated as a serious nonconformity in its own right — worse than the gap it was intended to hide.

## 6. Changing an approved document

1. Make the change.
2. Increase the **Version** — a minor increase for a clarification, a whole number for a change that alters how the work is done.
3. Consider the consequences of the change and who else is affected. Where a change alters how work is done, record what else must change with it.
4. Set **Status** back to `Draft` if the change is substantial enough to need re-approval, then follow §5.
5. Add a row to the revision history saying what changed and why.
6. Commit.

## 7. Reviewing documents

Every document is reviewed at least annually, on the date in its **Next review** field, whether or not anything has changed. A review that finds no change needed is still recorded as a revision-history row saying so.

Review dates are a standing item at the quarterly management review (QMS-2026-MRV-001).

## 8. Records

A record is evidence that something happened, and is distinguished from a document, which says how something should be done.

| Record type | Where it is kept | Retained for |
|---|---|---|
| Register entries — corrective actions, feedback, risks | `docs/` in the repository | 3 years |
| Management review minutes | `docs/quality/` | 3 years |
| Internal audit reports | `docs/quality/` | 3 years |
| Client project records — questionnaires, scope agreements, quotes, invoices | D1 database | 5 years, or as tax law requires, whichever is longer |
| Access and recovery test results | `docs/security/` | 3 years |

Records are not edited to correct history. Where a record is found to be wrong, a correction is added alongside it with the date and reason, leaving the original visible.

## 9. Documents of external origin

Documents the business relies on but does not author are listed here, with the version in use:

| Document | Version in use | Held where | Reviewed |
|---|---|---|---|
| ISO 9001:2015 | *to be obtained — see QMS-2026-GAP-001 §3* | | On publication of a new edition |
| UNISA COS1511 study guide | 2011 edition, Ken Halland | Repository | On each new edition |

## 10. Withdrawing a document

A document that no longer applies has its **Status** set to `Withdrawn`, with the date and the reason. It is not deleted — the git history preserves it, and a superseded procedure may be needed to explain work performed while it was in force.

## 11. Related documents

- QMS-2026-POL-001 — Quality Management Policy
- QMS-2026-GAP-001 — ISO 9001:2015 Gap Register
- QMS-2026-MRV-001 — Management Review

## 12. Revision history

| Version | Date | Author | Change |
|---|---|---|---|
| 1.0 | 2026-08-07 | Gerald Rushwaya | Procedure created and approved. Closes gap G-18, and the change-planning part of G-10 |
