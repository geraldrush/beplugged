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
```
Enter a secure password when prompted.

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
- **Public**: http://localhost:8787/api/invoice/inv_12345

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
✅ **Public Invoice Viewer** - Clients scan QR to view (no login)  
✅ **Database** - SQLite with D1 (5GB free)  
✅ **Authentication** - Simple password protection  

## 🎯 First Steps

1. **Create a client** → Go to "Clients" tab → Add client info
2. **Create an invoice** → Go to "Invoices" tab → Fill form
3. **View QR code** → Click "View" on the invoice
4. **Share with client** → Print the QR or email

Clients scan the QR code and see their invoice instantly!

## 💡 Pro Tips

- **QR codes work immediately** - No email setup needed!
- **Invoice status tracking** - Automatically marked as viewed when client opens
- **All data is in D1** - Never lose an invoice (D1 handles backups)
- **Totally free** - Cloudflare free tier covers everything

## ❓ Common Questions

**Q: How do I send invoices by email?**
A: Email integration coming soon! For now, use the QR code or send the link directly.

**Q: Can I change the password?**
A: Yes! Run: `npx wrangler secret put ADMIN_PASSWORD`

**Q: How many invoices can I send?**
A: Unlimited within Cloudflare free limits (100k requests/day)

**Q: Can clients download PDFs?**
A: They can use "Print to PDF" in their browser for now.

**Q: Where is my data stored?**
A: In Cloudflare D1 (your ownCulture database, not shared with anyone)

## 📞 Need Help?

1. Check [INVOICING_SETUP.md](INVOICING_SETUP.md) for detailed docs
2. See troubleshooting section in that file
3. Check browser console (F12) for error messages

---

**Happy invoicing! 🎉**
