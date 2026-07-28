# SOP-DEL-001 — Project Delivery

| | |
|---|---|
| **Document reference** | SOP-DEL-001 |
| **Version** | 1.0 |
| **Status** | Draft |
| **Category** | Delivery |
| **Owner** | Gerald Rushwaya |
| **Approver** | Gerald Rushwaya |
| **Effective date** | 2026-07-28 |
| **Next review** | 2027-07-28 |
| **Supersedes** | — |

---

## 1. Purpose

To define how Beplugged Tech takes an accepted quote through to a launched, handed-over website, so that projects finish on the agreed scope, delays have a recorded cause, and nothing goes live untested.

## 2. Scope

Applies to every client website and web application project from quote acceptance to closure.

**In scope:** project setup, collecting assets and access, building, testing, launching, handover, and closure.

**Out of scope:** quoting (SOP-FIN-002), invoicing (SOP-FIN-001), and ongoing maintenance after handover.

## 3. Project statuses

| Status | Meaning |
|---|---|
| **Planning** | Created, kick-off and asset collection under way |
| **Active** | Build in progress |
| **On hold** | Paused. A reason and an owner for the blocker must be recorded |
| **Completed** | Launched, handed over, final invoice issued |
| **Cancelled** | Abandoned. Reason and commercial position recorded |

Progress is tracked as a percentage on the project record. Update it at each milestone, not continuously — it is a communication tool, not a timesheet.

## 4. Roles

| Role | Responsibility |
|---|---|
| **Project owner** | Accountable for delivery, client communication, and status accuracy |
| **Builder** | Performs the technical work |
| **Client contact** | The single named person on the client side who approves and signs off |

Insist on **one** named approver on the client side. Projects with several people giving conflicting direction are the most common cause of overrun.

## 5. Procedure

### 5.1 Create the project

On quote acceptance (SOP-FIN-002 §6.6):

1. Create a project record. It is assigned a code in the form `PRJ-YYYY-XXXXXXXX`.
2. Set the client name, owner, start date, and due date.
3. Set the budget to the accepted quote value.
4. Set priority and status **Planning**.
5. Record the accepted quote number in the notes.
6. Invoice the deposit per SOP-FIN-001.

**Do not begin work before the deposit clears** (§10), unless the owner has agreed an exception and recorded it on the project.

### 5.2 Kick-off

Confirm with the client contact, in writing:

- What is being built, restated from the accepted quote
- What is explicitly excluded
- The number of revision rounds included
- Who approves and signs off
- The date content and assets are due (§5.3)
- The target launch date

Send this as a short written summary. It becomes the reference point for every later "I thought this was included" conversation.

### 5.3 Collect assets and access

This step blocks the build. Chase it deliberately rather than starting around it.

| Item | Notes |
|---|---|
| Logo | Original files preferred — `.ai`, `.svg`, `.eps`. A low-resolution PNG means a redraw |
| Brand colours and fonts | Or confirmation to choose them |
| Text content | Per page. The most common cause of stalled projects |
| Images | Client-supplied or stock, per the quote |
| Domain access | Registrar login, or the ability to change DNS |
| Hosting access | Where the client already has hosting |
| Existing site access | Where content is being migrated |
| Third-party accounts | Payment gateway, mailing list, analytics |

**Handling credentials.** Never accept credentials over WhatsApp or plain email where it can be avoided; prefer the client granting delegated access to their own account. Where credentials must be held, store them in a password manager, never in project notes, a spreadsheet, or a chat thread. Remove access at closure (§5.9). A fuller procedure belongs in SOP-SEC-001 (§11).

If assets are outstanding at the agreed date, tell the client the launch date is at risk **at that point**, not later. Record it on the project.

### 5.4 Build

1. Move the project to **Active**.
2. Work to the confirmed scope. Anything outside it is a change request (§7).
3. Update progress at meaningful milestones.
4. Show the client work in progress at natural checkpoints. Long silences make small misunderstandings expensive.

### 5.5 Review and revisions

1. Share a preview link when a reviewable state is reached.
2. Ask for consolidated feedback in one message rather than a stream of individual notes.
3. Apply the feedback. This is one revision round.
4. Track rounds used against the allowance in the quote. When the allowance is reached, tell the client before doing further work, and quote for it.

### 5.6 Test before launch

Work through §8. Do not skip items because the site "looks fine" — most of the list covers things that are invisible until they fail.

### 5.7 Launch

1. Confirm the client has approved the final state in writing.
2. Confirm the final invoice position (§10).
3. Point the domain and confirm the certificate is valid.
4. Work through the post-launch items in §8.
5. Tell the client it is live.

