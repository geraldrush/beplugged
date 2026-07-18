# Invoicing System - Feature Overview & Configuration

## 📦 What's Included

Your complete invoicing system includes:

### Core Components

**Backend (Cloudflare Workers)**
- ✅ RESTful API with authentication
- ✅ D1 SQLite database integration
- ✅ QR code generation (qrcode library)
- ✅ Same-origin CORS handling
- ✅ Error handling & validation

**Frontend (Admin Dashboard)**
- ✅ Modern, responsive interface
- ✅ Bootstrap-based design
- ✅ Tabbed navigation
- ✅ Modal dialogs for quick actions
- ✅ Real-time status updates

**Database**
- ✅ Invoices table with full tracking
- ✅ Quotes table (separate management)
- ✅ Clients management system
- ✅ Line items support
- ✅ Payment history tracking
- ✅ Audit log for operational events
- ✅ Performance indexes

**Public Pages**
- ✅ Invoice viewing page (no login)
- ✅ Quote viewing page (no login)
- ✅ QR code scannable URLs
- ✅ Print & download ready
- ✅ Responsive design

---

## 🔧 Configuration Guide

### 1. Database Setup

**Create Database:**
```bash
npx wrangler d1 create invoicing
```

The output will show:
```
✅ Successfully created your D1 database
Database Name: invoicing
Database ID: 12345678-1234-1234-1234-123456789012
```

**Add to wrangler.toml:**
```toml
[[d1_databases]]
binding = "DB"
database_name = "invoicing"
database_id = "12345678-1234-1234-1234-123456789012"
```

**Initialize Schema:**
```bash
npm run db:init
```

Or with local testing:
```bash
npx wrangler d1 execute invoicing --file src/schema.sql --local
```

### 2. Admin Secrets

**Set Password:**
```bash
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put SESSION_SECRET
```

Use `ADMIN_PASSWORD` for login and a separate long random `SESSION_SECRET` for signing expiring sessions.

**Verify It's Set:**
```bash
npx wrangler secret list
```

**Change Password:**
Simply run the secret put command again with a new password.

### 3. Optional: Email Integration

Invoice sending uses Brevo:

```bash
npx wrangler secret put BREVO_API_KEY
```

Set these runtime variables:

```toml
BREVO_SENDER_EMAIL = "noreply@yourdomain.com"
BREVO_SENDER_NAME = "Beplugged Tech"
BREVO_REPLY_TO = "hello@yourdomain.com"
```

### 4. Custom Configuration

**Branding/Company Info**

Edit `public/admin/index.html`:
```html
<div class="navbar-brand">
  <i class="fas fa-file-invoice-dollar"></i> YOUR_COMPANY_NAME
</div>
```

Edit `public/invoices/index.html`:
```html
<div class="invoice-header">
  <h1>YOUR_COMPANY_NAME</h1>
  <!-- Add logo here -->
</div>
```

**Color Scheme**

Change in `public/admin/index.html`:
```css
:root {
  --primary: #0066cc;        /* Main blue */
  --success: #28a745;        /* Green */
  --danger: #dc3545;         /* Red */
  --warning: #ffc107;        /* Yellow */
}
```

**Invoice Template Customization**

Edit `public/invoices/index.html` to add:
- Company logo
- Business registration details
- Bank account info
- Payment instructions
- Custom footer

---

## 📊 Database Reference

### invoices Table
```sql
CREATE TABLE invoices (
  id TEXT PRIMARY KEY,
  invoice_number TEXT NOT NULL UNIQUE,    -- INV-2024-123456
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_address TEXT,
  amount NUMERIC NOT NULL,
  amount_cents INTEGER NOT NULL DEFAULT 0,
  tax NUMERIC DEFAULT 0,
  tax_cents INTEGER NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'draft',            -- draft, sent, viewed, partially_paid, paid
  created_at DATETIME DEFAULT NOW(),
  due_date DATE,
  payment_terms TEXT,                     -- "Net 30"
  items TEXT,                             -- JSON string
  notes TEXT,
  qr_code_url TEXT                        -- Data URL of QR code
);
```

**Status Workflow:**
- `draft` → Admin editing, not sent
- `sent` → Sent to client
- `viewed` → Client opened invoice
- `partially_paid` → Some payment received
- `paid` → Payment received

### quotes Table
Similar to invoices but:
- `expiry_date` instead of `due_date`
- Status: draft, sent, viewed, accepted, rejected, converted_to_invoice

