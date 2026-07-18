# Invoicing System Setup Guide

Complete invoicing system for managing invoices and quotes with QR code support on Cloudflare Workers + D1.

## Features

✅ **Admin Dashboard** - Manage invoices, quotes, and clients  
✅ **Invoice Management** - Create drafts, issue, send, track, and receipt invoices
✅ **Quote Management** - Create drafts, issue, and manage client quotes
✅ **QR Codes** - Auto-generated QR codes on all invoices/quotes  
✅ **Client Portal** - Public pages to view invoices and quotes (no login required)  
✅ **Public Viewing** - Clients can scan QR code to view on any device
✅ **Payment Receipts** - Record payments and generate public receipt PDFs
✅ **Free Hosting** - Uses Cloudflare's free tier (Workers + D1)  
✅ **Database** - SQLite via Cloudflare D1 (free tier available)  

## Quick Start

### 1. Prerequisites

- Node.js 18+ installed
- Cloudflare account (free plan works!)
- GitHub for version control (optional but recommended)

### 2. Install Wrangler

```bash
npm install -D wrangler
```

### 3. Set Up D1 Database

```bash
# Create a new D1 database
npx wrangler d1 create invoicing

# Initialize the schema
npx wrangler d1 execute invoicing --file src/schema.sql
```

This will give you a `database_id`. Add it to your `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "invoicing"
database_id = "YOUR_DATABASE_ID_HERE"
```

### 4. Configure Environment Variables

Create `.wrangler.toml` environment config (or use wrangler secret commands):

```bash
# Set admin password (you'll use this to login)
npx wrangler secret put ADMIN_PASSWORD

# Recommended: separate secret used to sign expiring admin sessions
npx wrangler secret put SESSION_SECRET
```

### 5. Test Locally

```bash
npx wrangler dev
```

The app will be available at `http://localhost:8787`

- Admin Login: `http://localhost:8787/admin/login.html`
- Public Invoice View: `http://localhost:8787/invoices/index.html?id={invoiceId}`
- Public Quote View: `http://localhost:8787/invoices/quote.html?id={quoteId}`

### 6. Deploy to Cloudflare

```bash
npm run deploy
```

Or manually:

```bash
npx wrangler deploy
```

Your site will be live at: `https://your-worker.workers.dev`

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with password

### Invoices (Admin Only)
- `GET /api/admin/invoices` - List all invoices
- `GET /api/admin/invoices/{id}` - Get single invoice
- `POST /api/admin/invoices` - Create draft invoice
- `POST /api/admin/invoices/{id}/issue` - Issue and lock draft invoice
- `POST /api/admin/invoices/{id}/send` - Send issued invoice email via Brevo
- `PUT /api/admin/invoices/{id}` - Update draft invoice
- `DELETE /api/admin/invoices/{id}` - Delete invoice (draft only)
- `GET /api/admin/invoices/{id}/payments` - List invoice payments
- `POST /api/admin/invoices/{id}/payments` - Record payment
- `DELETE /api/admin/invoices/{id}/payments/{paymentId}` - Delete payment

### Quotes (Admin Only)
- `GET /api/admin/quotes` - List all quotes
- `GET /api/admin/quotes/{id}` - Get single quote
- `POST /api/admin/quotes` - Create draft quote
- `POST /api/admin/quotes/{id}/issue` - Issue and lock draft quote
- `PUT /api/admin/quotes/{id}` - Update draft quote
- `DELETE /api/admin/quotes/{id}` - Delete quote (draft only)

### Clients (Admin Only)
- `GET /api/admin/clients` - List all clients
- `POST /api/admin/clients` - Add new client

### Public Viewing (No Auth Required)
- `GET /api/invoice/{invoiceId}` - View issued invoice (marks `sent` as `viewed`)
- `GET /api/quote/{quoteId}` - View issued quote (marks `sent` as `viewed`)
- `GET /api/receipt/{paymentId}` - View payment receipt

### Dashboard
- `GET /api/admin/dashboard` - Dashboard statistics

## Admin Dashboard Features

### Dashboard Tab
- View key metrics (total invoices, quotes, revenue, pending)
- See recent invoices

