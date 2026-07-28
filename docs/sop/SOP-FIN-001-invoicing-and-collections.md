# SOP-FIN-001 — Invoicing and Collections

| | |
|---|---|
| **Document reference** | SOP-FIN-001 |
| **Version** | 1.0 |
| **Status** | Draft |
| **Category** | Finance |
| **Owner** | Gerald Rushwaya |
| **Approver** | Gerald Rushwaya |
| **Effective date** | 2026-07-28 |
| **Next review** | 2027-07-28 |
| **Supersedes** | — |

---

## 1. Purpose

To define how Beplugged Tech raises, issues, and collects payment on invoices, so that every client is billed accurately and on time, every payment is recorded against the correct invoice, and the amount shown as outstanding at any moment is true.

## 2. Scope

Applies to all client invoices raised through the Beplugged Tech admin system at `https://beplugged.co.za/admin/`.

**In scope:** creating invoices, issuing and sending them, recording full and partial payments, issuing receipts, and following up on overdue amounts.

**Out of scope:** quoting (see SOP-FIN-002), supplier payments, payroll, and tax submissions.

## 3. Definitions

| Term | Meaning |
|---|---|
| **Draft** | Invoice created but not yet issued. Editable and deletable. Not visible to the client. |
| **Sent** | Invoice issued and emailed. The client can now open it. |
| **Viewed** | The client has opened the invoice link. Set automatically the first time the public page loads. |
| **Partially paid** | At least one payment recorded, balance still above zero. |
| **Paid** | Recorded payments equal the invoice total. |
| **Balance due** | Invoice total, including tax, less all recorded payments. |
| **Receipt** | Proof of a single payment. Numbered automatically as `RCPT-YYYY-XXXXXXXXXX`. |

## 4. Roles and responsibilities

| Role | Responsibility |
|---|---|
| **Invoice preparer** | Raises the invoice, confirms line items and totals against the agreed scope. |
| **Approver** | Confirms the invoice is correct before it is issued. For amounts above the review threshold (§9), must not be the same person as the preparer. |
| **Collections owner** | Monitors outstanding invoices and runs the follow-up ladder in §7. |

Where Beplugged Tech operates as a single person, all three roles are held by the owner. The approval step in §6.2 is still performed, as a deliberate re-read before issuing.

## 5. Prerequisites

Before raising an invoice, confirm:

1. The work is complete, or has reached an agreed billing milestone.
2. The client's billing email address is current.
3. A quote or written scope exists and the client accepted it.
4. Banking details on the invoice are correct (§10).

## 6. Procedure

### 6.1 Raise the invoice

1. Sign in at `https://beplugged.co.za/admin/`.
2. Open **Invoices** and select **Create Invoice**.
3. Enter the client name, billing email, and address. The email entered here is where the invoice is sent and where the receipt will go.
4. Add one line item per deliverable. Each needs a description a client would recognise, a quantity, and a rate. Avoid a single line reading "Services rendered" — itemised invoices are queried less and paid faster.
5. Apply any agreed discount at line level.
6. Enter tax if applicable (§9).
7. Set the **due date** per the agreed payment terms.
8. Confirm the banking details and the payment reference.
9. Save. The invoice is created as **draft** and assigned a number in the form `INV-YYYY-XXXXXXXX`.

### 6.2 Check and approve

1. Re-read the invoice against the quote or agreed scope.
2. Confirm the total, the due date, and the billing email.
3. Correct anything wrong now. **Once a payment is recorded the invoice can no longer be edited or deleted** — the system blocks it to protect the audit trail.

### 6.3 Issue and send

1. Select **Send**. This emails the client a branded invoice with a summary, the banking details, and a link to view and download the full invoice.
2. A copy is automatically blind-copied to `info@beplugged.co.za`. This is the file copy — do not delete it.
3. The status moves to **sent**. The invoice is now live at its public link and can no longer be deleted.

> If a client requires an invoice on their own portal or by post, still issue it here first, then attach the downloaded PDF. The system remains the record of truth.

### 6.4 Monitor