### clients Table
```sql
CREATE TABLE clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT,
  created_at DATETIME
);
```

---

## 🛠️ Development Guide

### Project Structure
```
src/
├── index.js              # Main Worker - handles all API routes
└── schema.sql            # Database schema

public/
├── admin/
│   ├── index.html        # Dashboard (tabs: dashboard, invoices, quotes, clients)
│   └── login.html        # Login page
└── invoices/
    ├── index.html        # Invoice viewer
    └── quote.html        # Quote viewer

wrangler.toml             # Config file
package.json              # Dependencies & scripts
```

### API Flow

**Admin Operations:**
1. User logs in with password → gets auth token
2. Signed expiring token stored in sessionStorage
3. All admin requests include: `Authorization: Bearer <token>`
4. API validates signature and expiry before allowing changes

**Invoice Creation Flow:**
1. Admin fills form → POST `/api/admin/invoices`
2. Server generates unique ID & invoice number
3. Server generates QR code (using qrcode library)
4. QR code points to: `/invoices/index.html?id={id}`
5. Invoice stored as a draft in D1 with QR code URL
6. Admin can edit/delete while draft, then issue by downloading, printing, or sending

**Client Viewing:**
1. Client scans QR code
2. Opens `/invoices/index.html?id={id}` (no auth needed)
3. Server returns issued invoices only and marks `sent` as `viewed`
4. Invoice displayed in browser
5. Client can print or download

---

## 🚀 Deployment Checklist

- [ ] Database created and schema initialized
- [ ] Admin password and session secret set via `wrangler secret put`
- [ ] wrangler.toml updated with database_id
- [ ] Local testing works (`npm run dev`)
- [ ] Ready for `npm run deploy`

**After Deploy:**
- [ ] Admin URL updated in bookmarks
- [ ] Created test client
- [ ] Created test invoice
- [ ] Scanned QR code to verify public page
- [ ] Password works for login

---

## 📈 Scaling Considerations

**Free Tier Limits:**
- 100,000 requests/day (Cloudflare Workers)
- 5GB storage (D1)
- Unlimited read/write operations (D1)

**This supports:**
- Creating ~50-100 invoices/day
- ~1000 invoices total
- ~10,000+ client views/day

**For higher volumes:**
- Cloudflare offers paid plans with higher limits
- D1 can scale to 1TB+ with paid plans
- No code changes needed!

---

## 🔒 Security Notes

⚠️ **Current Implementation:**
- Password login with signed expiring admin sessions
- Same-origin CORS for API responses
- No rate limiting (add if needed)

✅ **Production Hardening (Optional):**
```javascript
// Add rate limiting
// Add request logging
// Add HTTPS-only enforcement
// Rotate SESSION_SECRET if a session token leaks
// Add SQL injection prevention (already using prepared statements)
```

---

## 📞 Troubleshooting

### QR Code Not Displaying

**Check:**
1. Invoice created successfully (check database)
2. qrcode npm package installed (`npm list qrcode`)
3. Browser console has no JS errors (F12)

**Fix:**
```bash
npm install qrcode
npm run deploy
```

### Database Connection Error

**Check:**
```bash
# List databases
npx wrangler d1 list

# Test query
npx wrangler d1 execute invoicing --command "SELECT COUNT(*) FROM invoices"
```

### Admin Login Not Working

**Check:**
```bash
# Verify secret is set
npx wrangler secret list

# Should show ADMIN_PASSWORD in list
```

**Fix:**
```bash
npx wrangler secret put ADMIN_PASSWORD
# Enter password again
npm run deploy
```

### Invoices Not Showing in List

**Check:**
1. Are you logged in? Check browser console
2. Is the auth token present? `sessionStorage`
3. Did you create test invoices?

**Debug:**
```bash
# Check invoices in database
npx wrangler d1 execute invoicing --command "SELECT COUNT(*) FROM invoices"

# Reset if needed
npx wrangler d1 execute invoicing --command "DELETE FROM invoices"
```

---

## 🎓 Learning Resources

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [D1 Documentation](https://developers.cloudflare.com/d1/)
- [Wrangler CLI Guide](https://developers.cloudflare.com/workers/wrangler/)
- [qrcode.js Library](https://davidshimjs.github.io/qrcodejs/)

---

**Questions? Check INVOICING_SETUP.md for more details!**
