# SOP-CLI-001 — Client Onboarding and Requirements Capture

| | |
|---|---|
| **Document reference** | SOP-CLI-001 |
| **Version** | 1.1 |
| **Status** | Approved — in force |
| **Approved** | 2026-08-07 by Gerald Rushwaya |
| **Category** | Client |
| **Owner** | Gerald Rushwaya |
| **Approver** | Gerald Rushwaya |
| **Effective date** | 2026-07-28 |
| **Next review** | 2027-07-28 |
| **Supersedes** | — |

---

## 1. Purpose

To capture enough information from a prospective client, early and in writing, to quote accurately and build the right thing first time. Most website projects overrun because something was assumed rather than asked. This procedure removes the assumptions before a price is given.

## 2. Scope

Applies to every new website or web application enquiry, from first contact to either a won project or a closed lost lead.

**In scope:** logging enquiries, issuing the intake questionnaire, qualifying, discovery, and handover to quoting.

**Out of scope:** producing the quote itself (SOP-FIN-002) and delivery (SOP-DEL-001).

## 3. Pipeline stages

Every enquiry is recorded as a lead in the admin system and moves through these stages. The stage is the single indicator of where a client stands — keep it current.

| Stage | Meaning | Exit condition |
|---|---|---|
| **New** | Enquiry received, not yet contacted | Questionnaire sent |
| **Qualified** | Questionnaire returned, work is viable and within capability | Discovery booked or requirements clear |
| **Meeting** | Discovery call scheduled or held | Requirements understood |
| **Requirements** | Scope confirmed in writing with the client | Ready to price |
| **Proposal** | Quote issued, awaiting decision | Client accepts or declines |
| **Won** | Quote accepted | Project created, deposit invoiced |
| **Lost** | Client declined or went silent | Reason recorded |

## 4. Roles

| Role | Responsibility |
|---|---|
| **Lead owner** | Responds to the enquiry, issues the questionnaire, keeps the stage and follow-up date current |
| **Technical reviewer** | Confirms the work is within capability and flags anything that changes the estimate materially |

Where Beplugged Tech operates as a single person, both roles are held by the owner.

## 5. Procedure

### 5.1 Log the enquiry — stage: New

1. Enquiries arrive by the website contact form (delivered to `info@beplugged.co.za`), WhatsApp, phone, or referral.
2. Create a lead in the admin system within **one business day**. Record company name, contact name, email, phone, and **source** — source is what tells you later which channels are worth your time.
3. Set a next follow-up date.

> Respond to every enquiry within one business day even if only to acknowledge it. Response speed is the single strongest signal a prospective client has about how you will work.

### 5.2 Issue the intake questionnaire

1. Open the lead and select **Questionnaire**, then **Send by email**. The client receives a personal link that expires after 30 days. Appendix A is the wording, kept here so it can be sent by hand where a client prefers WhatsApp.
2. Say how long it takes — around five minutes — and why it exists: so the quote is accurate rather than padded with guesses.
3. The send is recorded automatically, and the answers appear against the lead once submitted.

### 5.3 Follow up

| When | Action |
|---|---|
| +3 days | Polite reminder in the same channel |
| +7 days | Offer to complete it together over a short call — some clients would rather talk than type |
| +14 days | Mark **Lost**, reason "no response". Send a brief closing note leaving the door open |

Do not chase indefinitely. A lead that will not answer eight questions will not answer questions during a build.

### 5.4 Qualify — stage: Qualified

On receiving the answers, assess:

1. **Capability** — is this within what Beplugged Tech can deliver well?
2. **Budget alignment** — does the indicated budget match the type of build requested? A web application on a static-site budget must be resolved now, not after a quote is refused.
3. **Timeline** — is the deadline achievable alongside current commitments?
4. **Completeness** — are answers missing or contradictory? Resolve before quoting.

Record an **estimated value** on the lead. A rough figure is far more useful than a blank field when reviewing the pipeline.

If the work is not viable, say so promptly and courteously, and record the reason on the lead. A clean early decline protects your reputation and your calendar.

### 5.5 Discovery — stage: Meeting

Hold a call where the answers are unclear, the build is a web application, or the value justifies it.

Confirm during the call:

- What "finished" looks like to the client
- Who on their side approves decisions and signs off
- Who is supplying text and images, and by when
- Whether anything must be live by a fixed, immovable date

Write up the outcome in the lead notes the same day.

### 5.6 Confirm requirements — stage: Requirements

1. Write the scope back to the client in plain language: pages, features, what is included, and what is explicitly excluded.
2. Create a scope agreement from the requirement and send it for signature. The client ticks a confirmation and types their name, and the name, time, address and a fingerprint of the exact text are recorded. Verbal agreement is not sufficient, and neither is an email that could later be disputed.
3. Record the confirmation against the lead.

The exclusions matter as much as the inclusions. Most scope disputes concern something never discussed rather than something described badly.

### 5.7 Quote — stage: Proposal

Hand over to SOP-FIN-002. Set the lead's follow-up date to the quote expiry date.

### 5.8 Outcome

- **Accepted** — set to **Won**, create the project, and invoice the deposit per SOP-FIN-001.
- **Declined or silent** — set to **Lost** and record the reason. Review lost reasons quarterly; a pattern in them is worth more than any single lost deal.

## 6. Records

| Record | Where | Retained |
|---|---|---|
| Lead, stage history, notes | Admin system (D1) | 3 years |
| Questionnaire responses | Admin system (D1), against the lead | 3 years |
| Signed scope confirmation | Admin system (D1), with a copy emailed to both parties | 5 years |
| Enquiry emails | `info@beplugged.co.za` | 3 years |