1. Check the **Invoices** list at least weekly.
2. A status of **viewed** confirms the client has opened the link. An invoice still showing **sent** several days after issue suggests the email did not reach the right person — verify the address before starting the follow-up ladder.
3. The dashboard shows total outstanding across all issued invoices.

### 6.5 Record a payment

1. Confirm the deposit has cleared in the bank account. Never record a payment from a proof-of-payment screenshot alone.
2. Open the invoice and select **Record Payment**.
3. Enter the amount received, the date it cleared, and the method. Where a payment covers several invoices, record the portion belonging to each invoice separately.
4. Save. The system will:
   - reject any amount greater than the balance due;
   - set the status to **partially paid**, or to **paid** once the balance reaches zero;
   - generate a receipt numbered `RCPT-YYYY-XXXXXXXXXX`.

> Payments are recorded in cents internally, so part-payments will not drift by rounding. If a recorded amount is wrong, delete that payment and re-enter it. Both actions are logged.

### 6.6 Issue the receipt

1. Open **Receipts** and locate the payment.
2. Select **Send**. The client receives a receipt showing the amount received, the invoice total, total paid to date, and the remaining balance.
3. A copy is blind-copied to `info@beplugged.co.za`.

Send a receipt for every payment, including part-payments. It confirms receipt and restates the outstanding balance without a separate reminder.

### 6.7 Close

An invoice is closed when its status is **paid** and a receipt has been sent for every payment against it. No further action is required.

## 7. Overdue follow-up ladder

Timings run from the **due date**. Adjust only with a documented reason.

| Stage | When | Action | Tone |
|---|---|---|---|
| 1 | Due date + 3 days | Email reminder, restate balance and banking details, re-send the invoice link | Assume oversight |
| 2 | Due date + 10 days | Telephone the client, confirm the invoice was received and approved for payment, ask for a payment date | Cooperative |
| 3 | Due date + 21 days | Written notice by email confirming the amount and the agreed payment date, referencing the call | Formal |
| 4 | Due date + 30 days | Pause further work for that client and escalate to the owner for a decision | Firm |
| 5 | Due date + 45 days | Owner decides: payment plan, formal demand, or write-off | — |

Record the outcome of each stage in the invoice notes, including who was spoken to and any date they committed to.

Where a client proposes a payment plan, capture the agreed instalments in writing and record each instalment as a separate payment as it clears.

## 8. Records

| Record | Where it is kept | Retained |
|---|---|---|
| Invoice, including line items | Admin system (D1) | 5 years |
| Payment records | Admin system (D1) | 5 years |
| Receipts | Admin system (D1) | 5 years |
| Invoice and receipt emails | `info@beplugged.co.za` mailbox | 5 years |
| Follow-up notes | Invoice notes field | 5 years |

Every create, issue, send, view, payment, and deletion is written to the system audit log automatically. Do not attempt to edit history — record a correcting entry instead.

## 9. Items to confirm before approval

The following are proposed defaults. Confirm each against how Beplugged Tech actually operates, then remove this section at version 1.1.

- **Standard payment terms** — proposed: 14 days from invoice date.
- **VAT** — whether Beplugged Tech is VAT-registered, and if so the rate applied and the VAT number shown on invoices.
- **Deposit policy** — whether an upfront percentage is required before work starts.
- **Second-approver threshold** — the invoice value above which a second person must approve.
- **Write-off authority** — who may approve writing off a debt, and above what value.

## 10. Banking details

Shown on every invoice. Verify against the company profile before issuing:

```
Bank:           FNB
Account name:   Gerald Rushwaya
Account number: 63125701268
Branch code:    250655
Reference:      The invoice number
```

Always instruct clients to use the invoice number as the payment reference. Unreferenced deposits cannot be matched reliably and delay both the receipt and the status update.

## 11. Related documents

- SOP-FIN-002 — Quoting and Pricing
- SOP-CLI-001 — Client Onboarding
- SOP-DEL-001 — Project Delivery

## 12. Revision history

| Version | Date | Author | Change |
|---|---|---|---|
| 1.0 | 2026-07-28 | Gerald Rushwaya | Initial draft |