Avoid launching on a Friday or immediately before you are unavailable. Problems surface in the first hours.

### 5.8 Handover

Provide the client with:

- The live URL and any admin URL
- Their own credentials, set up under their own account where possible
- A short guide, or a walkthrough call, where the site has a CMS
- What is included after launch and what is chargeable
- Renewal dates for domain and hosting, and what they cost

Where a CMS is involved, a recorded walkthrough saves repeating the same explanation months later.

### 5.9 Close

1. Confirm the final invoice is issued, and follow SOP-FIN-001 to collection.
2. Remove any client credentials you hold that are no longer needed. Record that you have done so.
3. Store project documents in the register, linked to the project.
4. Move the project to **Completed** and set progress to 100%.
5. Record what went well and what did not. Review these notes when quoting similar work.

## 6. On hold and cancellation

**On hold** — set the status, record the reason, who owns the blocker, and the date it was raised. Review weekly. A project on hold for more than 30 days should be either restarted or closed.

**Cancelled** — record the reason and the commercial position: work completed, amounts invoiced, amounts owing. Invoice for work completed to date per the terms in the quote.

## 7. Change requests

Anything outside the confirmed scope:

1. Acknowledge it and say plainly that it falls outside the agreed scope.
2. Price it. Small items may be absorbed at the owner's discretion — say when you are doing so, so goodwill is visible.
3. Get written agreement before building it.
4. Record it on the project and adjust the due date if needed.

Absorbing changes silently trains a client to expect it, and turns a profitable project into a loss slowly enough that the cause is never obvious.

## 8. Launch checklist

**Before launch**

- [ ] Every page displays correctly on mobile, tablet, and desktop
- [ ] Checked in Chrome, Safari, and Firefox
- [ ] All links work; no placeholder text remains
- [ ] Contact forms tested end to end — submission received at the correct address
- [ ] Images sized appropriately; pages load in reasonable time on mobile data
- [ ] Favicon and browser tab titles set
- [ ] Meta titles and descriptions present on every page
- [ ] `sitemap.xml` and `robots.txt` present and correct
- [ ] 404 page in place
- [ ] Privacy policy present where the site collects personal information (POPIA — SOP-CLI-001 §8)
- [ ] Analytics installed, where in scope
- [ ] Spelling and client details checked — phone, email, address, trading hours

**At launch**

- [ ] Domain pointing correctly
- [ ] HTTPS working; certificate valid; `http://` redirects to `https://`
- [ ] `www` and non-`www` both resolve
- [ ] Email on the domain still working after any DNS change
- [ ] Site indexable — no leftover `noindex` from staging

**After launch**

- [ ] Re-test forms on the live domain
- [ ] Backup taken and restoration confirmed
- [ ] Client confirms they are satisfied, in writing
- [ ] Renewal dates recorded

> Test form submissions **again** after the domain moves. Forms that worked on a staging domain commonly fail once DNS and mail records change, and it is the client who discovers it.

## 9. Records

| Record | Where | Retained |
|---|---|---|
| Project record, status, progress, notes | Admin system (D1) | 5 years |
| Kick-off summary and written approvals | Project notes, plus original message | 5 years |
| Change requests and approvals | Project notes | 5 years |
| Launch checklist, completed | Document register, linked to the project | 5 years |
| Handover pack | Document register, linked to the project | 5 years |

## 10. Items to confirm before approval

Proposed defaults. Confirm, then remove this section at version 1.1.

- **Deposit before work starts** — proposed: yes, at the percentage set in SOP-FIN-002.
- **Final payment timing** — whether the balance is due before launch, on launch, or after handover. This materially affects leverage and cash flow.
- **Revision rounds included** — must match the figure stated in quotes.
- **Post-launch support window** — how long minor fixes are free, and what counts as a fix rather than a change.
- **On-hold limit** — proposed: review at 30 days.
- **Credential policy** — which password manager is used, and whether client credentials are ever held at all.

## 11. Related documents

- SOP-CLI-001 — Client Onboarding and Requirements Capture
- SOP-FIN-001 — Invoicing and Collections
- SOP-FIN-002 — Quoting and Pricing
- SOP-SEC-001 — Access and Credential Management *(not yet written)*
- SOP-SEC-002 — Backup and Recovery *(not yet written)*

## 12. Revision history

| Version | Date | Author | Change |
|---|---|---|---|
| 1.0 | 2026-07-28 | Gerald Rushwaya | Initial draft |
