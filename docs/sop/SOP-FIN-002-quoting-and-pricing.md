# SOP-FIN-002 — Quoting and Pricing

| | |
|---|---|
| **Document reference** | SOP-FIN-002 |
| **Version** | 1.1 |
| **Status** | Approved — in force |
| **Approved** | 2026-08-07 by Gerald Rushwaya |
| **Category** | Finance |
| **Owner** | Gerald Rushwaya |
| **Approver** | Gerald Rushwaya |
| **Effective date** | 2026-07-28 |
| **Next review** | 2027-07-28 |
| **Supersedes** | — |

---

## 1. Purpose

To define how Beplugged Tech prices work and issues quotes, so that prices are built on a consistent method rather than instinct, every quote states plainly what is and is not included, and an accepted quote becomes a project without renegotiation.

## 2. Scope

Applies to every quote issued for website and web application work.

**In scope:** establishing the pricing basis, building the price, issuing the quote, recording the outcome, and turning an accepted quote into a project.

**Out of scope:** capturing requirements (SOP-CLI-001) and collecting payment (SOP-FIN-001).

## 3. Definitions

| Term | Meaning |
|---|---|
| **Draft** | Quote created but not issued. Editable and deletable. |
| **Sent** | Quote issued. The client can open it at its public link. **Cannot be edited or deleted.** |
| **Viewed** | The client has opened the quote link. Set automatically on first view. |
| **Validity period** | The window in which the quoted price stands. Recorded as the expiry date. |
| **Fixed price** | A single agreed price for a defined scope. The default. |
| **Time and materials** | Charged at an hourly or daily rate against actual effort. Used only where scope genuinely cannot be defined upfront. |

> **A quote cannot be edited once issued.** This is deliberate — it protects the integrity of what the client was shown. If a price must change, issue a new quote (§8).

## 4. Roles

| Role | Responsibility |
|---|---|
| **Preparer** | Builds the price and drafts the quote |
| **Approver** | Confirms the price and scope before issue. Above the review threshold (§10), must not be the preparer |

Where Beplugged Tech operates as a single person, both roles are held by the owner, and §6.2 remains a deliberate re-read before issuing.

## 5. Building the price

### 5.1 Confirm the basis

Do not price until requirements are confirmed in writing (SOP-CLI-001 §5.6). A quote built on assumptions becomes a loss when the assumptions prove wrong.

Quote **fixed price** by default — clients decide faster against a known number. Use **time and materials** only where the work is genuinely exploratory, and say so explicitly in the quote.

### 5.2 Build it up

Price each element as a separate line item. Itemised quotes are questioned less, and where a client needs to reduce cost they can remove a line rather than ask for a blanket discount.

Work through:

| Element | Include when |
|---|---|
| Design | New look, or no usable brand assets exist |
| Build | Always. The core page or feature construction |
| Content | Copywriting or stock imagery, where the client is not supplying it |
| Integrations | Payments, bookings, mailing lists, analytics |
| Domain | Registration or transfer, where not already owned |
| Hosting setup | Initial configuration, distinct from any ongoing fee |
| Email setup | Mailboxes on the client's domain |
| Testing | Cross-browser and mobile checks |
| Handover | Training the client to use a CMS, where applicable |

State ongoing costs — hosting, domain renewal, maintenance — separately from the once-off build. A client surprised by a renewal a year later remembers it.

### 5.3 Apply contingency

Add contingency in proportion to uncertainty:

| Situation | Suggested |
|---|---|
| Well-defined static site, content supplied | 10% |
| CMS build, or content partly outstanding | 15–20% |
| Web application, or integration with a third-party system | 25%+ |

Contingency is absorbed into line prices, not shown as a separate line.

### 5.4 Set validity

Set an expiry date on every quote. Thirty days is the proposed default (§10). Validity protects you against cost changes and gives the client a reason to decide.

## 6. Procedure

### 6.1 Prepare the quote

1. Sign in at `https://beplugged.co.za/admin/` and open **Quotes**.
2. Enter the client name, email, and address.
3. Add line items — description, quantity, rate, and any discount. Descriptions should be meaningful to the client, not internal shorthand.
4. Enter tax if applicable (§10).
5. Set the **expiry date**.
6. Use the notes field for what is **excluded**, assumptions the price depends on, and payment terms.
7. Save. The quote is created as **draft** with a number in the form `QUOTE-YYYY-XXXXXXXX`.

### 6.2 Review before issuing

Confirm:

1. Every requirement confirmed under SOP-CLI-001 is priced.
2. Exclusions are written down, not merely understood.
3. The total is one you would still be content to deliver at in three months.
4. The expiry date is set.

This is the last point at which the quote can be changed. Once issued it is locked.

### 6.3 Issue and share