### Invoices Tab
- Create new invoices
- View invoice details with QR code
- Download, print, or send invoices to issue and lock drafts
- Record partial or full payments
- Delete draft invoices
- Track invoice status (draft → sent → viewed → partially_paid → paid)

### Quotes Tab
- Create new quotes
- View quote details with QR code
- Download or print quotes to issue and lock drafts
- Track quote status (draft → sent → viewed → accepted/rejected)

### Clients Tab
- Add new clients
- View client list
- See client details

## Client Workflow

1. **Admin creates invoice/quote draft** in dashboard
2. **System generates QR code** automatically
3. **Admin issues the document** by downloading, printing, or sending it
4. **Admin sends QR code or link to client** (via email, print, etc.)
5. **Client scans QR code** with phone
6. **Invoice/quote opens in browser** - no login needed
7. **Client can print or download**

## File Structure

```
src/
├── index.js              # Main Worker API
├── schema.sql            # Database schema

public/
├── admin/
│   ├── index.html        # Admin dashboard
│   └── login.html        # Admin login
└── invoices/
    ├── index.html        # Invoice viewer
    └── quote.html        # Quote viewer

wrangler.toml             # Cloudflare Workers config
```

## Database Schema

### Tables
- `invoices` - Invoice records with QR codes
- `quotes` - Quote records with QR codes
- `clients` - Client information
- `invoice_items` - Line items for invoices
- `payments` - Payment tracking
- `audit_logs` - Operational history for document and payment events
- Indexes for performance

## Customization

### Change Admin Password
```bash
npx wrangler secret put ADMIN_PASSWORD
```

### Change Session Signing Secret
```bash
npx wrangler secret put SESSION_SECRET
```

### Branding
Edit colors in:
- `public/admin/index.html` - CSS variables in `<style>`
- `public/invoices/index.html` - Header/footer styling
- `public/invoices/quote.html` - Quote header color

### Company Info
Add to invoice templates in `public/invoices/index.html`:
- Company logo
- Contact info
- Business registration details
- etc.

## Free Tier Limits

**Cloudflare Workers:**
- 100,000 requests/day
- Unlimited subrequests
- No domain limit

**Cloudflare D1:**
- 5 Databases
- 5GB storage per database
- Unlimited read/write operations

This easily handles small to medium invoicing volumes!

## Sending Emails

Invoice email sending uses Brevo.

```bash
npx wrangler secret put BREVO_API_KEY
```

Set these variables in `wrangler.toml` or your deployment environment:

```toml
BREVO_SENDER_EMAIL = "noreply@yourdomain.com"
BREVO_SENDER_NAME = "Beplugged Tech"
BREVO_REPLY_TO = "hello@yourdomain.com"
```

After those values are set, open an invoice in the admin dashboard and click **Send Email**. Draft invoices are issued only after Brevo accepts the send request.

## Migration from Existing PHP

If you have existing invoice data in PHP/MySQL:

1. Export data as JSON
2. Create migration script in D1
3. Import into `invoices` table

Contact support for help with migrations!

## Troubleshooting

### QR Code Not Showing
- Check that `qrcode` npm package is installed
- Verify invoice was created successfully
- Check browser console for errors

### Database Error
- Verify database_id in wrangler.toml is correct
- Run `npx wrangler d1 execute invoicing --file src/schema.sql` again
- Check D1 dashboard for quota

### Login Not Working
- Verify ADMIN_PASSWORD secret is set
- Try `npx wrangler secret list` to confirm
- Redeploy after changing secrets

### QR Code Not Linking Correctly
- Check origin URL in API (should auto-detect from request)
- Verify public invoice viewing page is accessible
- Test URL directly: `https://your-worker.workers.dev/api/invoice/{id}`

## What's Next?

- [ ] Invoice reminders
- [ ] Multi-currency support
- [ ] Invoice templates/customization
- [ ] Client self-service portal
- [ ] Automated backups
- [ ] Analytics dashboard

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review Cloudflare Workers documentation
3. Check D1 database guides

## License

ISC

---

**Questions?** Contact support or open an issue on GitHub!
