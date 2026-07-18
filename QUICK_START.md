# Quick Start - Invoicing System

Get your invoicing system running in 5 minutes!

## ⚡ Quick Setup (5 Minutes)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Create D1 Database
```bash
npx wrangler d1 create invoicing
```

Pick a unique name. Copy the `database_id` from the output.

### Step 3: Update wrangler.toml
Find the line with `database_id` and paste your ID:
```toml
[[d1_databases]]
binding = "DB"
database_name = "invoicing"
database_id = "PASTE_YOUR_ID_HERE"  # ← Update this
```

### Step 4: Set Admin Password
```bash
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put SESSION_SECRET
```
Enter a secure password for `ADMIN_PASSWORD`, and a different long random value for `SESSION_SECRET`.

### Step 5: Initialize Database
```bash
npx wrangler d1 execute invoicing --file src/schema.sql
```

### Step 6: Run Locally
```bash
npm run dev
```

Open your browser:
- **Admin**: http://localhost:8787/admin/login.html (use your password)
- **Public invoice page**: http://localhost:8787/invoices/index.html?id=INVOICE_ID

## 🚀 Deploy to Cloudflare

```bash
npm run deploy
```

Your site will be live at: `https://YOUR_WORKER_NAME.workers.dev`

Update the admin URL in your browser and start using it!

## 📋 What's Included

✅ **Admin Dashboard** - Full invoicing system  
✅ **API Backend** - RESTful API for all operations  
✅ **QR Code Generation** - Auto-generated on every invoice/quote  
✅ **Public Invoice Viewer** - Clients scan QR to view issued invoices (no login)
✅ **Payment Receipts** - Record payments and generate receipt PDFs
✅ **Database** - SQLite with D1 (5GB free)
✅ **Authentication** - Signed expiring admin sessions

## 🎯 First Steps

1. **Create a client** → Go to "Clients" tab → Add client info
2. **Create an invoice** → Go to "Invoices" tab → Fill form
3. **View QR code** → Click "View" on the invoice
4. **Issue the invoice** → Download, print, or send email to lock the draft
5. **Share with client** → Print the QR, email, or send the public link

Clients scan the QR code and see their issued invoice instantly.

## 💡 Pro Tips

- **Drafts stay private** - Downloading, printing, or sending issues and locks them
- **QR codes work after issue** - No email setup needed
- **Invoice status tracking** - Automatically marked as viewed when client opens
- **All data is in D1** - Never lose an invoice (D1 handles backups)
- **Totally free** - Cloudflare free tier covers everything

## ❓ Common Questions

**Q: How do I send invoices by email?**
A: Configure Brevo with `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, and optional sender/reply-to values, then use the Send button in the admin invoice view.

**Q: Can I change the password?**
A: Yes! Run: `npx wrangler secret put ADMIN_PASSWORD`

**Q: How many invoices can I send?**
A: Unlimited within Cloudflare free limits (100k requests/day)

**Q: Can clients download PDFs?**
A: Yes. The public invoice, quote, and receipt pages include PDF download actions.

**Q: Where is my data stored?**
A: In Cloudflare D1 (your own database, not shared with anyone)

## 📞 Need Help?

1. Check [INVOICING_SETUP.md](INVOICING_SETUP.md) for detailed docs
2. See troubleshooting section in that file
3. Check browser console (F12) for error messages

---

**Happy invoicing! 🎉**