1. Select **Issue**. The status moves to **sent** and the quote becomes available at its public link, with a QR code.
2. Select **Send**. The client is emailed the quote with a link to view it, and a copy is retained at `info@beplugged.co.za`.
3. Record in the lead notes that the quote was issued and when.
4. Move the lead to stage **Proposal** and set its follow-up date to the quote expiry date.

Suggested accompanying message:

> Thanks for your patience. Your quote is ready: [link]
>
> It covers [one-line summary] and is valid until [expiry date]. The full breakdown is on the link. Happy to walk through it or adjust the scope if you would like to explore options.

### 6.4 Track

A status of **viewed** confirms the client opened the quote. A quote still showing **sent** after several days usually means the message did not reach the right person — check before assuming disinterest.

### 6.5 Follow up

| When | Action |
|---|---|
| +3 days from issue | Check whether it has been viewed. If not, resend the link |
| +7 days | Call. Ask whether the scope and price match expectations. Do not open by asking for a decision |
| Expiry − 3 days | Remind the client the quote expires shortly |
| Expiry | Move the lead to **Won** or **Lost** and record the reason |

Where a client goes quiet after viewing, the usual cause is price or a competing option. Ask directly and courteously; the answer is worth more than the deal.

### 6.6 Record the outcome

The client accepts or declines on the quote itself, which records their name, the time and the address. Update the lead to match:

- **Accepted** — lead stage **Won**. Note the quote number and accepted value in the lead notes.
- **Declined** — lead stage **Lost**, with the reason.

Acceptance recorded on the quote is the written agreement. Do not start work on a verbal yes with the quote still showing **viewed**.

### 6.7 Convert to a project

Select **Start project** on the accepted quote. This creates the project, optionally raises the deposit as a draft invoice, and links the quote, project and invoice to each other. Then:

1. Name the project for the work rather than the document. It is what the client sees on their progress link.
2. Choose the deposit percentage, or none where the full amount is invoiced on completion.
3. Review the draft deposit invoice before sending it (SOP-FIN-001 §6.2).
4. Where further invoices are needed, raise them against the same project so the totals roll up.

## 7. Discounts

- Discount at line level so the reduction is visible against what it applies to.
- Give a reason for any discount in the notes — volume, repeat client, reduced scope.
- Prefer removing scope over cutting price. A discount without a scope change teaches the client that the first number was inflated.
- Discounts above the threshold in §10 require approval.

## 8. Revising a quote

An issued quote cannot be edited. Where the price or scope changes:

1. Create a **new** quote with the revised scope.
2. Reference the superseded quote number in the notes.
3. Issue the new quote and tell the client plainly which one now applies.
4. Leave the original in place — it is the record of what was originally offered.

Do not delete superseded quotes. The system permits deletion only while a quote is in draft, which preserves this history by design.

## 9. What the system records

Sending, acceptance and conversion are all handled in the system, so the
commercial history of a quote does not depend on anyone's memory.

**Quotes are emailed** through Brevo with a copy retained at
`info@beplugged.co.za`, as invoices and receipts are.

**Acceptance is recorded on the quote**: who accepted it, when, and from
what address. Declining records the reason where the client gives one. An
expired quote cannot be accepted, and neither decision can be reversed by
the client. Win rate is therefore answerable from the quotes themselves.

**An accepted quote becomes a project** through Start project, which also
raises the deposit invoice where one applies and links the three records.

## 10. Items to confirm before approval

Proposed defaults. Confirm, then remove this section at version 1.1.

- **Validity period** — proposed: 30 days.
- **Hourly rate** — the rate used where time and materials applies.
- **Minimum project value** — below which work is declined or referred on.
- **Deposit** — the percentage invoiced before work begins.
- **Revision allowance** — how many rounds of changes are included before further work is chargeable. State this in every quote; it is the most common source of scope creep.
- **Second-approver threshold** — the quote value above which a second person approves.
- **Discount authority** — the discount percentage above which approval is required.
- **VAT** — whether Beplugged Tech is VAT-registered, and the rate applied.

## 11. Related documents

- SOP-CLI-001 — Client Onboarding and Requirements Capture
- SOP-FIN-001 — Invoicing and Collections
- SOP-DEL-001 — Project Delivery

## 12. Revision history

| Version | Date | Author | Change |
|---|---|---|---|
| 1.0 | 2026-07-28 | Gerald Rushwaya | Initial draft |
| 1.1 | 2026-07-29 | Gerald Rushwaya | Quote sending, acceptance and conversion to a project are now handled in the system; sections 6.3, 6.6, 6.7 and 9 rewritten accordingly |
| 1.1 | 2026-08-07 | Gerald Rushwaya | Reviewed and approved for issue. No change to the procedure. In operational use since 2026-07-28; records from that period are retained and remain valid evidence that the procedure was followed |