Personal information collected through this process is held only for as long as it is needed and is not shared with third parties (§8).

## 7. Items to confirm before approval

Proposed defaults. Confirm, then remove this section at version 1.1.

- **Response target** — proposed: one business day.
- **Chase cadence** — proposed: 3, 7, and 14 days before closing as lost.
- **Minimum project value** — the figure below which an enquiry is politely declined or referred on.
- **Deposit** — the percentage required before work begins.
- **Discovery calls** — whether these are free, and whether they are offered on every enquiry or only above a value threshold.

## 8. POPIA note

The questionnaire collects personal information — names, phone numbers, email addresses. Under the Protection of Personal Information Act, that carries obligations: collect only what is needed, use it only for the purpose it was given, keep it secure, and delete it when it is no longer needed.

In practice, for a business of this size:

- Do not pass client contact details to third parties without permission.
- Delete lead data for lost enquiries once the retention period expires.
- Ensure any website you build that collects personal information has a privacy policy. This is worth raising with clients during discovery — it is a requirement they frequently do not know about, and knowing it marks you out as professional.

## 9. Related documents

- SOP-FIN-001 — Invoicing and Collections
- SOP-FIN-002 — Quoting and Pricing
- SOP-DEL-001 — Project Delivery

---

## Appendix A — Client intake questionnaire

Copy and paste as-is. Formatting is WhatsApp-ready; asterisks render as bold. For email, replace `*text*` with actual bold.

---

Thanks for reaching out about a website.

To give you an accurate quote and build what you actually need, could you answer these few questions? It takes about five minutes.

*1. What type of website do you need?*
A — Static: information only, a few simple pages
B — Dynamic: blog or CMS, you can update the content yourself
C — Web app: logins, payments, dashboards, bookings

*2. What is the main purpose of the site?*
For example: sell products, show a portfolio, generate leads, company information

*3. Roughly how many pages do you need?*
For example: Home, About, Services, Contact

*4. Do you have a logo?*
Yes / No
If yes, do you have the original design files? (`.ai`, `.svg`, `.eps`, or a high-resolution PNG)

*5. Do you have brand colours or a look in mind?*
Yes — please share them / No — happy for me to suggest

*6. Domain name*
Do you already own one? Yes / No
If yes: what is it, and do you have login access to where it was registered?

*7. Hosting and email*
Do you already have hosting? Yes / No
Do you need email addresses on your domain, e.g. `info@yourbusiness.co.za`? Yes / No

*8. Who will supply the content?*
Text and images — you, or should I include copywriting and stock imagery in the quote?

*9. Contact details to display on the site*
Phone:
Email:
WhatsApp:
Address (if you want it shown):
Social media links:

*10. Timeline and budget*
Is there a date this needs to be live by?
What budget range do you have in mind? — a range is fine, it helps me recommend the right approach rather than guess

*11. Anything else?*
Websites you like the look of, features you have in mind, anything you definitely want to avoid

---

## Appendix B — Reading the answers

| Answer | What it tells you |
|---|---|
| **Q1 = A** | Static build. Fastest and cheapest. Confirm they genuinely will not need to edit content themselves — clients often say A and mean B. |
| **Q1 = B** | Needs a CMS. Factor in a handover session teaching them to use it, or you will be doing their edits unpaid for a year. |
| **Q1 = C** | Web application. Requires discovery (§5.5) before any price is given. Never quote a web app from a questionnaire alone. |
| **Q3 blank or "not sure"** | Scope is undefined. Resolve before quoting — page count is a primary cost driver. |
| **Q4 = No logo** | Add design cost, or price a basic wordmark. Ask whether they want branding as part of the project. |
| **Q4 = Yes, no source files** | Common. A low-resolution PNG will look poor on a large screen. Budget for a redraw. |
| **Q6 = owns domain, no access** | Frequent and disruptive. Recovering access can take days or weeks. Start it immediately, in parallel with everything else. |
| **Q7 = needs email** | Adds a mail service to set up and cost. Do not assume it is included in hosting. |
| **Q8 = client supplies content** | The single most common cause of stalled projects. Set a date by which content is due and state in the quote what happens if it is late. |
| **Q10 no budget given** | Ask again, offering ranges rather than a blank field. If they still will not indicate one, quote the smallest sensible scope and present options above it. |
| **Q10 fixed launch date** | Check it against current commitments before quoting. If it cannot be met, say so now. |

### Changes from the original questionnaire

Your original eight questions covered the essentials. Four additions, each closing a gap that commonly costs money later:

1. **Page count (Q3)** — a primary cost driver that was previously only implied under "anything else".
2. **Logo source files (Q4)** — "yes I have a logo" and "yes I have a usable logo" are different answers.
3. **Domain and hosting access (Q6, Q7)** — owning a domain is not the same as being able to point it. Access problems surface at the worst possible moment.
4. **Content ownership (Q8)** — the most common reason a project stalls after the deposit is paid.

Timeline and budget were also lifted out of the catch-all question into their own item, since they are the two answers that most determine whether a lead is worth pursuing.

## 10. Revision history

| Version | Date | Author | Change |
|---|---|---|---|
| 1.0 | 2026-07-28 | Gerald Rushwaya | Initial draft. Questionnaire based on the existing client intake questions, extended per Appendix B. |
| 1.1 | 2026-07-29 | Gerald Rushwaya | The questionnaire is now emailed from the system and requirements are confirmed by a signed scope agreement; sections 5.2, 5.6 and 6 updated |
| 1.1 | 2026-08-07 | Gerald Rushwaya | Reviewed and approved for issue. No change to the procedure. In operational use since 2026-07-28; records from that period are retained and remain valid evidence that the procedure was followed |
